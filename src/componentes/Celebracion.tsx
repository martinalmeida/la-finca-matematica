import { useEffect } from 'react';
import { sonar } from '../servicios/sonido';
import { useApp } from '../estado';

export default function Celebracion({ titulo, texto, alCerrar }: { titulo: string; texto: string; alCerrar: () => void }) {
  const { ajustes } = useApp();
  useEffect(() => sonar('cosecha', ajustes.sonido), [ajustes.sonido]);
  return (
    <div className="celebracion" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="columna centro">
        <div className="fila" aria-hidden="true" style={{ justifyContent: 'center' }}>
          {['🌽', '🍊', '🥑', '🍫', '☕'].map((e, k) => (
            <span key={k} className="lluvia" style={{ animationDelay: `${k * 0.15}s` }}>
              {e}
            </span>
          ))}
        </div>
        <h2 style={{ fontSize: '1.8rem' }}>{titulo}</h2>
        <p style={{ fontSize: '1.1rem' }}>{texto}</p>
        <button type="button" className="boton principal" onClick={alCerrar}>
          ¡Qué bien!
        </button>
      </div>
    </div>
  );
}
