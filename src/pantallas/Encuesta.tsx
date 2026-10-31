// Encuesta de satisfacción sobre la aplicación: obligatoria al terminar la ruta (después de la prueba
// final; en Inclusión, al superar el último nivel). Una pregunta por pantalla, con caritas de 1 a 5.
// Se guarda en el celular y sube con la sincronización (sirve sin señal).

import { useId, useState } from 'react';
import { useApp } from '../estado';
import Icono from '../componentes/Icono';
import { pistaDePerfil } from '../almacenamiento/datos';
import { guardarEncuesta, type RespuestaEncuesta } from '../almacenamiento/encuesta';
import { ABIERTAS, ESCALA, MAX_TEXTO_ENCUESTA, preguntasDe, type ClavePregunta } from '../contenido/encuesta';
import { uuid } from '../juego/perfil';
import { sincronizarPronto } from '../servicios/sincronizacion';
import { sonar } from '../servicios/sonido';
import { useTeclas } from '../servicios/teclas';
import { useLecturaAutomatica } from '../servicios/voz';

/** Color y boca de cada carita (de 1 = nada a 5 = mucho). */
const CARAS: Record<number, { claro: string; oscuro: string; boca: string }> = {
  1: { claro: '#fca5a5', oscuro: '#dc2626', boca: 'M15 34c4-6 14-6 18 0' },
  2: { claro: '#fdba74', oscuro: '#ea580c', boca: 'M16 33c4-3 12-3 16 0' },
  3: { claro: '#fde68a', oscuro: '#d99a06', boca: 'M16 31h16' },
  4: { claro: '#bef264', oscuro: '#65a30d', boca: 'M16 29c4 4 12 4 16 0' },
  5: { claro: '#86efac', oscuro: '#16a34a', boca: 'M14 27c3 9 17 9 20 0Z' },
};

function Carita({ valor }: { valor: number }) {
  const id = useId();
  const c = CARAS[valor];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={c.claro} />
          <stop offset="1" stopColor={c.oscuro} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#${id})`} stroke={c.oscuro} strokeWidth="1.5" />
      <ellipse cx="18" cy="12" rx="9" ry="4.5" fill="#fff" opacity=".45" />
      <circle cx="17" cy="20" r="2.6" fill="#3b2a1a" />
      <circle cx="31" cy="20" r="2.6" fill="#3b2a1a" />
      <path d={c.boca} fill={valor === 5 ? '#7c2d12' : 'none'} stroke="#3b2a1a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Encuesta() {
  const { perfil: p, ajustes, ir } = useApp();
  const adulto = p.rol === 'familia';
  const inclusion = p.grado === 'inclusion';
  const t = (nino: string, adultoTxt: string) => (adulto ? adultoTxt : nino);
  const preguntas = preguntasDe(inclusion);
  const conAbiertas = !inclusion;
  const pasos = preguntas.length + (conAbiertas ? 1 : 0);

  const [fase, setFase] = useState<'intro' | 'preguntas' | 'gracias'>('intro');
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Partial<Record<ClavePregunta, number | null>>>({});
  const [gusto, setGusto] = useState('');
  const [mejorar, setMejorar] = useState('');

  const enAbiertas = fase === 'preguntas' && indice === preguntas.length;
  const pregunta = fase === 'preguntas' && !enAbiertas ? preguntas[indice] : null;
  const elegida = pregunta ? respuestas[pregunta.clave] : undefined;
  const ultima = indice === pasos - 1;

  const textoIntro = t(
    `¡Terminaste tu ruta! Ahora queremos saber qué te pareció la aplicación. Son ${preguntas.length} preguntas cortas. No es una nota: no hay respuestas buenas ni malas.`,
    `¡Terminó su ruta! Ahora queremos saber qué le pareció la aplicación. Son ${preguntas.length} preguntas cortas y ${conAbiertas ? 'dos para escribir si quiere' : 'nada más'}. No hay respuestas buenas ni malas: su opinión nos ayuda a mejorar.`,
  );
  useLecturaAutomatica('encuesta-intro', textoIntro, fase === 'intro');
  const textoPregunta = pregunta ? `${t(pregunta.nino, pregunta.adulto)} ${t('Toca una carita.', 'Toque una carita.')}` : enAbiertas ? t(ABIERTAS.gusto.nino, ABIERTAS.gusto.adulto) : '';
  useLecturaAutomatica(`encuesta-${indice}`, textoPregunta, fase === 'preguntas');
  useLecturaAutomatica('encuesta-gracias', t('¡Gracias por contarnos!', '¡Gracias por su opinión!'), fase === 'gracias');

  const elegir = (valor: number | null) => {
    if (!pregunta) return;
    setRespuestas((r) => ({ ...r, [pregunta.clave]: valor }));
  };

  useTeclas((e) => {
    const n = Number(e.key);
    if (!pregunta || !Number.isInteger(n) || n < 1 || n > 5) return false;
    elegir(n);
    return true;
  }, !!pregunta);

  const enviar = () => {
    const respuesta: RespuestaEncuesta = {
      id: uuid(),
      t: new Date().toISOString(),
      pista: pistaDePerfil(p),
      respuestas,
      gusto: gusto.trim().slice(0, MAX_TEXTO_ENCUESTA),
      mejorar: mejorar.trim().slice(0, MAX_TEXTO_ENCUESTA),
      version: __VERSION__,
    };
    guardarEncuesta(p.id, { respuesta, enviada: false });
    sincronizarPronto();
    sonar('nivel', ajustes.sonido);
    setFase('gracias');
    window.scrollTo(0, 0);
  };

  const siguiente = () => {
    if (ultima) return enviar();
    setIndice(indice + 1);
    window.scrollTo(0, 0);
  };

  if (fase === 'intro') {
    return (
      <main className="pantalla">
        <section className="vidrio tarjeta columna centro tarjeta-prueba">
          <span className="icono-prueba" aria-hidden="true">
            <Icono nombre="corazon" tamano={56} anim="siempre" />
          </span>
          <h1 className="titulo-degradado" style={{ margin: 0 }}>
            {t('¡Cuéntanos qué te pareció!', '¡Cuéntenos qué le pareció!')}
          </h1>
          <p style={{ margin: 0 }}>{textoIntro}</p>
        </section>
        <button
          type="button"
          className="boton principal brillo"
          onClick={() => {
            setFase('preguntas');
            window.scrollTo(0, 0);
          }}
        >
          <Icono nombre="jugar-simple" tamano={24} /> {t('¡Empezar!', 'Empezar')}
        </button>
      </main>
    );
  }

  if (fase === 'gracias') {
    return (
      <main className="pantalla">
        <section className="vidrio tarjeta columna centro tarjeta-prueba">
          <span className="icono-prueba" aria-hidden="true">
            <Icono nombre="fiesta" tamano={56} anim="siempre" />
          </span>
          <h1 className="titulo-degradado" style={{ margin: 0 }}>
            {t('¡Gracias por contarnos!', '¡Gracias por su opinión!')}
          </h1>
          <p style={{ margin: 0 }}>
            {t('Con lo que nos dijiste vamos a hacer La Finca cada vez mejor. Puedes seguir jugando y repasando cuando quieras.', 'Con lo que nos contó vamos a mejorar La Finca. Puede seguir repasando cuando quiera.')}
          </p>
        </section>
        <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'mifinca' })}>
          {t('Ir a mi finca', 'Ir a mi perfil')} <Icono nombre="siguiente" tamano={24} />
        </button>
      </main>
    );
  }

  return (
    <main className="pantalla">
      <header className="barra">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0 }}>Encuesta</h1>
          <div className="pequeno suave">{t('Tu opinión sobre la aplicación', 'Su opinión sobre la aplicación')}</div>
        </div>
      </header>
      <div className="progreso-nivel" role="progressbar" aria-valuemin={1} aria-valuemax={pasos} aria-valuenow={indice + 1} aria-label={`Pregunta ${indice + 1} de ${pasos}`}>
        {Array.from({ length: pasos }, (_, k) => (
          <span key={k} className={`punto ${k < indice ? 'hecho' : k === indice ? 'actual' : ''}`} />
        ))}
        <span className="pequeno" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {indice + 1} de {pasos}
        </span>
      </div>

      {pregunta ? (
        <section key={pregunta.clave} className="vidrio tarjeta columna encuesta-pregunta">
          <h2 id="encuesta-pregunta" style={{ margin: 0 }}>
            {t(pregunta.nino, pregunta.adulto)}
          </h2>
          <div className="encuesta-caritas" role="radiogroup" aria-labelledby="encuesta-pregunta">
            {ESCALA.map((o) => (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={elegida === o.valor}
                className="carita"
                onClick={() => elegir(o.valor)}
              >
                <Carita valor={o.valor} />
                <span>{o.texto}</span>
              </button>
            ))}
          </div>
          {pregunta.noUso && (
            <button type="button" role="radio" aria-checked={elegida === null} className="carita carita-no-uso" onClick={() => elegir(null)}>
              {t(pregunta.noUso.nino, pregunta.noUso.adulto)}
            </button>
          )}
        </section>
      ) : (
        <section className="vidrio tarjeta columna encuesta-pregunta">
          <h2 style={{ margin: 0 }}>{t('Si quieres, escríbenos', 'Si quiere, escríbanos')}</h2>
          <p className="pequeno suave" style={{ margin: 0 }}>
            {t('Estas dos preguntas no son obligatorias.', 'Estas dos preguntas no son obligatorias.')}
          </p>
          <label className="encuesta-texto">
            <span>{t(ABIERTAS.gusto.nino, ABIERTAS.gusto.adulto)}</span>
            <textarea className="campo" rows={3} maxLength={MAX_TEXTO_ENCUESTA} value={gusto} onChange={(e) => setGusto(e.target.value)} />
          </label>
          <label className="encuesta-texto">
            <span>{t(ABIERTAS.mejorar.nino, ABIERTAS.mejorar.adulto)}</span>
            <textarea className="campo" rows={3} maxLength={MAX_TEXTO_ENCUESTA} value={mejorar} onChange={(e) => setMejorar(e.target.value)} />
          </label>
        </section>
      )}

      <div className="acciones-pegadas">
        <button type="button" className="boton principal brillo" disabled={!!pregunta && elegida === undefined} onClick={siguiente}>
          {ultima ? (
            <>
              <Icono nombre="check" tamano={24} /> Enviar
            </>
          ) : (
            <>
              Siguiente <Icono nombre="siguiente" tamano={24} />
            </>
          )}
        </button>
        {indice > 0 && (
          <button type="button" className="boton secundario" onClick={() => setIndice(indice - 1)}>
            <Icono nombre="atras" tamano={22} /> {t('Cambiar la anterior', 'Cambiar la anterior')}
          </button>
        )}
      </div>
    </main>
  );
}
