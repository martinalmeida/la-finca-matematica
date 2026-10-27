// Pie con la autoría: fijo abajo y siempre visible en todas las pantallas.
// Publica su altura en --alto-pie para que las pestañas y el contenido queden por encima
// (cambia con el tamaño de la letra y con el ancho del celular).

import { useLayoutEffect, useRef } from 'react';
import { DERECHOS, PROGRAMA } from '../contenido/autoria';

export default function PieAutor() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const pie = ref.current;
    if (!pie) return;
    const medir = () => document.documentElement.style.setProperty('--alto-pie', `${pie.offsetHeight}px`);
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(medir);
    observador.observe(pie);
    return () => observador.disconnect();
  }, []);
  return (
    <footer ref={ref} className="pie-autor">
      {DERECHOS} {PROGRAMA}, UDI.
    </footer>
  );
}
