// Píldora de estado: ícono + texto (el color nunca va solo).

import type { ReactNode } from 'react';
import type { Tono } from './tipos';
import { ICONO_TONO, NOMBRE_TONO } from './colores';

export function Insignia({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span className={`viz viz-insignia viz-tono-${tono}`}>
      <span className="viz-insignia-icono" aria-hidden="true">
        {ICONO_TONO[tono]}
      </span>
      <span className="viz-sr">{NOMBRE_TONO[tono]}: </span>
      <span>{children}</span>
    </span>
  );
}
