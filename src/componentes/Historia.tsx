// Historia (mini-lección) a pantalla completa, diapositiva por diapositiva, como en las redes:
// portada, idea clave, ejemplo resuelto paso a paso, truco, mini-reto y "¡a practicar!".
// Toque a la derecha para avanzar y a la izquierda para volver. No avanza sola: cada quien lee a su ritmo.

import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../estado';
import type { Leccion } from '../contenido/lecciones';
import type { Unidad } from '../juego/complejidad';
import { Avatar } from './Ilustraciones';
import { avatarDeAutor } from '../contenido/red';
import { useLecturaAutomatica, useVoz } from '../servicios/voz';
import Icono, { IconoEmoji } from './Icono';
import { BotonEscuchar } from './Comunes';
import { retroError, sonar } from '../servicios/sonido';
import { BotonVideo } from './Video';
import { videoDeLeccion } from '../contenido/videos';
import { pistaDePerfil } from '../almacenamiento/datos';

export function Medidor({ barras, max = 5, etiqueta }: { barras: number; max?: number; etiqueta?: string }) {
  return (
    <span className="medidor" role="img" aria-label={etiqueta ?? `Complejidad ${barras} de ${max}`}>
      {Array.from({ length: max }, (_, k) => (
        <span key={k} className={k < barras ? 'lleno' : ''} style={{ height: `${40 + k * 15}%` }} />
      ))}
    </span>
  );
}

/** Pregunta de 3 opciones con retroalimentación inmediata (en historias y en el inicio). */
export function MiniReto({ reto, adulto, alResolver }: { reto: Leccion['reto']; adulto: boolean; alResolver?: (bien: boolean) => void }) {
  const { ajustes } = useApp();
  const voz = useVoz();
  const [elegida, setElegida] = useState<number | null>(null);
  const bien = elegida === reto.correcta;
  const lectura = `${reto.pregunta} Las opciones son: ${reto.opciones.map((o, k) => `${'ABC'[k]}, ${o}`).join('; ')}.`;
  return (
    <div className="columna mini-reto">
      <div className="fila" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <p className="mini-reto-pregunta" style={{ flex: 1 }}>
          {reto.pregunta}
        </p>
        <BotonEscuchar texto={lectura} clave={`reto-${reto.pregunta}`} soloIcono etiqueta="Escuchar la pregunta" />
      </div>
      <div className="columna" role="group" aria-label="Opciones">
        {reto.opciones.map((o, k) => {
          const estado = elegida === null ? '' : k === reto.correcta ? 'correcta' : k === elegida ? 'incorrecta' : 'apagada';
          return (
            <button
              key={k}
              type="button"
              className={`opcion-reto ${estado}`}
              disabled={elegida !== null && bien}
              onClick={(e) => {
                e.stopPropagation();
                if (elegida !== null && bien) return;
                setElegida(k);
                const ok = k === reto.correcta;
                if (ok) sonar('acierto', ajustes.sonido);
                else retroError(ajustes);
                alResolver?.(ok);
                if (ajustes.audioEnunciados) voz.leer(ok ? reto.porque : adulto ? 'Revise otra vez y elija de nuevo.' : 'Casi. Piénsalo otra vez y elige de nuevo.', `reto-${reto.pregunta}-r`);
              }}
            >
              <span className="letra" aria-hidden="true">
                {'ABC'[k]}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {elegida !== null && (
        <div className={`retro ${bien ? 'bien' : 'casi'}`} role="status">
          <span className="icono-retro">
            <Icono nombre={bien ? 'check' : 'pensar'} tamano={28} />
          </span>
          <span>{bien ? reto.porque : adulto ? 'Revise otra vez y elija de nuevo.' : 'Casi. Piénsalo otra vez y elige de nuevo.'}</span>
        </div>
      )}
    </div>
  );
}

type Props = {
  leccion: Leccion;
  unidad: Unidad;
  adulto: boolean;
  /** Si el nivel del tema está desbloqueado, el último paso lleva a practicarlo. */
  alPracticar?: () => void;
  alCerrar: () => void;
};

export default function Historia({ leccion: l, unidad, adulto, alPracticar, alCerrar }: Props) {
  const { ajustes, perfil } = useApp();
  const [paso, setPaso] = useState(0);
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const video = perfil ? videoDeLeccion(pistaDePerfil(perfil), unidad.indice) : null;

  const diapositivas: { clave: string; voz: string; contenido: ReactNode }[] = [
    {
      clave: 'portada',
      voz: `${l.titulo}. ${unidad.titulo}`,
      contenido: (
        <div className="columna centro historia-portada">
          <span className="historia-emoji">
            <IconoEmoji emoji={l.emoji} tamano={96} anim="siempre" />
          </span>
          <span className="chip">
            Nivel {unidad.inicio} · {unidad.complejidad.nombre} <Medidor barras={unidad.complejidad.barras} />
          </span>
          <h2 className="historia-titulo">{l.titulo}</h2>
          <p className="suave">{unidad.titulo}</p>
          <p className="pequeno suave">{tu('Toca a la derecha para seguir', 'Toque a la derecha para seguir')}</p>
        </div>
      ),
    },
    {
      clave: 'idea',
      voz: l.idea,
      contenido: (
        <div className="columna">
          <span className="chip">
            <Icono nombre="bombillo" tamano={20} /> La idea clave
          </span>
          <p className="historia-grande">{l.idea}</p>
        </div>
      ),
    },
    {
      clave: 'ejemplo',
      voz: `${l.ejemplo.enunciado} ${l.ejemplo.pasos.join('. ')}. ${l.ejemplo.resultado}`,
      contenido: (
        <div className="columna">
          <span className="chip">
            <Icono nombre="canasta" tamano={20} /> Un ejemplo de la finca
          </span>
          <p className="historia-enunciado">{l.ejemplo.enunciado}</p>
          <ol className="pasos-ejemplo">
            {l.ejemplo.pasos.map((p, k) => (
              <li key={k} style={{ animationDelay: `${0.25 + k * 0.55}s` }}>
                {p}
              </li>
            ))}
          </ol>
          <p className="resultado-ejemplo" style={{ animationDelay: `${0.25 + l.ejemplo.pasos.length * 0.55}s` }}>
            <Icono nombre="check" tamano={22} /> {l.ejemplo.resultado}
          </p>
        </div>
      ),
    },
    {
      clave: 'truco',
      voz: l.truco,
      contenido: (
        <div className="columna">
          <span className="chip">
            <Icono nombre="chispas" tamano={20} /> Truco para recordar
          </span>
          <p className="historia-grande">{l.truco}</p>
        </div>
      ),
    },
    {
      clave: 'reto',
      voz: `${l.reto.pregunta} ${l.reto.opciones.join(', ')}`,
      contenido: (
        <div className="columna">
          <span className="chip">
            <Icono nombre="diana" tamano={20} /> {tu('¿Lo entendiste? Pruébalo', '¿Quedó claro? Compruébelo')}
          </span>
          <MiniReto reto={l.reto} adulto={adulto} />
        </div>
      ),
    },
    {
      clave: 'final',
      voz: tu('¡Muy bien! Ahora practica en tu ruta.', '¡Muy bien! Ahora practique en su ruta.'),
      contenido: (
        <div className="columna centro">
          <span className="historia-emoji">
            <Icono nombre="brote" tamano={96} anim="siempre" />
          </span>
          <h2 className="historia-titulo">{tu('¡Ya sabes cómo se hace!', '¡Listo!')}</h2>
          <p>
            {alPracticar
              ? tu(`Ahora practica en el nivel ${unidad.inicio} de tu ruta.`, `Ahora practique en el nivel ${unidad.inicio}.`)
              : tu('Este nivel se abre cuando avances en tu ruta. ¡Vas muy bien!', 'Este nivel se abre cuando avance en su ruta.')}
          </p>
          {alPracticar && (
            <button
              type="button"
              className="boton principal"
              onClick={(e) => {
                e.stopPropagation();
                alPracticar();
              }}
            >
              <Icono nombre="jugar-simple" tamano={22} /> Practicar ahora
            </button>
          )}
          <BotonVideo video={video} adulto={adulto} texto={tu('Verlo explicado en un video', 'Verlo explicado en un video')} />
          <button
            type="button"
            className="boton secundario"
            onClick={(e) => {
              e.stopPropagation();
              alCerrar();
            }}
          >
            Cerrar
          </button>
        </div>
      ),
    },
  ];

  const total = diapositivas.length;
  const ir = (n: number) => {
    if (n < 0) return;
    if (n >= total) return alCerrar();
    sonar('toque', ajustes.sonido);
    setPaso(n);
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar();
      if (e.key === 'ArrowRight') setPaso((p) => Math.min(p + 1, total - 1));
      if (e.key === 'ArrowLeft') setPaso((p) => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', tecla);
    document.body.classList.add('sin-scroll');
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.classList.remove('sin-scroll');
    };
  }, [alCerrar, total]);

  const d = diapositivas[paso];
  // Cada diapositiva se lee sola (si la lectura en voz alta está activada).
  useLecturaAutomatica(`${l.titulo}-${d.clave}`, d.voz);
  // En el reto y el final se responde con botones: tocar el fondo no avanza.
  const interactiva = d.clave === 'reto' || d.clave === 'final';

  return (
    <div className="historia" role="dialog" aria-modal="true" aria-label={`Lección: ${l.titulo}`}>
      <div className="historia-barras" aria-hidden="true">
        {diapositivas.map((x, k) => (
          <span key={x.clave} className={k < paso ? 'vista' : k === paso ? 'actual' : ''} />
        ))}
      </div>
      <header className="historia-cabecera">
        <Avatar id={avatarDeAutor(l.autor)} tamano={36} etiqueta="" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong className="mayuscula-inicial">{l.autor}</strong>
          <div className="pequeno suave">
            {paso + 1} de {total}
          </div>
        </div>
        <BotonEscuchar texto={d.voz} clave={`${l.titulo}-${d.clave}`} soloIcono etiqueta="Escuchar" />
        <button type="button" className="boton icono vidrio-boton" onClick={alCerrar} aria-label="Cerrar la lección">
          <Icono nombre="cerrar" tamano={24} />
        </button>
      </header>

      <div
        className="historia-cuerpo"
        onClick={(e) => {
          if (interactiva) return;
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          ir(e.clientX - r.left < r.width * 0.3 ? paso - 1 : paso + 1);
        }}
      >
        <div key={d.clave} className="historia-diapositiva vidrio">
          {d.contenido}
        </div>
      </div>

      <footer className="historia-pie">
        <button type="button" className="boton vidrio-boton" onClick={() => ir(paso - 1)} disabled={paso === 0}>
          <Icono nombre="atras" tamano={22} /> Atrás
        </button>
        {paso < total - 1 && (
          <button type="button" className="boton principal" style={{ width: 'auto', flex: 1 }} onClick={() => ir(paso + 1)}>
            Siguiente <Icono nombre="siguiente" tamano={24} />
          </button>
        )}
      </footer>
    </div>
  );
}
