// Paso a paso para quien necesita más apoyo: 1) ¿qué pasa en el problema? (juntar, quitar,
// repetir o repartir), 2) mirar la operación con un dibujo, 3) volver a responder.
// Se arma solo con el cálculo principal del ejercicio, así sirve para todas las plantillas.

import { useEffect, useState } from 'react';
import type { Ejercicio, Visual } from '../juego/tipos';
import { ACCIONES, accionDe, type Accion } from '../juego/apoyo';
import { num } from '../contenido/contexto';
import { useApp } from '../estado';
import { retroError, sonar } from '../servicios/sonido';
import { useVoz } from '../servicios/voz';
import VisualPista from './VisualPista';
import Icono, { type NombreIcono } from './Icono';
import { esFamilia } from '../juego/motor';
import { focoEnControl, letraOpcion, opcionDeTecla, useTeclas } from '../servicios/teclas';

const ICONO_ACCION: Record<Accion, NombreIcono> = { juntar: 'mas', quitar: 'menos', repetir: 'por', repartir: 'entre' };

/** Dibujo de la operación con los objetos del problema (o la pista visual si los números son grandes). */
function dibujoDe(ej: Ejercicio, accion: Accion): Visual {
  const { a, b } = ej.calculo!;
  const objeto = ej.ilustracion ?? 'mazorca';
  if (accion === 'juntar' && a + b <= 30) return { tipo: 'objetos', objeto, grupos: [a, b] };
  if (accion === 'quitar' && a <= 30 && b <= a) return { tipo: 'objetos', objeto, grupos: [a], tachados: b };
  if (accion === 'repetir' && a <= 10 && b <= 10) return { tipo: 'arreglo', filas: a, columnas: b, objeto };
  if (accion === 'repartir' && a <= 40 && b > 0) return { tipo: 'reparto', total: a, grupos: b, objeto };
  return ej.pistas[1];
}

export function tienePasoAPaso(ej: Ejercicio): boolean {
  return accionDe(ej.calculo) !== null;
}

export default function PasoAPaso({ ej, alTerminar }: { ej: Ejercicio; alTerminar: () => void }) {
  const { ajustes } = useApp();
  const voz = useVoz();
  const adulto = esFamilia(ej.pista);
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const accion = accionDe(ej.calculo)!;
  const [paso, setPaso] = useState<1 | 2>(1);
  const [fallos, setFallos] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const puedeHablar = voz.disponible && ajustes.audioEnunciados;
  const decir = (t: string, k: string) => puedeHablar && voz.leer(t, `${ej.id}-paso-${k}`);

  const pregunta = 'Paso 1. ¿Qué pasa en el problema?';
  useEffect(() => {
    decir(`${pregunta} ${tu('Elige', 'Elija')}: juntar, quitar, repetir grupos o repartir.`, '1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // En computador: A, B, C, D eligen qué pasa; Enter sigue al paso 3.
  useTeclas((e) => {
    if (paso === 1) {
      const k = opcionDeTecla(e, Object.keys(ACCIONES).length);
      if (k < 0) return false;
      elegir((Object.keys(ACCIONES) as Accion[])[k]);
      return true;
    }
    if (e.key === 'Enter' && !focoEnControl()) {
      alTerminar();
      return true;
    }
    return false;
  });

  const { a, b } = ej.calculo!;
  const info = ACCIONES[accion];

  const elegir = (x: Accion) => {
    if (x === accion) {
      sonar('acierto', ajustes.sonido);
      setMensaje(null);
      setPaso(2);
      decir(`${tu('¡Eso es!', '¡Así es!')} ${info.ayuda} ${tu('Mira', 'Mire')}: ${num(a)} ${info.signo} ${num(b)}.`, '2');
      return;
    }
    retroError(ajustes);
    const n = fallos + 1;
    setFallos(n);
    const m = n >= 2 ? `${tu('Fíjate', 'Fíjese')}: ${info.ayuda}` : tu('Mmm, todavía no. Vuelve a leer la primera frase.', 'Todavía no. Vuelva a leer el problema.');
    setMensaje(m);
    decir(m, 'r');
  };

  // En computador: A, B, C, D eligen qué pasa; Enter sigue al paso 3.
  useTeclas((e) => {
    if (paso === 1) {
      const k = opcionDeTecla(e, Object.keys(ACCIONES).length);
      if (k < 0) return false;
      elegir((Object.keys(ACCIONES) as Accion[])[k]);
      return true;
    }
    if (e.key === 'Enter' && !focoEnControl()) {
      alTerminar();
      return true;
    }
    return false;
  });

  return (
    <section className="paso-a-paso vidrio columna" aria-label="Paso a paso">
      <div className="fila" style={{ flexWrap: 'nowrap' }}>
        <Icono nombre="pasos" tamano={34} />
        <strong>{tu('Lo hacemos paso a paso', 'Paso a paso')}</strong>
      </div>
      {paso === 1 ? (
        <>
          <p style={{ margin: 0 }}>{pregunta}</p>
          <div className="acciones-paso" role="group" aria-label="Qué pasa en el problema">
            {(Object.keys(ACCIONES) as Accion[]).map((x, k) => (
              <button
                key={x}
                type="button"
                className={`opcion texto accion-paso ${fallos >= 2 && x === accion ? 'sugerida' : ''}`}
                onClick={() => elegir(x)}
              >
                <span className="letra-atajo" aria-hidden="true">{letraOpcion(k)}</span>
                <Icono nombre={ICONO_ACCION[x]} tamano={30} /> {ACCIONES[x].nombre}
              </button>
            ))}
          </div>
          {mensaje && (
            <p className="retro casi" role="status" style={{ margin: 0 }}>
              {mensaje}
            </p>
          )}
          <button type="button" className="boton enlace-paso" onClick={alTerminar}>
            {tu('Ya sé, quiero responder', 'Ya sé, prefiero responder')}
          </button>
        </>
      ) : (
        <>
          <p style={{ margin: 0 }}>
            <strong>Paso 2.</strong> {info.ayuda}
          </p>
          <p className="operacion-grande" aria-label={`${num(a)} ${info.signo} ${num(b)}`}>
            {num(a)} <span className="signo">{info.signo}</span> {num(b)} = ?
          </p>
          <VisualPista visual={dibujoDe(ej, accion)} />
          <button type="button" className="boton principal" onClick={alTerminar}>
            <Icono nombre="siguiente" tamano={24} /> {tu('Paso 3. Ahora respondo', 'Paso 3. Responder')}
          </button>
        </>
      )}
    </section>
  );
}
