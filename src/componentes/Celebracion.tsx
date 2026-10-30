import { useEffect } from 'react';
import { sonar } from '../servicios/sonido';
import { useApp } from '../estado';
import Icono from './Icono';
import { focoEnControl, useTeclas } from '../servicios/teclas';

export default function Celebracion({ titulo, texto, alCerrar }: { titulo: string; texto: string; alCerrar: () => void }) {
  const { ajustes } = useApp();
  useEffect(() => sonar('cosecha', ajustes.sonido), [ajustes.sonido]);
  useTeclas((e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && !focoEnControl())) {
      alCerrar();
      return true;
    }
    return false;
  }, true, true);
  return (
    <div className="celebracion" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="columna centro">
        <div className="fila" aria-hidden="true" style={{ justifyContent: 'center' }}>
          {(['mazorca', 'naranja', 'aguacate', 'huevo', 'cafe'] as const).map((e, k) => (
            <span key={k} className="lluvia" style={{ animationDelay: `${k * 0.15}s` }}>
              <Icono nombre={e} tamano={44} anim="siempre" />
            </span>
          ))}
        </div>
        <Icono nombre="fiesta" tamano={88} anim="siempre" />
        <h2 style={{ fontSize: '1.8rem' }}>{titulo}</h2>
        <p style={{ fontSize: '1.1rem' }}>{texto}</p>
        <button type="button" className="boton principal" onClick={alCerrar}>
          ¡Qué bien!
        </button>
      </div>
    </div>
  );
}
