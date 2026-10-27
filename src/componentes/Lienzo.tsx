// Lienzo para escribir con el dedo. Guarda los trazos en coordenadas del lienzo (ancho × alto),
// aunque en pantalla se vea más pequeño. Puede mostrar una guía punteada con su punto de inicio.

import { useEffect, useRef } from 'react';
import type { Punto, Trazo } from '../contenido/cifras';

type Props = {
  ancho: number;
  alto: number;
  trazos: Trazo[];
  onTrazos: (t: Trazo[]) => void;
  guia?: Trazo[];
  /** La guía parpadea (después de salirse de ella). */
  avisarGuia?: boolean;
  deshabilitado?: boolean;
  etiqueta: string;
  /** Texto grande que se pinta encima (p. ej., la cifra correcta revelada). */
  texto?: string;
};

const TINTA = '#102018';
const GUIA = '#9aa8b8';
const INICIO = '#16a34a';

function pintarTrazo(c: CanvasRenderingContext2D, t: Trazo) {
  if (!t.length) return;
  c.beginPath();
  c.moveTo(t[0].x, t[0].y);
  if (t.length === 1) c.lineTo(t[0].x + 0.1, t[0].y);
  for (let i = 1; i < t.length; i++) c.lineTo(t[i].x, t[i].y);
  c.stroke();
}

export default function Lienzo({ ancho, alto, trazos, onTrazos, guia, avisarGuia, deshabilitado, etiqueta, texto }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const actual = useRef<Trazo | null>(null);

  const pintar = () => {
    const el = lienzo.current;
    const c = el?.getContext('2d');
    if (!el || !c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (el.width !== ancho * dpr) {
      el.width = ancho * dpr;
      el.height = alto * dpr;
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, ancho, alto);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (guia?.length) {
      c.strokeStyle = GUIA;
      c.lineWidth = Math.max(10, ancho / 16);
      c.setLineDash([1, c.lineWidth * 1.4]);
      guia.forEach((t) => pintarTrazo(c, t));
      c.setLineDash([]);
      // Punto verde donde se empieza.
      c.fillStyle = INICIO;
      c.beginPath();
      c.arc(guia[0][0].x, guia[0][0].y, Math.max(9, ancho / 22), 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = TINTA;
    c.lineWidth = Math.max(8, ancho / 20);
    trazos.forEach((t) => pintarTrazo(c, t));
    if (actual.current) pintarTrazo(c, actual.current);
    if (texto) {
      c.fillStyle = 'rgba(21, 128, 61, 0.9)';
      c.font = `800 ${Math.round(alto * 0.7)}px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(texto, ancho / 2, alto / 2 + alto * 0.04);
    }
  };

  useEffect(pintar);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * ancho) / r.width, y: ((e.clientY - r.top) * alto) / r.height };
  };

  return (
    <canvas
      ref={lienzo}
      className={`lienzo ${avisarGuia ? 'avisar' : ''} ${deshabilitado ? 'deshabilitado' : ''}`}
      style={{ aspectRatio: `${ancho} / ${alto}`, maxWidth: ancho }}
      role="img"
      aria-label={etiqueta}
      onPointerDown={(e) => {
        if (deshabilitado) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        actual.current = [punto(e)];
        pintar();
      }}
      onPointerMove={(e) => {
        if (!actual.current) return;
        // Los eventos agrupados dan un trazo más suave en celulares lentos.
        const eventos = e.nativeEvent.getCoalescedEvents?.() ?? [];
        if (eventos.length > 1) {
          const r = e.currentTarget.getBoundingClientRect();
          for (const ev of eventos) actual.current.push({ x: ((ev.clientX - r.left) * ancho) / r.width, y: ((ev.clientY - r.top) * alto) / r.height });
        } else actual.current.push(punto(e));
        pintar();
      }}
      onPointerUp={() => {
        if (!actual.current) return;
        const t = actual.current;
        actual.current = null;
        onTrazos([...trazos, t]);
      }}
      onPointerCancel={() => {
        actual.current = null;
        pintar();
      }}
    />
  );
}
