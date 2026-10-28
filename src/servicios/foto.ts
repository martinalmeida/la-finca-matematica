// Foto de perfil. Se recorta y se achica en el celular (320×320, JPEG), se guarda aquí para
// verla sin internet y sube a Storage (bucket privado «fotos», {id}/foto.jpg) al sincronizar.

import { useSyncExternalStore } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { borrar, escribir, leer, PREFIJO_V1 } from '../almacenamiento/almacen';
import type { Cuenta } from '../almacenamiento/datos';

const LADO = 320;
const CALIDAD = 0.82;
const BUCKET = 'fotos';

type FotoLocal = { version: string; datos: string };

const clave = (id: string) => `${PREFIJO_V1}foto:${id}`;
export const rutaFoto = (id: string) => `${id}/foto.jpg`;

const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

export function leerFotoLocal(id: string): FotoLocal | null {
  const f = leer<FotoLocal | null>(clave(id), null);
  return f && typeof f.datos === 'string' && f.datos.startsWith('data:image/') ? f : null;
}

export function guardarFotoLocal(id: string, foto: FotoLocal | null): void {
  if (foto) escribir(clave(id), foto);
  else borrar(clave(id));
  avisar();
}

/** La foto guardada en este celular (data URL), o null. Se actualiza sola al cambiarla. */
export function useFoto(id: string | undefined): string | null {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => (id ? (leerFotoLocal(id)?.datos ?? null) : null),
  );
}

export function nuevaVersion(): string {
  return Date.now().toString(36);
}

function aDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });
}

/** Recorta al centro en cuadrado y achica a 320×320. Respeta la orientación de la cámara. */
export async function prepararFoto(archivo: Blob): Promise<string> {
  if (!archivo.type.startsWith('image/')) throw new Error('Ese archivo no es una foto.');
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Esa foto no se pudo abrir. Prueba con otra.');
  }
  const lado = Math.min(imagen.width, imagen.height);
  const lienzo = document.createElement('canvas');
  lienzo.width = LADO;
  lienzo.height = LADO;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('Esa foto no se pudo abrir. Prueba con otra.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  imagen.close();
  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/jpeg', CALIDAD));
  if (!blob) throw new Error('Esa foto no se pudo abrir. Prueba con otra.');
  return aDataUrl(blob);
}

/** Sube (o borra) en la nube la foto que cambió en este celular. Devuelve el error, si hubo. */
export async function subirPendiente(sb: SupabaseClient, cuenta: Cuenta): Promise<unknown> {
  if (cuenta.fotoPendiente === 'quitar') {
    const { error } = await sb.storage.from(BUCKET).remove([rutaFoto(cuenta.id)]);
    if (error) return error;
    return (await sb.rpc('fijar_foto', { p_version: null })).error;
  }
  const local = leerFotoLocal(cuenta.id);
  if (!local) return null;
  const blob = await (await fetch(local.datos)).blob();
  const { error } = await sb.storage.from(BUCKET).upload(rutaFoto(cuenta.id), blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' });
  if (error) return error;
  return (await sb.rpc('fijar_foto', { p_version: local.version })).error;
}

/** Deja en este celular la foto que dice la nube (la baja si es otra versión; la borra si no hay). */
export async function traerDeLaNube(sb: SupabaseClient, id: string, version: string | null | undefined): Promise<void> {
  const local = leerFotoLocal(id);
  if (!version) {
    if (local) guardarFotoLocal(id, null);
    return;
  }
  if (local?.version === version) return;
  const { data, error } = await sb.storage.from(BUCKET).download(rutaFoto(id));
  if (error || !data) return;
  guardarFotoLocal(id, { version, datos: await aDataUrl(data) });
}

/** URLs temporales de las fotos de varios usuarios (panel del profesor). */
export async function urlsDeFotos(sb: SupabaseClient, ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(ids.map(rutaFoto), 60 * 60);
  if (error || !data) return {};
  const urls: Record<string, string> = {};
  data.forEach((d, k) => {
    if (d.signedUrl) urls[ids[k]] = d.signedUrl;
  });
  return urls;
}

/** Borra el archivo de la foto de un alumno (panel del profesor). */
export async function borrarFotoDe(sb: SupabaseClient, id: string): Promise<unknown> {
  return (await sb.storage.from(BUCKET).remove([rutaFoto(id)])).error;
}
