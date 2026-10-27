// Fondo vivo: manchas de color difuminadas y un velo iridiscente que se mueven a distintas
// velocidades al hacer scroll (paralaje). Las tarjetas de vidrio lo refractan con backdrop-filter.
// Con efectos «ligeros» queda un degradado fijo.

import { useEffect } from 'react';
import { useApp } from '../estado';

export default function Fondo() {
  const { ajustes } = useApp();
  const activo = ajustes.efectos === 'completos';

  useEffect(() => {
    const raiz = document.documentElement;
    if (!activo) {
      raiz.style.setProperty('--s', '0');
      return;
    }
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      raiz.style.setProperty('--s', String(Math.round(window.scrollY)));
    };
    const alDesplazar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      window.removeEventListener('scroll', alDesplazar);
      cancelAnimationFrame(pendiente);
    };
  }, [activo]);

  return (
    <div className="fondo" aria-hidden="true">
      <div className="mancha m1" />
      <div className="mancha m2" />
      <div className="mancha m3" />
      <div className="mancha m4" />
      <div className="mancha m5" />
      <div className="velo" />
      <div className="lamina l1" />
      <div className="lamina l2" />
    </div>
  );
}
