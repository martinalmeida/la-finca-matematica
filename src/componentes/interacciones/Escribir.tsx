import { useEffect, useState } from 'react';
import Lienzo from '../Lienzo';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';
import type { Trazo } from '../../contenido/cifras';
import { CONFIANZA_MINIMA, reconocerCifra, type Reconocimiento } from '../../juego/trazos';
import { useApp } from '../../estado';
import { retroError, sonar } from '../../servicios/sonido';
import Icono from '../Icono';

const ANCHO = 150;
const ALTO = 190;

type Casilla = { trazos: Trazo[]; lectura: Reconocimiento | null; elegida: number | null };

const vacia = (): Casilla => ({ trazos: [], lectura: null, elegida: null });

/** Cifra de una casilla: la que eligió el niño, o la reconocida si es clara. Null si hay duda o está vacía. */
function cifraDe(c: Casilla): number | null {
  if (c.elegida !== null) return c.elegida;
  if (!c.lectura) return null;
  return c.lectura.confianza >= CONFIANZA_MINIMA ? c.lectura.cifra : null;
}

const enDuda = (c: Casilla) => c.trazos.length > 0 && cifraDe(c) === null;

type PropsPizarra = {
  /** Casillas para escribir (una cifra en cada una). Las vacías se ignoran. */
  cifras: number;
  bloqueado?: boolean;
  /** Número revelado (tras acertar o ver la solución). */
  correcta?: number | null;
  /** Cambia cuando hay que borrar todo (p. ej., después de un intento equivocado). */
  reinicio?: number;
  textoListo?: string;
  onListo: (n: number) => void;
};

/** Casillas para escribir un número con el dedo, una cifra por casilla. */
export function PizarraNumero({ cifras, bloqueado, correcta = null, reinicio = 0, textoListo = 'Listo', onListo }: PropsPizarra) {
  const { ajustes, perfil } = useApp();
  const adulto = perfil?.rol === 'familia';
  const [casillas, setCasillas] = useState<Casilla[]>(() => Array.from({ length: cifras }, vacia));
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setCasillas(Array.from({ length: cifras }, vacia));
    setAviso(null);
  }, [cifras, reinicio]);

  const cambiar = (k: number, c: Casilla) => setCasillas((todas) => todas.map((x, j) => (j === k ? c : x)));
  const escritas = casillas.filter((c) => c.trazos.length > 0);
  const reveladas = correcta !== null ? String(correcta).padStart(cifras, ' ').slice(-cifras) : null;

  const listo = () => {
    if (casillas.some(enDuda)) {
      retroError(ajustes);
      setAviso(adulto ? 'Toque la cifra que quiso escribir en la casilla marcada.' : 'Toca la cifra que escribiste en la casilla marcada.');
      return;
    }
    const texto = casillas.map(cifraDe).filter((c) => c !== null).join('');
    if (!texto) return;
    setAviso(null);
    onListo(Number(texto));
  };

  return (
    <div className="columna pizarra">
      <div className="casillas-cifras" role="group" aria-label={adulto ? 'Escriba el número con el dedo, una cifra en cada casilla' : 'Escribe el número con el dedo, una cifra en cada casilla'}>
        {casillas.map((c, k) => {
          const cifra = cifraDe(c);
          const duda = enDuda(c);
          return (
            <div key={k} className={`casilla-cifra ${duda ? 'duda' : ''}`}>
              <Lienzo
                ancho={ANCHO}
                alto={ALTO}
                trazos={reveladas ? [] : c.trazos}
                texto={reveladas ? reveladas[k].trim() : undefined}
                deshabilitado={bloqueado}
                etiqueta={`Casilla ${k + 1}${cifra !== null ? `: ${cifra}` : ''}`}
                onTrazos={(t) => {
                  sonar('toque', ajustes.sonido);
                  cambiar(k, { trazos: t, lectura: reconocerCifra(t), elegida: null });
                  setAviso(null);
                }}
              />
              {!reveladas && (
                <div className="lectura-cifra" aria-live="polite">
                  {duda && c.lectura ? (
                    <span className="fila" style={{ gap: 6, justifyContent: 'center' }}>
                      <span className="pequeno">¿Es</span>
                      {[c.lectura.cifra, c.lectura.segunda].map((n) => (
                        <button key={n} type="button" className="boton chip-cifra" onClick={() => cambiar(k, { ...c, elegida: n })}>
                          {n}
                        </button>
                      ))}
                      <span className="pequeno">?</span>
                    </span>
                  ) : cifra !== null ? (
                    <strong className="cifra-leida">{cifra}</strong>
                  ) : c.trazos.length ? (
                    <span className="pequeno suave">Más grande, por favor</span>
                  ) : (
                    <span className="pequeno suave">&nbsp;</span>
                  )}
                  {c.trazos.length > 0 && !bloqueado && (
                    <button type="button" className="boton icono pequeno-borrar" onClick={() => cambiar(k, vacia())} aria-label={`Borrar la casilla ${k + 1}`}>
                      <Icono nombre="repetir" tamano={20} anim="no" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {aviso && (
        <p className="retro casi" role="status" style={{ margin: 0 }}>
          {aviso}
        </p>
      )}
      <button type="button" className="boton principal" onClick={listo} disabled={bloqueado || !escritas.length}>
        <Icono nombre="check" tamano={24} /> {textoListo}
      </button>
    </div>
  );
}

/** Respuesta escribiendo el número con el dedo (1.º); siempre se puede pasar al teclado. */
export default function Escribir(props: PropsInteraccion) {
  const { ej, bloqueado, onResponder, correcta, fallidas } = props;
  const [teclado, setTeclado] = useState(false);
  const i = ej.interaccion;
  if (i.tipo !== 'escribir') return null;
  return (
    <div className="columna">
      {teclado ? (
        <Numerica {...props} />
      ) : (
        <PizarraNumero
          cifras={i.cifras}
          bloqueado={bloqueado}
          correcta={typeof correcta === 'number' ? correcta : null}
          reinicio={props.errores ?? fallidas.length}
          onListo={onResponder}
        />
      )}
      {!bloqueado && (
        <button type="button" className="boton secundario" onClick={() => setTeclado(!teclado)}>
          <Icono nombre={teclado ? 'lapiz' : 'numeros'} tamano={24} /> {teclado ? 'Escribir con el dedo' : 'Usar el teclado'}
        </button>
      )}
    </div>
  );
}
