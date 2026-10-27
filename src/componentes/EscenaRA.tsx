// Escena de realidad aumentada: la cámara muestra el entorno real y encima aparecen objetos
// de la finca para contar, meter o sacar de la canasta. Si no hay cámara (o no se dio permiso),
// la escena usa un fondo dibujado y funciona igual. En celulares con ARCore, los objetos se
// pueden «poner en el piso» con WebXR. Nada de la cámara se graba ni se envía.

import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import { createPortal } from 'react-dom';
import type { Ejercicio, Objeto } from '../juego/tipos';
import { cantidadObjeto, DibujoObjeto, nombreObjeto } from './Ilustraciones';
import { useApp } from '../estado';
import { abrirCamara, cerrarCamara, estadoPorError, hayCamara, type EstadoCamara } from '../servicios/camara';
import { iniciarRA, soportaRA, type EstadoRA, type SesionRA } from '../servicios/xr';
import { sonar } from '../servicios/sonido';
import { useVoz } from '../servicios/voz';
import { num } from '../contenido/contexto';
import Icono from './Icono';

export type ConfigEscena =
  /** Tocar cada objeto para contarlo. */
  | { modo: 'contar'; objeto: Objeto; cantidad: number }
  /** Meter objetos a la canasta (juntar) o sacarlos (quitar). */
  | { modo: 'canasta'; objeto: Objeto; dentro: number; fuera: number; quitar: boolean }
  /** Mostrar una cantidad (después de escribir un número en el Taller). */
  | { modo: 'cantidad'; objeto: Objeto; cantidad: number }
  /** Contar cosas reales: cada toque en la pantalla pone una marca numerada. */
  | { modo: 'real' };

/** Escena que corresponde a un ejercicio, si tiene objetos para ver en la cámara. */
export function escenaDe(ej: Ejercicio): ConfigEscena | null {
  const i = ej.interaccion;
  if (i.tipo === 'contar') return { modo: 'contar', objeto: i.objeto, cantidad: i.cantidad };
  if (i.tipo === 'arrastrar' && i.modo === 'juntar' && i.a + i.b <= 20) return { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: i.b, quitar: false };
  if (i.tipo === 'arrastrar' && i.modo === 'quitar' && i.a <= 20) return { modo: 'canasta', objeto: i.objeto, dentro: i.a, fuera: 0, quitar: true };
  const v = ej.pistas[1];
  if (v.tipo === 'objetos') {
    const total = v.grupos.reduce((s, g) => s + g, 0);
    if (total > 20) return null;
    if (v.tachados) return { modo: 'canasta', objeto: v.objeto, dentro: total, fuera: 0, quitar: true };
    if (v.grupos.length === 2) return { modo: 'canasta', objeto: v.objeto, dentro: v.grupos[0], fuera: v.grupos[1], quitar: false };
    return { modo: 'contar', objeto: v.objeto, cantidad: total };
  }
  return null;
}

type Cosa = { x: number; y: number; marca: number | null };

/** Zona de la canasta, en % de la escena. */
const CANASTA = { x0: 18, x1: 82, y0: 66, y1: 92 };
const enCanasta = (c: { x: number; y: number }) => c.x >= CANASTA.x0 && c.x <= CANASTA.x1 && c.y >= CANASTA.y0 && c.y <= CANASTA.y1;

/** Reparte n posiciones en una zona sin que se encimen (cuadrícula con un poco de azar). */
function repartir(n: number, x0: number, x1: number, y0: number, y1: number): { x: number; y: number }[] {
  if (n <= 0) return [];
  const columnas = Math.ceil(Math.sqrt(n * ((x1 - x0) / (y1 - y0))));
  const filas = Math.ceil(n / columnas);
  const ax = (x1 - x0) / columnas;
  const ay = (y1 - y0) / filas;
  return Array.from({ length: n }, (_, k) => ({
    x: x0 + ax * ((k % columnas) + 0.5 + (Math.random() - 0.5) * 0.35),
    y: y0 + ay * (Math.floor(k / columnas) + 0.5 + (Math.random() - 0.5) * 0.35),
  }));
}

function cosasIniciales(c: ConfigEscena): Cosa[] {
  const sin = (p: { x: number; y: number }) => ({ ...p, marca: null });
  switch (c.modo) {
    case 'contar':
    case 'cantidad':
      return repartir(c.cantidad, 8, 92, 20, 74).map(sin);
    case 'canasta':
      return [...repartir(c.dentro, CANASTA.x0 + 4, CANASTA.x1 - 4, CANASTA.y0 + 3, CANASTA.y1 - 3), ...repartir(c.fuera, 8, 92, 20, 56)].map(sin);
    case 'real':
      return [];
  }
}

type Props = {
  config: ConfigEscena;
  titulo: string;
  instruccion?: string;
  /** Texto que se dice y se muestra al aparecer los objetos (modo cantidad). */
  mensaje?: string;
  alCerrar: () => void;
};

export default function EscenaRA({ config, titulo, instruccion, mensaje, alCerrar }: Props) {
  const { ajustes, perfil } = useApp();
  const adulto = perfil?.rol === 'familia';
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const voz = useVoz();
  const video = useRef<HTMLVideoElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [camara, setCamara] = useState<EstadoCamara>(hayCamara() ? 'pidiendo' : 'sin-camara');
  const [cosas, setCosas] = useState<Cosa[]>(() => cosasIniciales(config));
  const arrastre = useRef<{ k: number; x: number; y: number; movio: boolean } | null>(null);
  // WebXR
  const [puedeXr, setPuedeXr] = useState(false);
  const [xr, setXr] = useState<EstadoRA | null>(null);
  const sesion = useRef<SesionRA | null>(null);
  const dibujos = useRef<(HTMLElement | null)[]>([]);
  const marcaPiso = useRef<HTMLDivElement>(null);
  const [reintento, setReintento] = useState(0);

  const objeto = config.modo === 'real' ? null : config.objeto;
  const total = cosas.length;
  const tamano = total > 14 ? 46 : total > 8 ? 54 : 64;
  const contados = cosas.filter((c) => c.marca !== null).length;
  const enLaCanasta = config.modo === 'canasta' ? cosas.filter(enCanasta).length : 0;

  // Cámara: se abre al entrar y se apaga al salir (también mientras se usa WebXR).
  useEffect(() => {
    if (!hayCamara() || xr) return;
    let vivo = true;
    setCamara('pidiendo');
    abrirCamara(ajustes.efectos === 'ligeros')
      .then((f) => {
        if (!vivo) return cerrarCamara(f);
        flujo.current = f;
        if (video.current) {
          video.current.srcObject = f;
          void video.current.play().catch(() => undefined);
        }
        setCamara('lista');
      })
      .catch((e) => vivo && setCamara(estadoPorError(e)));
    return () => {
      vivo = false;
      cerrarCamara(flujo.current);
      flujo.current = null;
    };
  }, [ajustes.efectos, xr, reintento]);

  useEffect(() => {
    void soportaRA().then(setPuedeXr);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = antes;
      sesion.current?.terminar();
    };
  }, []);

  useEffect(() => {
    if (mensaje && voz.disponible && ajustes.audioEnunciados) voz.leer(mensaje, 'escena-ra');
    else if (instruccion && voz.disponible && ajustes.audioEnunciados) voz.leer(instruccion, 'escena-ra');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posicion = (e: EventoPuntero) => {
    const r = escena.current!.getBoundingClientRect();
    return { x: Math.min(97, Math.max(3, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(95, Math.max(12, ((e.clientY - r.top) / r.height) * 100)) };
  };

  const marcar = (k: number) => {
    sonar('toque', ajustes.sonido);
    setCosas((lista) => {
      const actual = lista[k].marca;
      if (actual !== null) {
        // Quitar la marca y renumerar las que siguen.
        return lista.map((c, j) => (j === k ? { ...c, marca: null } : c.marca !== null && c.marca > actual ? { ...c, marca: c.marca - 1 } : c));
      }
      const n = lista.filter((c) => c.marca !== null).length + 1;
      return lista.map((c, j) => (j === k ? { ...c, marca: n } : c));
    });
  };

  const tocarFondo = (e: EventoPuntero<HTMLDivElement>) => {
    if (config.modo !== 'real' || e.target !== e.currentTarget) return;
    sonar('toque', ajustes.sonido);
    const p = posicion(e);
    setCosas((lista) => [...lista, { ...p, marca: lista.length + 1 }]);
  };

  const quitarMarcaReal = (k: number) => {
    sonar('toque', ajustes.sonido);
    setCosas((lista) => lista.filter((_, j) => j !== k).map((c, j) => ({ ...c, marca: j + 1 })));
  };

  const empezarXr = async () => {
    if (!escena.current) return;
    cerrarCamara(flujo.current);
    flujo.current = null;
    setXr('buscando');
    try {
      sesion.current = await iniciarRA({
        capa: escena.current,
        cantidad: total,
        alEstado: setXr,
        posicionar: (i, x, y, t, visible) => {
          const el = i < 0 ? marcaPiso.current : dibujos.current[i];
          if (!el) return;
          el.style.display = visible ? '' : 'none';
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          el.style.width = `${t}px`;
          el.style.height = `${t}px`;
        },
        alTerminar: () => {
          sesion.current = null;
          setXr(null);
        },
      });
    } catch {
      sesion.current = null;
      setXr(null);
      setPuedeXr(false);
    }
  };

  const textoContador =
    config.modo === 'canasta'
      ? `En la canasta: ${num(enLaCanasta)}`
      : config.modo === 'real'
        ? tu(`Contaste: ${num(total)}`, `Contó: ${num(total)}`)
        : config.modo === 'contar'
          ? tu(`Llevas: ${num(contados)}`, `Lleva: ${num(contados)}`)
          : objeto
            ? cantidadObjeto(objeto, total)
            : num(total);

  const contenido = (
    <div className={`escena-ra ${camara !== 'lista' && !xr ? 'sin-camara' : ''} ${xr ? 'con-xr' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
      {!xr && <video ref={video} className="video-ra" playsInline muted autoPlay aria-hidden="true" />}
      <div ref={escena} className="capa-ra" onPointerUp={tocarFondo}>
        <header className="barra-ra">
          <button type="button" className="boton icono" onClick={() => (xr ? sesion.current?.terminar() : alCerrar())} aria-label={xr ? 'Salir del modo piso' : 'Cerrar la cámara'}>
            <Icono nombre="cerrar" tamano={24} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{titulo}</strong>
            {instruccion && <div className="pequeno">{instruccion}</div>}
          </div>
        </header>

        {camara === 'negada' && !xr && (
          <p className="aviso-ra pequeno">
            {tu('Sin permiso para la cámara: usamos un dibujo de la finca.', 'Sin permiso para la cámara: se usa un dibujo de la finca.')}{' '}
            <button type="button" className="enlace" onClick={() => setReintento((r) => r + 1)}>
              Intentar otra vez
            </button>
          </p>
        )}

        {config.modo === 'canasta' && !xr && (
          <div className="canasta-ra" style={{ left: `${CANASTA.x0}%`, top: `${CANASTA.y0}%`, width: `${CANASTA.x1 - CANASTA.x0}%`, height: `${CANASTA.y1 - CANASTA.y0}%` }} aria-hidden="true">
            <Icono nombre="canasta" tamano={34} anim="no" />
          </div>
        )}

        {xr && <div ref={marcaPiso} className="marca-piso" style={{ display: 'none' }} aria-hidden="true" />}

        {cosas.map((c, k) => (
          <button
            key={k}
            ref={(el) => {
              dibujos.current[k] = el;
            }}
            type="button"
            className={`objeto-ra ${c.marca !== null ? 'marcado' : ''} ${config.modo === 'real' ? 'marca-real' : ''}`}
            style={xr ? { display: xr === 'puestos' ? '' : 'none' } : { left: `${c.x}%`, top: `${c.y}%`, width: config.modo === 'real' ? 48 : tamano, height: config.modo === 'real' ? 48 : tamano, animationDelay: `${k * 60}ms` }}
            aria-label={config.modo === 'real' ? `Marca ${c.marca}. Tocar para quitarla` : `${objeto ? nombreObjeto(objeto) : 'Objeto'}${c.marca !== null ? `, contado: ${c.marca}` : ''}`}
            onPointerDown={(e) => {
              if (config.modo !== 'canasta' || xr) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              arrastre.current = { k, x: e.clientX, y: e.clientY, movio: false };
            }}
            onPointerMove={(e) => {
              const a = arrastre.current;
              if (!a || a.k !== k) return;
              if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6) a.movio = true;
              if (!a.movio) return;
              const p = posicion(e);
              setCosas((lista) => lista.map((x, j) => (j === k ? { ...x, ...p } : x)));
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              const a = arrastre.current;
              arrastre.current = null;
              if (config.modo === 'canasta') {
                if (a?.movio) sonar('toque', ajustes.sonido);
                return;
              }
              if (config.modo === 'real') quitarMarcaReal(k);
              else if (config.modo === 'contar' || config.modo === 'cantidad') marcar(k);
            }}
          >
            {objeto && <DibujoObjeto objeto={objeto} tamano={tamano} etiqueta="" />}
            {c.marca !== null && <span className="marca">{c.marca}</span>}
          </button>
        ))}

        <footer className="pie-ra">
          {mensaje && <p className="mensaje-ra">{mensaje}</p>}
          {config.modo === 'real' && total === 0 && (
            <p className="mensaje-ra pequeno">{tu('Apunta la cámara a huevos, frutas o piedras y toca cada uno para contarlo.', 'Apunte la cámara a las cosas y toque cada una para contarla.')}</p>
          )}
          {xr === 'buscando' && <p className="mensaje-ra pequeno">{tu('Mueve el celular despacio mirando el piso o la mesa…', 'Mueva el celular despacio mirando el piso o la mesa…')}</p>}
          <div className="fila" style={{ justifyContent: 'center' }}>
            <span className="contador-ra" aria-live="polite">
              {textoContador}
            </span>
            {config.modo === 'real' && total > 0 && (
              <button type="button" className="boton" onClick={() => setCosas([])}>
                <Icono nombre="repetir" tamano={22} anim="no" /> Borrar
              </button>
            )}
            {xr === 'listo' && (
              <button type="button" className="boton principal" onClick={() => sesion.current?.poner()}>
                <Icono nombre="check" tamano={22} /> Ponerlos aquí
              </button>
            )}
            {puedeXr && !xr && (config.modo === 'contar' || config.modo === 'cantidad') && (
              <button type="button" className="boton" onClick={() => void empezarXr()}>
                <Icono nombre="camara" tamano={22} /> Ponerlos en el piso
              </button>
            )}
          </div>
          {!xr && (
            <button type="button" className="boton principal" onClick={alCerrar}>
              Listo <Icono nombre="siguiente" tamano={22} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
}
