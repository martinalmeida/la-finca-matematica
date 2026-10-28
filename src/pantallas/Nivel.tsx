import { useMemo, useRef, useState } from 'react';
import { useCapaConAtras } from '../servicios/atras';
import { useApp } from '../estado';
import Ejercicio, { type ResultadoEjercicio } from '../componentes/Ejercicio';
import { generarNivel, temaDe } from '../juego/motor';
import { etiquetaNivel, nivelConTotal, unidadDe } from '../juego/complejidad';
import { aplicarResultado, type ResultadoNivel } from '../juego/progresion';
import { bandaDePerfil, guardarPartida, guardarProgreso, leerProgreso, leerResumen, pistaDePerfil, registrar, sumarAlResumen } from '../almacenamiento/datos';
import { sincronizarPronto } from '../servicios/sincronizacion';
import { sonar } from '../servicios/sonido';
import Icono from '../componentes/Icono';
import { videoDeLeccion, type Video } from '../contenido/videos';
import { lecciones } from '../contenido/lecciones';
import { VideoEnPagina } from '../componentes/Video';
import { useLecturaAutomatica } from '../servicios/voz';

/**
 * Al empezar cada nivel: de qué se trata y un video de introducción para aprender antes de jugar.
 * El video se carga solo si alguien lo toca; sin internet se puede empezar igual.
 */
function IntroNivel({ nivel, tema, idea, video, adulto, alEmpezar }: { nivel: string; tema: string; idea: string; video: Video | null; adulto: boolean; alEmpezar: () => void }) {
  const texto = adulto
    ? `Nivel ${nivel}: ${tema}. ${idea}${video ? ' Antes de empezar, vea el video de introducción.' : ''}`
    : `Nivel ${nivel}: ${tema}. ${idea}${video ? ' Antes de empezar, mira el video para aprender.' : ''}`;
  useLecturaAutomatica(`intro-${nivel}-${tema}`, texto);
  return (
    <section className="vidrio tarjeta columna intro-nivel" aria-label="Introducción del nivel">
      <span className="agenda-etiqueta">
        <Icono nombre="video" tamano={22} anim="no" /> Antes de empezar
      </span>
      <h2>{tema}</h2>
      {idea && <p className="intro-nivel-idea">{idea}</p>}
      {video && (
        <>
          <VideoEnPagina video={video} adulto={adulto} />
          <p className="pequeno suave" style={{ margin: 0 }}>
            {adulto ? 'Toque el video para verlo. Necesita internet; si no hay señal, puede empezar igual.' : 'Toca el video para verlo. Si no hay internet, puedes empezar igual.'}
          </p>
        </>
      )}
      <div className="acciones-pegadas">
        <button type="button" className="boton principal" onClick={alEmpezar}>
          {adulto ? 'Empezar el nivel' : '¡Empezar el nivel!'} <Icono nombre="siguiente" tamano={24} />
        </button>
      </div>
    </section>
  );
}

/** Inclusión: antes de empezar se muestra qué va a pasar (rutina predecible). */
function Agenda({ tema, alEmpezar }: { tema: string; alEmpezar: () => void }) {
  const texto = `Primero: ${tema}. 10 actividades, una por una. Después: ¡una planta nueva en tu finca!`;
  useLecturaAutomatica(`agenda-${tema}`, texto);
  return (
    <section className="vidrio tarjeta columna agenda" aria-label="Lo que vamos a hacer">
      <div className="agenda-paso">
        <span className="agenda-etiqueta">Primero</span>
        <span>
          <Icono nombre="lapiz" tamano={32} anim="no" /> {tema}
        </span>
        <span className="pequeno suave">10 actividades, una por una</span>
      </div>
      <div className="agenda-paso">
        <span className="agenda-etiqueta">Después</span>
        <span>
          <Icono nombre="brote" tamano={32} anim="no" /> ¡Tu planta crece!
        </span>
      </div>
      <button type="button" className="boton principal" onClick={alEmpezar}>
        Empezar <Icono nombre="siguiente" tamano={24} />
      </button>
    </section>
  );
}

/** Inclusión: un descanso tranquilo en cualquier momento. */
function Pausa({ alSeguir }: { alSeguir: () => void }) {
  useCapaConAtras(true, alSeguir);
  useLecturaAutomatica('pausa', 'Descansamos. Respira despacio. Cuando quieras, seguimos.');
  return (
    <div className="pausa" role="dialog" aria-modal="true" aria-label="Pausa">
      <div className="pausa-circulo" aria-hidden="true" />
      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Descansamos</p>
      <p style={{ margin: 0 }}>Respira despacio. Cuando quieras, seguimos.</p>
      <button type="button" className="boton principal" onClick={alSeguir}>
        Seguir <Icono nombre="siguiente" tamano={24} />
      </button>
    </div>
  );
}

export default function Nivel({ nivel, repaso }: { nivel: number; repaso: boolean }) {
  const { perfil, ir, ajustes } = useApp();
  const p = perfil!;
  const pista = pistaDePerfil(p);
  const banda = bandaDePerfil(p);
  const inclusion = pista === 'inclusion';
  const progreso = useMemo(() => leerProgreso(p.id, pista), [p.id, pista]);
  const intento = (progreso.niveles[nivel]?.intentos ?? 0) + 1;
  // Las 10 preguntas del nivel se generan al entrar a él; cada entrada trae otras
  // (si sale a mitad del nivel y vuelve, no le salen las mismas que ya vio resueltas).
  const [variante] = useState(() => Date.now());
  const ejercicios = useMemo(() => generarNivel({ codigo: p.usuario, pista, nivel, intento, repaso, banda, variante }), [p.usuario, pista, nivel, intento, repaso, banda, variante]);
  const video = ajustes.videos === false ? null : videoDeLeccion(pista, nivel - 1);
  const leccion = lecciones[pista][unidadDe(pista, nivel).indice];
  const adulto = p.rol === 'familia';
  const tema = temaDe(pista, nivel);
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoEjercicio[]>([]);
  const [intro, setIntro] = useState(true);
  const [agenda, setAgenda] = useState(inclusion);
  const [pausa, setPausa] = useState(false);

  // Cada ejercicio se cuenta una sola vez: un segundo toque en «Siguiente» (mientras se abre el
  // resultado) no registra otra vez el último ni aplica el nivel dos veces.
  const contado = useRef(-1);
  const terminarEjercicio = (r: ResultadoEjercicio) => {
    if (contado.current >= indice) return;
    contado.current = indice;
    const ej = ejercicios[indice];
    sumarAlResumen(p.id, ej.operacion, r.correcto, r.tipoError, r.pasoAPaso);
    registrar('nivel', {
      pista,
      nivel,
      plantilla: ej.plantilla,
      operacion: ej.operacion,
      correcto: r.correcto,
      intentos: r.errores + (r.correcto ? 1 : 0),
      pistasUsadas: r.pistas,
      tipoError: r.tipoError,
      ms: r.ms,
    });
    const todos = [...resultados, r];
    setResultados(todos);
    if (indice + 1 < ejercicios.length) {
      setIndice(indice + 1);
      window.scrollTo(0, 0);
      return;
    }
    const resultado: ResultadoNivel = {
      pista,
      nivel,
      aciertos: todos.filter((x) => x.correcto).length,
      total: todos.length,
      errores: todos.reduce((s, x) => s + x.errores, 0),
      pistasUsadas: todos.reduce((s, x) => s + x.pistas, 0),
      intento,
      repaso,
      semillas: todos.reduce((s, x) => s + x.semillas, 0),
      banda,
    };
    const efecto = aplicarResultado(leerProgreso(p.id, pista), resultado, leerResumen(p.id).diasJugados.length);
    guardarProgreso(p.id, pista, efecto.progreso);
    guardarPartida({
      tipo: 'nivel',
      pista,
      nivel,
      aciertos: resultado.aciertos,
      total: resultado.total,
      estrellas: efecto.estrellas,
      ms_total: todos.reduce((s, x) => s + x.ms, 0),
      repaso,
      banda: inclusion ? null : banda,
    });
    sincronizarPronto();
    sonar(efecto.aprobado ? 'nivel' : 'intento', ajustes.sonido);
    ir({ nombre: 'resultado', resultado, efecto }, { reemplazar: true });
  };

  return (
    <main className="pantalla">
      <header className="barra">
        <button type="button" className="boton icono" onClick={() => ir({ nombre: 'mapa' })} aria-label="Salir al mapa">
          <Icono nombre="cerrar" tamano={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0 }}>
            Nivel {nivelConTotal(pista, nivel)}
          </h1>
          <div className="pequeno suave">
            {repaso ? 'Repaso con pistas · ' : ''}
            {tema.titulo}
          </div>
        </div>
        {inclusion && !agenda && !intro && (
          <button type="button" className="boton icono" onClick={() => setPausa(true)} aria-label="Pausa">
            <Icono nombre="pausa" tamano={24} anim="no" />
          </button>
        )}
      </header>

      {intro ? (
        <IntroNivel
          nivel={etiquetaNivel(pista, nivel)}
          tema={tema.titulo}
          idea={tema.idea ?? leccion?.idea ?? ''}
          video={video}
          adulto={adulto}
          alEmpezar={() => {
            setIntro(false);
            window.scrollTo(0, 0);
          }}
        />
      ) : agenda ? (
        <Agenda tema={tema.titulo} alEmpezar={() => setAgenda(false)} />
      ) : (
        <>
          <div className="progreso-nivel" role="progressbar" aria-valuemin={1} aria-valuemax={ejercicios.length} aria-valuenow={indice + 1} aria-label={`Ejercicio ${indice + 1} de ${ejercicios.length}`}>
            {ejercicios.map((_, k) => (
              <span key={k} className={`punto ${k < indice ? (resultados[k]?.correcto || inclusion ? 'hecho' : 'fallado') : k === indice ? 'actual' : ''}`} />
            ))}
            <span className="pequeno" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {indice + 1} de {ejercicios.length}
            </span>
          </div>
          <Ejercicio key={ejercicios[indice].id} ej={ejercicios[indice]} onTerminar={terminarEjercicio} pistaVisible={repaso} video={video} modo={inclusion ? 'inclusion' : 'nivel'} />
        </>
      )}
      {pausa && <Pausa alSeguir={() => setPausa(false)} />}
    </main>
  );
}
