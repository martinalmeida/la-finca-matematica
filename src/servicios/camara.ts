// Cámara trasera para la realidad aumentada. La imagen solo se muestra en pantalla:
// no se graba, no se guarda y no se envía a ningún lado. Se apaga al salir de la escena.

export type EstadoCamara = 'pidiendo' | 'lista' | 'negada' | 'sin-camara';

export function hayCamara(): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  } catch {
    return false;
  }
}

/** Abre la cámara trasera; con efectos ligeros, a 480p para no cargar celulares lentos. */
export async function abrirCamara(ligera: boolean): Promise<MediaStream> {
  const alto = ligera ? 480 : 720;
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, height: { ideal: alto }, width: { ideal: Math.round((alto * 16) / 9) } },
  });
}

export function cerrarCamara(flujo: MediaStream | null): void {
  flujo?.getTracks().forEach((t) => t.stop());
}

/** El error de getUserMedia: ¿la persona negó el permiso o no hay cámara? */
export function estadoPorError(e: unknown): EstadoCamara {
  const nombre = (e as { name?: string })?.name ?? '';
  return nombre === 'NotAllowedError' || nombre === 'SecurityError' ? 'negada' : 'sin-camara';
}
