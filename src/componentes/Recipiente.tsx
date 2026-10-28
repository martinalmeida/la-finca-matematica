// Recipientes con su forma real: canasta tejida (con asa y borde trenzado), caja de cartón,
// costal de fique y cubeta de huevos. Lo que el enunciado pone «en la canasta» se ve dentro de
// una canasta, no de una tarjeta. Sin forma conocida (personas, «Lo que había»…) es un área punteada.

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export type FormaRecipiente = 'canasta' | 'caja' | 'costal' | 'cubeta';

/** Forma que corresponde al dibujo de un Recipiente (null: área neutra). */
export function formaRecipiente(dibujo?: string): FormaRecipiente | null {
  switch (dibujo) {
    case 'canasta':
      return 'canasta';
    case 'caja':
      return 'caja';
    case 'bolsa':
    case 'bulto':
      return 'costal';
    case 'cubeta':
      return 'cubeta';
    default:
      return null;
  }
}

type Props = HTMLAttributes<HTMLSpanElement> & {
  forma: FormaRecipiente | null;
  /** Rótulo o botón: cuelga sobre el borde del recipiente. */
  rotulo?: ReactNode;
  /** Versión compacta para las pistas y las figuras. */
  pequeno?: boolean;
  /** Se resalta mientras se arrastra algo encima o se espera que lo toquen. */
  activo?: boolean;
  children?: ReactNode;
};

const Recipiente = forwardRef<HTMLSpanElement, Props>(function Recipiente({ forma, rotulo, pequeno = false, activo = false, className = '', children, ...resto }, ref) {
  const clases = ['recipiente', `recipiente-${forma ?? 'plano'}`, pequeno ? 'recipiente-pequeno' : '', activo ? 'activo' : '', className].filter(Boolean).join(' ');
  return (
    // Con <span> se puede poner dentro de un botón (las figuras de Inclusión son botones).
    <span ref={ref} className={clases} {...resto}>
      <span className="recipiente-cuerpo">
        {forma === 'canasta' && <span className="recipiente-asa" aria-hidden="true" />}
        {rotulo}
        <span className="recipiente-dentro">{children}</span>
      </span>
    </span>
  );
});

export default Recipiente;
