// Realidad aumentada «de verdad» con WebXR (Android con ARCore): se detecta el piso o la mesa
// y los objetos quedan quietos en ese lugar aunque se mueva el celular. No usa librerías 3D:
// cada cuadro se proyecta la posición de cada objeto a la pantalla y se mueven los dibujos
// (que son HTML encima de la cámara, con dom-overlay). Si el celular no lo soporta, no se ofrece.

/* eslint-disable @typescript-eslint/no-explicit-any */

type Vec3 = [number, number, number];

/** Tamaño real de cada objeto, en metros (como un huevo o una naranja grandes). */
const TAMANO_OBJETO = 0.09;
const SEPARACION = 0.13;

function xr(): any {
  return (navigator as any).xr;
}

export async function soportaRA(): Promise<boolean> {
  try {
    return !!xr() && (await xr().isSessionSupported('immersive-ar'));
  } catch {
    return false;
  }
}

/** m (columna mayor, 4 × 4) por el vector (x, y, z, 1). */
function aplicar(m: Float32Array, v: Vec3): [number, number, number, number] {
  const r: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) r[i] = m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + m[12 + i];
  return r;
}

/** Posiciones en una cuadrícula sobre el plano, alrededor del centro. */
export function cuadricula(centro: Vec3, n: number): Vec3[] {
  const columnas = Math.ceil(Math.sqrt(n));
  const filas = Math.ceil(n / columnas);
  return Array.from({ length: n }, (_, k) => {
    const f = Math.floor(k / columnas);
    const c = k % columnas;
    return [centro[0] + (c - (columnas - 1) / 2) * SEPARACION, centro[1], centro[2] + (f - (filas - 1) / 2) * SEPARACION];
  });
}

export type EstadoRA = 'buscando' | 'listo' | 'puestos';

export type OpcionesRA = {
  /** Elemento HTML que queda encima de la cámara (tiene los dibujos). */
  capa: HTMLElement;
  cantidad: number;
  alEstado: (e: EstadoRA) => void;
  /** Mueve el dibujo i (−1 es la marca del piso) a la posición de pantalla, con su tamaño en píxeles. */
  posicionar: (i: number, x: number, y: number, tamano: number, visible: boolean) => void;
  alTerminar: () => void;
};

export type SesionRA = { poner: () => void; terminar: () => void };

export async function iniciarRA(op: OpcionesRA): Promise<SesionRA> {
  const sesion = await xr().requestSession('immersive-ar', {
    requiredFeatures: ['hit-test', 'dom-overlay'],
    domOverlay: { root: op.capa },
  });
  try {
    const lienzo = document.createElement('canvas');
    const gl = lienzo.getContext('webgl', { xrCompatible: true, alpha: true }) as WebGLRenderingContext;
    const XRWebGLLayer = (window as any).XRWebGLLayer;
    await sesion.updateRenderState({ baseLayer: new XRWebGLLayer(sesion, gl) });
    const local = await sesion.requestReferenceSpace('local');
    const visor = await sesion.requestReferenceSpace('viewer');
    const fuente = await sesion.requestHitTestSource({ space: visor });

    let piso: Vec3 | null = null;
    let puestos: Vec3[] | null = null;
    let estado: EstadoRA = 'buscando';
    const cambiar = (e: EstadoRA) => {
      if (e !== estado) op.alEstado((estado = e));
    };
    op.alEstado(estado);

    // Tocar la pantalla para elegir no debe abrir el menú de selección de WebXR.
    const evitar = (e: Event) => e.preventDefault();
    op.capa.addEventListener('beforexrselect', evitar);

    const cuadro = (_t: number, frame: any) => {
      sesion.requestAnimationFrame(cuadro);
      const capaGl = sesion.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, capaGl.framebuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const pose = frame.getViewerPose(local);
      if (!pose) return;
      const vista = pose.views[0];
      const P: Float32Array = vista.projectionMatrix;
      const Vinv: Float32Array = vista.transform.inverse.matrix;
      const W = op.capa.clientWidth;
      const H = op.capa.clientHeight;
      const proyectar = (i: number, p: Vec3, tamano: number) => {
        const enVista = aplicar(Vinv, p);
        const clip = aplicar(P, [enVista[0], enVista[1], enVista[2]]);
        const w = clip[3];
        if (w <= 0.01) return op.posicionar(i, 0, 0, 0, false);
        const x = ((clip[0] / w) * 0.5 + 0.5) * W;
        const y = (1 - ((clip[1] / w) * 0.5 + 0.5)) * H;
        op.posicionar(i, x, y, (tamano * P[5] * H) / 2 / w, true);
      };

      if (!puestos) {
        const resultados = frame.getHitTestResults(fuente);
        if (resultados.length) {
          const m = resultados[0].getPose(local).transform.position;
          piso = [m.x, m.y, m.z];
          cambiar('listo');
          proyectar(-1, piso, 0.16);
        } else {
          op.posicionar(-1, 0, 0, 0, false);
        }
        return;
      }
      op.posicionar(-1, 0, 0, 0, false);
      // El dibujo se apoya en el piso: su centro va un poco arriba del plano.
      puestos.forEach((p, i) => proyectar(i, [p[0], p[1] + TAMANO_OBJETO / 2, p[2]], TAMANO_OBJETO));
    };
    sesion.requestAnimationFrame(cuadro);

    sesion.addEventListener('end', () => {
      op.capa.removeEventListener('beforexrselect', evitar);
      try {
        fuente.cancel();
      } catch {
        // nada
      }
      op.alTerminar();
    });

    return {
      poner: () => {
        if (!piso) return;
        puestos = cuadricula(piso, op.cantidad);
        cambiar('puestos');
      },
      terminar: () => {
        try {
          void sesion.end();
        } catch {
          // ya terminó
        }
      },
    };
  } catch (e) {
    try {
      await sesion.end();
    } catch {
      // nada
    }
    throw e;
  }
}
