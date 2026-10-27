// Piezas de la interfaz tipo red social: publicaciones, barra de historias y cabecera de vidrio.

import { useState, type ReactNode } from 'react';
import { useApp } from '../estado';
import { Avatar, type AvatarId } from './Ilustraciones';
import { alternarReaccion, leerReacciones } from '../almacenamiento/datos';
import { sonar } from '../servicios/sonido';
import type { Unidad } from '../juego/complejidad';
import type { Leccion } from '../contenido/lecciones';
import Icono, { IconoEmoji } from './Icono';
import { BotonEscuchar } from './Comunes';

export function CabeceraVidrio({ titulo, subtitulo, izquierda, derecha }: { titulo: ReactNode; subtitulo?: ReactNode; izquierda?: ReactNode; derecha?: ReactNode }) {
  return (
    <header className="cabecera vidrio">
      {izquierda}
      <div className="cabecera-textos">
        <h1>{titulo}</h1>
        {subtitulo && <div className="pequeno suave">{subtitulo}</div>}
      </div>
      {derecha}
    </header>
  );
}

type PropsPublicacion = {
  id: string;
  avatar: AvatarId | string;
  autor: string;
  meta: string;
  etiqueta?: ReactNode;
  children: ReactNode;
  /** Texto del botón de reacción (sin marcar, marcado) y su ícono. */
  reaccion?: [string, string];
  iconoReaccion?: 'corazon' | 'fiesta';
  acciones?: ReactNode;
  /** Texto para escuchar la publicación (para quienes aún no leen). */
  lectura?: string;
};

export function Publicacion({ id, avatar, autor, meta, etiqueta, children, reaccion = ['Me gusta', 'Te gusta'], iconoReaccion = 'corazon', acciones, lectura }: PropsPublicacion) {
  const { perfil, ajustes } = useApp();
  const [activa, setActiva] = useState(() => (perfil ? !!leerReacciones(perfil.id)[id] : false));
  const [pulso, setPulso] = useState(0);
  return (
    <article className="publicacion vidrio revelar">
      <header className="publicacion-cabecera">
        <span className="anillo-avatar pequeno-anillo">
          <Avatar id={avatar} tamano={40} etiqueta="" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong className="mayuscula-inicial">{autor}</strong>
          <div className="pequeno suave">{meta}</div>
        </div>
        {etiqueta && <span className="chip">{etiqueta}</span>}
      </header>
      <div className="publicacion-cuerpo">{children}</div>
      <footer className="publicacion-pie">
        {perfil && (
          <button
            type="button"
            className={`reaccion ${activa ? 'activa' : ''}`}
            aria-pressed={activa}
            onClick={() => {
              const v = alternarReaccion(perfil.id, id);
              setActiva(v);
              if (v) {
                setPulso((p) => p + 1);
                sonar('toque', ajustes.sonido);
              }
            }}
          >
            <span key={pulso} className={`fila ${pulso ? 'pop' : ''}`} style={{ gap: 6, flexWrap: 'nowrap' }}>
              <Icono nombre={activa ? iconoReaccion : iconoReaccion === 'corazon' ? 'corazon-vacio' : 'fiesta'} anim={activa ? 'una' : 'no'} tamano={26} className={activa ? '' : 'apagado'} />
              {activa ? reaccion[1] : reaccion[0]}
            </span>
          </button>
        )}
        <span className="fila" style={{ marginLeft: 'auto' }}>
          {lectura && <BotonEscuchar texto={lectura} clave={`pub-${id}`} soloIcono etiqueta="Escuchar la publicación" />}
          {acciones}
        </span>
      </footer>
    </article>
  );
}

/** Fila de historias: una por tema de la ruta. */
export function BarraHistorias({
  unidades,
  lecciones,
  vistas,
  disponible,
  actual,
  alAbrir,
}: {
  unidades: Unidad[];
  lecciones: Leccion[];
  vistas: string[];
  disponible: (u: Unidad) => boolean;
  actual: number;
  alAbrir: (u: Unidad) => void;
}) {
  return (
    <div className="historias-fila" role="list" aria-label="Lecciones de tu ruta">
      {unidades.map((u) => {
        const l = lecciones[u.indice];
        const libre = disponible(u);
        const vista = vistas.includes(`${u.indice}`);
        const enCurso = actual >= u.inicio && actual <= u.fin;
        return (
          <div role="listitem" key={u.indice}>
            <button
              type="button"
              className={`historia-burbuja ${libre ? '' : 'bloqueada'} ${vista ? 'vista' : ''} ${enCurso ? 'en-curso' : ''}`}
              disabled={!libre}
              onClick={() => alAbrir(u)}
              aria-label={`Lección ${u.indice + 1}: ${l?.titulo ?? u.titulo}${libre ? '' : ', bloqueada'}${vista ? ', vista' : ''}`}
            >
              <span className="historia-anillo">
                <span className="historia-circulo" aria-hidden="true">
                  {libre ? <IconoEmoji emoji={l?.emoji ?? '📖'} tamano={40} anim="siempre" /> : <Icono nombre="candado" tamano={32} anim="no" />}
                </span>
              </span>
              <span className="historia-nombre">{enCurso ? 'Ahora' : `Nivel ${u.inicio}`}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
