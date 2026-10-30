// Tarjeta de una gráfica: superficie sólida (no vidrio), título, acciones y «Ver tabla».

import { useId } from 'react';
import type { ReactNode } from 'react';
import { ContextoTarjeta, VerTabla } from './nucleo';

export function Tarjeta({
  titulo,
  subtitulo,
  acciones,
  children,
  tabla,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  /** Tabla propia para «Ver tabla». Si se da, reemplaza las tablas automáticas de las gráficas de adentro. */
  tabla?: ReactNode;
}) {
  const id = useId();
  return (
    <figure className="viz viz-tarjeta" aria-labelledby={`${id}t`}>
      <figcaption className="viz-tarjeta-cabeza">
        <div className="viz-tarjeta-titulos">
          <div className="viz-tarjeta-titulo" id={`${id}t`}>
            {titulo}
          </div>
          {subtitulo && <div className="viz-tarjeta-subtitulo">{subtitulo}</div>}
        </div>
        {acciones && <div className="viz-tarjeta-acciones">{acciones}</div>}
      </figcaption>
      <ContextoTarjeta.Provider value={{ tablaPropia: tabla !== undefined && tabla !== null }}>
        <div className="viz-tarjeta-cuerpo">{children}</div>
      </ContextoTarjeta.Provider>
      {tabla !== undefined && tabla !== null && <VerTabla forzar>{tabla}</VerTabla>}
    </figure>
  );
}
