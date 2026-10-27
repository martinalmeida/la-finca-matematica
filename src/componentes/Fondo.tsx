// Fondo vivo: manchas de color difuminadas y un velo iridiscente que se mueven a distintas
// velocidades al hacer scroll (paralaje). Las tarjetas de vidrio lo refractan con backdrop-filter.
// Con efectos «ligeros» queda un degradado fijo.
// La posición del scroll (--s) se escribe solo en .fondo: en la raíz obligaba a recalcular
// el estilo de toda la página en cada cuadro de scroll.

import { useEffect, useRef } from 'react';
import { useApp } from '../estado';

export default function Fondo() {
  const { ajustes } = useApp();
  const activo = ajustes.efectos === 'completos';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
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
    <div className="fondo" aria-hidden="true" ref={ref}>
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
