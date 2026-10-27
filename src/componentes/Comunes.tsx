// Piezas pequeñas compartidas por varias pantallas.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../estado';
import Teclado from './Teclado';
import Icono from './Icono';
import { useVoz } from '../servicios/voz';

/** Botón para escuchar (o volver a escuchar) un texto. El ícono se anima mientras se lee. */
export function BotonEscuchar({ texto, clave = texto, etiqueta, soloIcono = false }: { texto: string; clave?: string; etiqueta?: string; soloIcono?: boolean }) {
  const voz = useVoz();
  if (!voz.disponible) return null;
  const activo = voz.leyendo === clave;
  const rotulo = etiqueta ?? 'Escuchar otra vez';
  return (
    <button
      type="button"
      className={`boton boton-escuchar ${soloIcono ? 'solo-icono' : ''} ${activo ? 'activo' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (activo) voz.detener();
        else voz.leer(texto, clave);
      }}
      aria-label={activo ? 'Detener la lectura' : rotulo}
      aria-pressed={activo}
    >
      <Icono nombre="altavoz" tamano={soloIcono ? 28 : 30} className={activo ? 'hablando' : ''} anim={activo ? 'siempre' : 'una'} />
      {!soloIcono && <span>{activo ? 'Leyendo…' : rotulo}</span>}
    </button>
  );
}

export function Barra({ titulo, alVolver, derecha }: { titulo: ReactNode; alVolver?: () => void; derecha?: ReactNode }) {
  const { volver } = useApp();
  return (
    <header className="barra">
      <button type="button" className="boton icono" onClick={alVolver ?? volver} aria-label="Volver">
        <Icono nombre="atras" tamano={24} />
      </button>
      <h1>{titulo}</h1>
      {derecha}
    </header>
  );
}

export function Estrellas({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <div className="estrellas" role="img" aria-label={`${n} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, k) => (
        <span key={k} className={k < n ? '' : 'vacia'}>
          <Icono nombre="estrella" tamano={56} anim={k < n ? 'una' : 'no'} />
        </span>
      ))}
    </div>
  );
}

/** PIN sencillo de adulto: resolver una multiplicación (p. ej., 7 × 8). */
export function PinAdulto({ alAprobar, alCancelar, texto }: { alAprobar: () => void; alCancelar: () => void; texto?: string }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], []);
  const [valor, setValor] = useState('');
  const [error, setError] = useState(false);
  return (
    <div className="tarjeta columna" role="dialog" aria-label="Confirmación de un adulto">
      <h2>Solo para adultos</h2>
      <p>{texto ?? 'Para continuar, un adulto debe resolver:'}</p>
      <p className="centro" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
        {a} × {b} = ?
      </p>
      {error && <p className="retro casi">Ese no es el resultado. Intente de nuevo.</p>}
      <Teclado
        valor={valor}
        onCambio={setValor}
        onListo={() => {
          if (Number(valor) === a * b) alAprobar();
          else {
            setError(true);
            setValor('');
          }
        }}
      />
      <button type="button" className="boton secundario" onClick={alCancelar}>
        Cancelar
      </button>
    </div>
  );
}

export function useLargaPulsacion(ms: number, accion: () => void) {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => () => {
    if (t) window.clearTimeout(t);
  }, [t]);
  const iniciar = () => setT(window.setTimeout(accion, ms));
  const cancelar = () => {
    if (t) window.clearTimeout(t);
    setT(null);
  };
  return {
    onPointerDown: iniciar,
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: cancelar,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
}
