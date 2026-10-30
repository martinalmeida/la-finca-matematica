// «Así se responde»: en la prueba diagnóstica (que hace de tutorial), la primera vez que aparece
// cada forma de responder se explica con una tarjeta corta. Tocar, arrastrar y el teclado traen
// un mini-ejemplo para practicar antes de la pregunta de verdad.

import { useEffect, useRef, useState } from 'react';
import type { Interaccion } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';
import ContenedorRecipiente from './Recipiente';
import Teclado from './Teclado';
import Icono from './Icono';
import { sonar } from '../servicios/sonido';
import { useApp } from '../estado';
import { useLecturaAutomatica } from '../servicios/voz';
import { focoEnControl, useTeclas } from '../servicios/teclas';

type Texto = [nino: string, adulto: string];

const TEXTOS: Record<Interaccion['tipo'], { titulo: string; texto: Texto }> = {
  contar: { titulo: 'Tocar para contar', texto: ['Toca cada dibujo una sola vez: queda marcado con su número. Luego elige cuántos hay.', 'Toque cada dibujo una sola vez: queda marcado con su número. Luego elija cuántos hay.'] },
  arrastrar: { titulo: 'Arrastrar', texto: ['Pon el dedo sobre un dibujo y llévalo a la canasta. También puedes tocarlo para moverlo.', 'Ponga el dedo sobre un dibujo y llévelo a la canasta. También puede tocarlo para moverlo.'] },
  numerica: { titulo: 'El teclado de números', texto: ['Escribe tu respuesta con el teclado de la finca y toca «Listo».', 'Escriba su respuesta con el teclado y toque «Listo».'] },
  opciones: { titulo: 'Elegir una respuesta', texto: ['Lee las opciones y toca la que creas correcta.', 'Lea las opciones y toque la que crea correcta.'] },
  recta: { titulo: 'La recta numérica', texto: ['Toca el número de la recta donde llegas y luego «Listo». Si no se ve completa, deslízala.', 'Toque el número de la recta donde llega y luego «Listo». Si no se ve completa, deslícela.'] },
  bloques: { titulo: 'Canastas, cajas y sueltas', texto: ['Cada canasta tiene 100, cada caja 10. Cuenta o arma el número con los botones + y −.', 'Cada canasta tiene 100 y cada caja 10. Cuente o arme el número con los botones + y −.'] },
  algoritmo: { titulo: 'Operar en columnas', texto: ['Empieza por la derecha (las unidades). Toca una casilla y escribe la cifra con el teclado.', 'Empiece por la derecha (las unidades). Toque una casilla y escriba la cifra con el teclado.'] },
  arreglo: { titulo: 'Filas y columnas', texto: ['Toca la cuadrícula para formar las filas y columnas del problema. Luego escribe el total.', 'Toque la cuadrícula para formar las filas y columnas. Luego escriba el total.'] },
  razonable: { titulo: '¿Es razonable?', texto: ['Primero di si el resultado tiene sentido. Después elige la estimación más cercana.', 'Primero diga si el resultado tiene sentido. Después elija la estimación más cercana.'] },
  tabla: { titulo: 'Leer una tabla', texto: ['Busca en la tabla los datos que necesitas y responde.', 'Busque en la tabla los datos que necesita y responda.'] },
  escribir: { titulo: 'Escribir con el dedo', texto: ['Escribe cada cifra con el dedo en su casilla.', 'Escriba cada cifra con el dedo en su casilla.'] },
  trazar: { titulo: 'Repasar con el dedo', texto: ['Empieza en el punto verde y sigue los puntitos.', 'Empiece en el punto verde y siga los puntitos.'] },
  emparejar: { titulo: 'Número y cantidad', texto: ['Toca el grupo que tiene la cantidad pedida.', 'Toque el grupo que tiene la cantidad pedida.'] },
  figuras: { titulo: 'Tocar el dibujo', texto: ['Mira bien los dibujos y toca el que se pide.', 'Mire bien los dibujos y toque el que se pide.'] },
  clasificar: { titulo: 'Clasificar', texto: ['Toca una figura y luego la canasta donde va.', 'Toque una figura y luego la canasta donde va.'] },
  ordenar: { titulo: 'Ordenar', texto: ['Toca los dibujos en orden, del más bajo al más alto.', 'Toque los dibujos en orden, del más bajo al más alto.'] },
};

/** Mini-ejemplo de tocar: 3 gallinas. */
function DemoTocar({ alLograr }: { alLograr: () => void }) {
  const { ajustes } = useApp();
  const [tocadas, setTocadas] = useState<number[]>([]);
  useEffect(() => {
    if (tocadas.length === 3) alLograr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocadas.length]);
  return (
    <div className="objetos">
      {[0, 1, 2].map((k) => (
        <button
          key={k}
          type="button"
          className={`objeto-tocable ${tocadas.includes(k) ? 'marcado' : ''}`}
          style={{ width: 72, height: 72 }}
          onClick={() => {
            sonar('toque', ajustes.sonido);
            setTocadas((s) => (s.includes(k) ? s : [...s, k]));
          }}
          aria-pressed={tocadas.includes(k)}
          aria-label={`Gallina ${k + 1}`}
        >
          <DibujoObjeto objeto="gallina" tamano={60} etiqueta="" />
          {tocadas.includes(k) && <span className="marca">{tocadas.indexOf(k) + 1}</span>}
        </button>
      ))}
    </div>
  );
}

/** Mini-ejemplo de arrastrar: llevar una mazorca a la canasta. */
function DemoArrastrar({ alLograr }: { alLograr: () => void }) {
  const { ajustes } = useApp();
  const [enCanasta, setEnCanasta] = useState(false);
  const [arrastre, setArrastre] = useState<{ x: number; y: number } | null>(null);
  const refCanasta = useRef<HTMLSpanElement>(null);
  const lograr = () => {
    setEnCanasta(true);
    sonar('acierto', ajustes.sonido);
    alLograr();
  };
  useEffect(() => {
    if (!arrastre) return;
    const mover = (e: PointerEvent) => setArrastre({ x: e.clientX, y: e.clientY });
    const soltar = (e: PointerEvent) => {
      const r = refCanasta.current?.getBoundingClientRect();
      if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) lograr();
      setArrastre(null);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastre]);
  return (
    <div className="arrastre">
      <ContenedorRecipiente forma={null} className="deposito">
        {!enCanasta && (
          <button
            type="button"
            className="ficha boton plano movible"
            style={{ width: 64, height: 64, opacity: arrastre ? 0.3 : 1 }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
              setArrastre({ x: e.clientX, y: e.clientY });
            }}
            onClick={lograr}
            aria-label="Mazorca: llévala a la canasta"
          >
            <DibujoObjeto objeto="mazorca" tamano={56} etiqueta="" />
          </button>
        )}
      </ContenedorRecipiente>
      <ContenedorRecipiente ref={refCanasta} forma="canasta" className="deposito destino" aria-label="Canasta" style={{ alignSelf: 'center', width: 'min(100%, 240px)' }}>
        {enCanasta && <DibujoObjeto objeto="mazorca" tamano={44} />}
      </ContenedorRecipiente>
      {arrastre && (
        <div className="ficha arrastrando" style={{ left: arrastre.x, top: arrastre.y }} aria-hidden="true">
          <DibujoObjeto objeto="mazorca" tamano={56} etiqueta="" />
        </div>
      )}
    </div>
  );
}

/** Mini-ejemplo del teclado: escribir el 7. */
function DemoTeclado({ alLograr, adulto }: { alLograr: () => void; adulto: boolean }) {
  const { ajustes } = useApp();
  const [valor, setValor] = useState('');
  const [hecho, setHecho] = useState(false);
  return (
    <div className="columna">
      <p className="instruccion" style={{ alignSelf: 'center' }}>
        {adulto ? 'Pruebe: escriba el 7' : 'Prueba: escribe el 7'}
      </p>
      <Teclado
        valor={valor}
        onCambio={setValor}
        deshabilitado={hecho}
        onListo={() => {
          if (valor === '7') {
            sonar('acierto', ajustes.sonido);
            setHecho(true);
            alLograr();
          } else setValor('');
        }}
      />
    </div>
  );
}

/** Formas de responder que traen mini-ejemplo. */
const CON_DEMO: Interaccion['tipo'][] = ['contar', 'arrastrar', 'numerica'];

export function tieneTarjeta(tipo: Interaccion['tipo']): boolean {
  return tipo in TEXTOS;
}

export default function AsiSeResponde({ tipo, adulto, alContinuar }: { tipo: Interaccion['tipo']; adulto: boolean; alContinuar: () => void }) {
  const info = TEXTOS[tipo];
  const [logrado, setLogrado] = useState(!CON_DEMO.includes(tipo));
  const texto = info.texto[adulto ? 1 : 0];
  useLecturaAutomatica(`asi-${tipo}`, `${info.titulo}. ${texto}`);
  // En computador, Enter sigue (cuando ya no hay un ejemplo por hacer con el teclado).
  useTeclas((e) => {
    if (e.key !== 'Enter' || focoEnControl()) return false;
    alContinuar();
    return true;
  }, logrado);
  return (
    <section className="vidrio tarjeta columna asi-se-responde" aria-live="polite">
      <span className="chip pequeno" style={{ alignSelf: 'flex-start' }}>
        <Icono nombre="bombillo" tamano={18} /> Así se responde
      </span>
      <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{info.titulo}</h2>
      <p style={{ margin: 0 }}>{texto}</p>
      {tipo === 'contar' && <DemoTocar alLograr={() => setLogrado(true)} />}
      {tipo === 'arrastrar' && <DemoArrastrar alLograr={() => setLogrado(true)} />}
      {tipo === 'numerica' && <DemoTeclado adulto={adulto} alLograr={() => setLogrado(true)} />}
      {logrado && CON_DEMO.includes(tipo) && (
        <div className="retro bien" role="status">
          <Icono nombre="check" tamano={26} /> ¡Muy bien!
        </div>
      )}
      <button type="button" className={`boton ${logrado ? 'principal' : 'plano pequeno'}`} onClick={alContinuar}>
        {logrado ? (adulto ? 'Entendido' : '¡Entendido!') : adulto ? 'Ya sé cómo: omitir' : 'Ya sé cómo'} <Icono nombre="siguiente" tamano={22} />
      </button>
    </section>
  );
}
