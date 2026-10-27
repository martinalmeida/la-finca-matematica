// Un ejercicio: enunciado, ilustración, audio opcional, zona de respuesta,
// tres niveles de pista, retroalimentación específica y solución explicada.

import { useMemo, useRef, useState } from 'react';
import type { Ejercicio as TEjercicio, Respuesta } from '../juego/tipos';
import { detectarTipoError, mensajeError, type TipoError } from '../juego/errores';
import { generarParecido } from '../juego/motor';
import Interaccion from './interacciones/Interaccion';
import VisualPista from './VisualPista';
import { DibujoObjeto, esFemenino } from './Ilustraciones';
import { textoOpcion } from './interacciones/Opciones';
import { useApp } from '../estado';
import { retroError, sonar } from '../servicios/sonido';
import { useLecturaAutomatica, useVoz } from '../servicios/voz';
import Icono from './Icono';
import { BotonEscuchar } from './Comunes';
import { hashTexto } from '../juego/rng';
import { BotonVideo } from './Video';
import type { Video } from '../contenido/videos';
import Enunciado from './Enunciado';
import PasoAPaso, { tienePasoAPaso } from './PasoAPaso';
import EscenaRA, { escenaDe } from './EscenaRA';

export type ResultadoEjercicio = {
  correcto: boolean;
  errores: number;
  pistas: 0 | 1 | 2 | 3;
  ms: number;
  tipoError?: TipoError;
  semillas: number;
  /** Usó el paso a paso. */
  pasoAPaso: boolean;
};

const MAX_ERRORES = 3;

const elogiosNinos = ['¡Así se hace!', '¡Muy bien, cosecha asegurada!', '¡Excelente trabajo!', '¡Lo lograste!', '¡Bien pensado!', '¡Eso es! Así se trabaja en la finca.', '¡Correcto! Sigue así.'];
/** Con apoyo extra, el elogio destaca el esfuerzo cuando costó. */
const elogiosEsfuerzo = ['¡No te rendiste y lo lograste!', '¡Con calma y paso a paso, lo lograste!', '¡Tu esfuerzo valió la pena!'];
const elogiosAdultos = ['¡Muy bien!', 'Correcto. Buen cálculo.', 'Exacto. Cuentas claras.', '¡Así es!', 'Correcto, bien razonado.'];

/** Lo que se lee en voz alta al aparecer el ejercicio: enunciado, instrucción y, si son palabras, las opciones. */
export function textoLectura(ej: TEjercicio): string {
  let t = ej.enunciado;
  if (ej.instruccion) t += ` ${ej.instruccion}.`;
  const i = ej.interaccion;
  if (i.tipo === 'opciones' && i.opciones.some((o) => typeof o === 'string')) t += ` Las opciones son: ${i.opciones.map(textoOpcion).join('; ')}.`;
  return t;
}

function textoRespuesta(r: Respuesta): string {
  if (typeof r === 'string' && /^(si|no):/.test(r)) {
    const [sn, est] = r.split(':');
    return `${sn === 'si' ? 'Sí es razonable' : 'No es razonable'}; estimación: ${textoOpcion(Number(est))}`;
  }
  return textoOpcion(r);
}

type Props = {
  ej: TEjercicio;
  onTerminar: (r: ResultadoEjercicio) => void;
  /** Muestra la primera pista desde el inicio (modo repaso); no cuenta como pista usada. */
  pistaVisible?: boolean;
  /** Video de la lección de esta unidad: se ofrece cuando hacen falta varias pistas. */
  video?: Video | null;
  /** Ejercicio de práctica: no cuenta para el nivel. */
  practica?: boolean;
};

export default function Ejercicio({ ej, onTerminar, pistaVisible, practica, video }: Props) {
  const { ajustes } = useApp();
  const voz = useVoz();
  const adulto = ej.pista === 'familia';
  const apoyo = !!ej.apoyo;
  const [errores, setErrores] = useState(0);
  // Pistas pedidas (las que se muestran gratis en repaso o con apoyo no cuentan).
  const [pistas, setPistas] = useState<0 | 1 | 2 | 3>(0);
  const conPaso = tienePasoAPaso(ej);
  // Paso a paso: con apoyo extra empieza abierto; a cualquiera se le ofrece tras 2 errores.
  const [paso, setPaso] = useState<'no' | 'ofrecido' | 'abierto' | 'hecho'>(apoyo && conPaso ? 'abierto' : 'no');
  const [verEscena, setVerEscena] = useState(false);
  const escena = useMemo(() => escenaDe(ej), [ej]);
  const [fallidas, setFallidas] = useState<Respuesta[]>([]);
  const [estado, setEstado] = useState<'jugando' | 'bien' | 'solucion'>('jugando');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [primerError, setPrimerError] = useState<TipoError | undefined>();
  const [parecido, setParecido] = useState<TEjercicio | null>(null);
  const inicio = useRef(Date.now());
  const elogio = useMemo(() => {
    const lista = adulto ? elogiosAdultos : elogiosNinos;
    return lista[hashTexto(ej.id) % lista.length];
  }, [ej.id, adulto]);

  // Pistas que se ven desde el inicio: el dibujo (pista 2) con apoyo; la primera en repaso.
  const pistasGratis = apoyo ? 2 : pistaVisible ? 1 : 0;
  const pistasMostradas = Math.min(3, pistasGratis + pistas);
  const lectura = textoLectura(ej);
  const puedeHablar = voz.disponible && ajustes.audioEnunciados;
  // Para quienes aún no leen: el enunciado se lee solo al aparecer.
  useLecturaAutomatica(ej.id, lectura);
  const decir = (texto: string) => {
    if (puedeHablar) voz.leer(texto, `${ej.id}-retro`);
  };

  const responder = (r: Respuesta) => {
    if (estado !== 'jugando') return;
    if (ej.validar(r)) {
      setEstado('bien');
      const base = apoyo && !adulto && errores > 0 ? elogiosEsfuerzo[hashTexto(ej.id) % elogiosEsfuerzo.length] : elogio;
      const m = errores > 0 && pistas > 0 ? `${base} ${adulto ? 'Corrigió su respuesta: una semilla extra.' : 'Corregiste con ayuda de la pista: ¡semilla extra!'}` : base;
      setMensaje(m);
      decir(m);
      sonar('acierto', ajustes.sonido);
      return;
    }
    const tipo = detectarTipoError(ej.calculo, ej.respuesta, r);
    if (!primerError) setPrimerError(tipo);
    const n = errores + 1;
    setErrores(n);
    setFallidas((f) => [...f, r]);
    retroError(ajustes);
    if (n >= MAX_ERRORES) {
      setEstado('solucion');
      const m = adulto ? 'Veamos juntos cómo se resuelve.' : 'No pasa nada: así se aprende. Mira cómo se resuelve.';
      setMensaje(m);
      decir(`${m} ${ej.explicacion}`);
    } else {
      const m = mensajeError(tipo, ej);
      setMensaje(m);
      decir(m);
      if (n === 2 && conPaso && paso === 'no') setPaso('ofrecido');
    }
  };

  const pedirPista = () => {
    if (pistasMostradas < 3) {
      const n = pistasMostradas + 1;
      setPistas((p) => (p + 1) as 1 | 2 | 3);
      const v = ej.pistas[1];
      decir(n === 1 ? ej.pistas[0] : n === 2 ? (v.tipo === 'texto' ? v.texto : adulto ? 'Mire el dibujo de la pista.' : 'Mira el dibujo de la pista.') : ej.pistas[2]);
    } else {
      setEstado('solucion');
      const m = adulto ? 'Esta es la solución explicada.' : 'Esta es la solución. Después puedes practicar uno parecido.';
      setMensaje(m);
      decir(`${m} ${ej.explicacion}`);
    }
  };

  const terminar = () => {
    const correcto = estado === 'bien';
    onTerminar({
      correcto,
      errores,
      pistas,
      ms: Date.now() - inicio.current,
      tipoError: primerError,
      semillas: correcto ? 1 + (errores > 0 && pistas > 0 ? 1 : 0) : 0,
      pasoAPaso: paso === 'abierto' || paso === 'hecho',
    });
  };

  if (parecido) {
    return (
      <div className="columna">
        <p className="instruccion">
          <Icono nombre="repetir" tamano={20} /> Práctica (no cuenta para el nivel)
        </p>
        <Ejercicio key={parecido.id} ej={parecido} practica pistaVisible onTerminar={() => setParecido(null)} />
      </div>
    );
  }

  return (
    <section className="columna" aria-live="polite">
      <div className="columna vidrio tarjeta-enunciado">
        <div className="fila" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          {ej.ilustracion && (
            <span aria-hidden="true" className="ilustracion-enunciado">
              <DibujoObjeto objeto={ej.ilustracion} tamano={52} />
            </span>
          )}
          <div className="columna" style={{ flex: 1, gap: 6 }}>
            {ej.instruccion && (
              <span className="instruccion" style={{ alignSelf: 'flex-start' }}>
                <Icono nombre="siguiente" tamano={16} /> {ej.instruccion}
              </span>
            )}
            <Enunciado texto={ej.enunciado} clave={ej.id} apoyo={apoyo} />
          </div>
        </div>
        <div className="fila">
          <BotonEscuchar texto={lectura} clave={ej.id} etiqueta={adulto ? 'Escuchar de nuevo' : 'Escuchar otra vez'} />
          {ajustes.realidadAumentada && escena && estado === 'jugando' && (
            <button type="button" className="boton boton-camara" onClick={() => setVerEscena(true)}>
              <Icono nombre="camara" tamano={28} /> {adulto ? 'Ver con la cámara' : 'Verlo en mi finca'}
            </button>
          )}
        </div>
      </div>

      {paso === 'abierto' && estado === 'jugando' && <PasoAPaso key={ej.id} ej={ej} alTerminar={() => setPaso('hecho')} />}

      {pistasMostradas > 0 && (
        <div className="pista-caja columna" role="note" aria-label="Pistas">
          <p style={{ margin: 0 }}>
            <Icono nombre="bombillo" tamano={22} /> <strong>Pista 1:</strong> {ej.pistas[0]}
          </p>
          {pistasMostradas >= 2 && (
            <div className="columna">
              <strong>
                <Icono nombre="bombillo" tamano={22} /> Pista 2:
              </strong>
              <VisualPista visual={ej.pistas[1]} />
            </div>
          )}
          {pistasMostradas >= 3 && (
            <p style={{ margin: 0 }}>
              <Icono nombre="bombillo" tamano={22} /> <strong>Pista 3:</strong> {ej.pistas[2]}
            </p>
          )}
          {pistasMostradas >= 2 && <BotonVideo video={video ?? null} adulto={adulto} clase="boton" texto={adulto ? 'Ver cómo se hace en un video' : '¿Lo vemos en un video?'} />}
        </div>
      )}

      {mensaje && (
        <div className={`retro ${estado === 'bien' ? 'bien' : 'casi'}`} role="status">
          <span className="icono-retro" aria-hidden="true">
            <Icono nombre={estado === 'bien' ? 'check' : estado === 'solucion' ? 'solucion' : 'pensar'} tamano={28} />
          </span>
          <span>{mensaje}</span>
        </div>
      )}

      {paso === 'ofrecido' && estado === 'jugando' && (
        <button type="button" className="boton principal boton-paso" onClick={() => setPaso('abierto')}>
          <Icono nombre="pasos" tamano={30} /> {adulto ? '¿Lo resolvemos paso a paso?' : '¿Lo hacemos paso a paso?'}
        </button>
      )}

      {estado === 'solucion' && (
        <div className="tarjeta columna">
          <p style={{ margin: 0 }}>
            <strong>Respuesta:</strong> {textoRespuesta(ej.respuesta)}
          </p>
          <p style={{ margin: 0 }}>{ej.explicacion}</p>
          {pistasMostradas < 2 && <BotonVideo video={video ?? null} adulto={adulto} clase="boton" texto={adulto ? 'Ver cómo se hace en un video' : 'Verlo explicado en un video'} />}
        </div>
      )}

      <div className={`zona-respuesta ${paso === 'abierto' && estado === 'jugando' ? 'en-espera' : ''}`}>
        <Interaccion
          key={ej.id}
          ej={ej}
          bloqueado={estado !== 'jugando'}
          onResponder={responder}
          fallidas={fallidas}
          correcta={estado !== 'jugando' ? ej.respuesta : null}
        />
      </div>

      {estado === 'jugando' && (
        <button type="button" className="boton secundario" onClick={pedirPista}>
          <Icono nombre={pistasMostradas < 3 ? 'bombillo' : 'solucion'} tamano={28} />
          {pistasMostradas < 3 ? `${adulto ? 'Ver una pista' : 'Pedir una pista'} (${pistasMostradas}/3)` : 'Ver la solución'}
        </button>
      )}

      {estado !== 'jugando' && (
        <div className="columna">
          {estado === 'solucion' && !practica && (
            <button type="button" className="boton secundario" onClick={() => setParecido(generarParecido(ej, hashTexto(ej.id + Date.now())))}>
              <Icono nombre="repetir" tamano={26} /> Practicar uno parecido
            </button>
          )}
          <button type="button" className="boton principal" onClick={terminar}>
            {practica ? 'Volver al nivel' : 'Siguiente'} <Icono nombre="siguiente" tamano={24} />
          </button>
        </div>
      )}

      {verEscena && escena && (
        <EscenaRA
          config={escena}
          titulo={adulto ? 'Con la cámara' : 'En mi finca'}
          instruccion={
            escena.modo === 'canasta'
              ? escena.quitar
                ? adulto ? 'Saque de la canasta los que se van.' : 'Arrastra fuera de la canasta los que se van.'
                : adulto ? 'Meta todos en la canasta y cuente.' : 'Arrastra todos a la canasta y cuenta.'
              : `${adulto ? 'Toque' : 'Toca'} ${escena.modo !== 'real' && esFemenino(escena.objeto) ? 'cada una para contarla' : 'cada uno para contarlo'}.`
          }
          alCerrar={() => setVerEscena(false)}
        />
      )}
    </section>
  );
}
