// Cifra que se dibuja sola, trazo por trazo, con su punto de inicio (Taller y actividad de trazar).

import { ALTO_CIFRA, ANCHO_CIFRA, FORMAS } from '../contenido/cifras';

/** La cifra se dibuja sola (trazo por trazo) con su punto de inicio. */
export default function CifraAnimada({ cifra, vuelta }: { cifra: number; vuelta: number }) {
  const forma = FORMAS[cifra][0];
  const DURACION = 1.4;
  return (
    <svg key={vuelta} className="cifra-animada" viewBox={`-12 -12 ${ANCHO_CIFRA + 24} ${ALTO_CIFRA + 24}`} role="img" aria-label={`Cómo se escribe el ${cifra}`}>
      {forma.map((t, k) => (
        <polyline key={`g${k}`} points={t.map((q) => `${q.x},${q.y}`).join(' ')} className="guia-cifra" />
      ))}
      {forma.map((t, k) => (
        <polyline
          key={k}
          points={t.map((q) => `${q.x},${q.y}`).join(' ')}
          pathLength={1}
          className="trazo-cifra"
          style={{ animationDelay: `${0.4 + k * DURACION}s`, animationDuration: `${DURACION}s` }}
        />
      ))}
      {forma.map((t, k) => (
        <g key={`i${k}`}>
          <circle cx={t[0].x} cy={t[0].y} r={5.5} className="inicio-cifra" />
          {forma.length > 1 && (
            <text x={t[0].x} y={t[0].y + 2.6} textAnchor="middle" className="numero-trazo">
              {k + 1}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
