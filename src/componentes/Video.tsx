// Videos de ayuda de YouTube. El reproductor se crea solo al tocar «Ver video» y usa el modo de
// privacidad mejorada (youtube-nocookie.com): sin internet se avisa y el resto de la app sigue igual.
// Los niños lo ven dentro de la app; a los adultos también se les ofrece abrirlo en YouTube.

import { useCapaConAtras } from '../servicios/atras';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../estado';
import { detenerVoz } from '../servicios/voz';
import type { Video } from '../contenido/videos';
import Icono from './Icono';

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const cambio = () => setEnLinea(navigator.onLine !== false);
    window.addEventListener('online', cambio);
    window.addEventListener('offline', cambio);
    return () => {
      window.removeEventListener('online', cambio);
      window.removeEventListener('offline', cambio);
    };
  }, []);
  return enLinea;
}

function direccionReproductor(id: string) {
  const p = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1', hl: 'es', cc_lang_pref: 'es', autoplay: '1' });
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

/** El reproductor en sí (o el aviso de que falta internet). Se crea ya reproduciendo. */
function MarcoVideo({ video, adulto, enLinea }: { video: Video; adulto: boolean; enLinea: boolean }) {
  const [cargado, setCargado] = useState(false);
  return (
    <div className="marco-video">
      {enLinea ? (
        <>
          {!cargado && (
            <p className="marco-video-aviso" aria-live="polite">
              Cargando el video…
            </p>
          )}
          <iframe
            src={direccionReproductor(video.id)}
            title={video.titulo}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setCargado(true)}
          />
        </>
      ) : (
        <p className="marco-video-aviso">
          <Icono nombre="aviso" tamano={28} />
          <span>
            {adulto ? 'Este video necesita internet. Conéctese y vuelva a abrirlo.' : 'Este video necesita internet. Cuando haya señal, vuelve a abrirlo.'}
            <br />
            {adulto ? 'Lo demás de la aplicación funciona sin conexión.' : 'Mientras tanto, puedes seguir jugando sin internet.'}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Video dentro de la página (introducción de cada nivel). Hasta que alguien toca «play» solo se
 * dibuja un marco propio: no se pide nada a YouTube, ni siquiera la miniatura.
 */
export function VideoEnPagina({ video, adulto }: { video: Video; adulto: boolean }) {
  const enLinea = useEnLinea();
  const [activo, setActivo] = useState(false);
  if (activo) return <MarcoVideo video={video} adulto={adulto} enLinea={enLinea} />;
  return (
    <button
      type="button"
      className="marco-video marco-video-portada"
      onClick={() => {
        detenerVoz();
        setActivo(true);
      }}
      aria-label={`Ver el video: ${video.titulo}`}
    >
      <span className="marco-video-play" aria-hidden="true">
        <Icono nombre="jugar" tamano={44} anim="no" />
      </span>
      <span className="marco-video-titulo">
        <strong>{video.titulo}</strong>
        <span className="pequeno">
          {video.canal} · {video.duracion} min
          {!enLinea && ' · necesita internet'}
        </span>
      </span>
    </button>
  );
}

export function HojaVideo({ video, adulto, alCerrar }: { video: Video; adulto: boolean; alCerrar: () => void }) {
  const enLinea = useEnLinea();
  useCapaConAtras(true, alCerrar);

  useEffect(() => {
    detenerVoz();
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [alCerrar]);

  // Portal al body: queda encima de todo aunque se abra dentro de una historia o un ejercicio.
  return createPortal(
    <div className="velo-video" onClick={alCerrar}>
      <section className="hoja-video" role="dialog" aria-modal="true" aria-label={`Video: ${video.titulo}`} onClick={(e) => e.stopPropagation()}>
        <header className="fila hoja-video-cabeza">
          <Icono nombre="video" tamano={32} anim="no" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{video.titulo}</strong>
            <div className="pequeno suave">
              {video.canal} · {video.duracion} min
            </div>
          </div>
          <button type="button" className="boton icono" onClick={alCerrar} aria-label="Cerrar el video">
            <Icono nombre="cerrar" tamano={24} />
          </button>
        </header>
        <MarcoVideo video={video} adulto={adulto} enLinea={enLinea} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Video externo de YouTube, del canal {video.canal}.
        </p>
        {adulto && enLinea && (
          <a className="boton plano" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
            Abrir en YouTube
          </a>
        )}
      </section>
    </div>,
    document.body,
  );
}

/** Botón «Ver video». No aparece si en Ajustes se apagaron los videos. */
export function BotonVideo({ video, texto, adulto, clase = 'boton secundario' }: { video: Video | null; texto?: string; adulto?: boolean; clase?: string }) {
  const { ajustes, perfil } = useApp();
  const [abierto, setAbierto] = useState(false);
  if (!video || ajustes.videos === false) return null;
  const esAdulto = adulto ?? perfil?.rol === 'familia';
  return (
    <>
      <button
        type="button"
        className={`${clase} boton-video`}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(true);
        }}
      >
        <Icono nombre="video" tamano={26} />
        <span>
          {texto ?? (esAdulto ? 'Ver un video de apoyo' : 'Ver un video')} <span className="suave pequeno">· {video.duracion}</span>
        </span>
      </button>
      {abierto && <HojaVideo video={video} adulto={esAdulto} alCerrar={() => setAbierto(false)} />}
    </>
  );
}
