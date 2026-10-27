// Enunciado de un ejercicio. Con apoyo extra: una frase por renglón, los números resaltados
// y lectura frase por frase (se ilumina la frase que se está leyendo; tocar una frase la lee).

import { Fragment } from 'react';
import { useVoz } from '../servicios/voz';
import { useApp } from '../estado';
import Icono from './Icono';

/** Separa en frases sin cortar números como 1.000 ni abreviaturas como 1.º. */
export function frases(texto: string): string[] {
  return texto
    .split(/(?<=[.?!:])\s+(?=[¿¡«"A-ZÁÉÍÓÚÑ0-9$])/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/** Resalta las cantidades (12, 1.500, $2.000, 3/4) dentro de un texto. */
export function conNumeros(texto: string) {
  const partes = texto.split(/(\$?\d[\d.,/]*\d|\$?\d)/);
  return partes.map((p, k) => (k % 2 ? <strong key={k} className="num-destacado">{p}</strong> : <Fragment key={k}>{p}</Fragment>));
}

export default function Enunciado({ texto, clave, apoyo }: { texto: string; clave: string; apoyo: boolean }) {
  const voz = useVoz();
  const { ajustes } = useApp();
  if (!apoyo) return <p className="enunciado">{texto}</p>;
  const lista = frases(texto);
  const puede = voz.disponible && ajustes.audioEnunciados;
  const leerDesde = (k: number) => {
    if (k >= lista.length) return;
    voz.leer(lista[k], `${clave}-f${k}`, () => leerDesde(k + 1));
  };
  return (
    <div className="columna enunciado-apoyo" style={{ gap: 6 }}>
      <ol className="frases">
        {lista.map((f, k) => {
          const activa = voz.leyendo === `${clave}-f${k}`;
          return (
            <li key={k}>
              {puede ? (
                <button type="button" className={`frase ${activa ? 'leyendo' : ''}`} onClick={() => voz.leer(f, `${clave}-f${k}`)} aria-label={`Escuchar: ${f}`}>
                  {conNumeros(f)}
                </button>
              ) : (
                <span className="frase">{conNumeros(f)}</span>
              )}
            </li>
          );
        })}
      </ol>
      {puede && lista.length > 1 && (
        <button type="button" className="boton boton-escuchar" onClick={() => leerDesde(0)}>
          <Icono nombre="altavoz" tamano={26} /> Escuchar frase por frase
        </button>
      )}
    </div>
  );
}
