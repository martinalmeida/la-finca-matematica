// Registro del service worker, actualizaciones, detección de la plataforma e instalación de la PWA.
// Actualizaciones: la app busca una versión nueva al abrirse, al volver a primer plano, al recuperar
// la señal y cada 15 minutos. Cuando la encuentra la activa sola y recarga con la caché limpia,
// salvo en medio de un nivel o una prueba: entonces espera a que el niño termine.
// Android/escritorio (Chrome, Edge, Samsung Internet): ventana nativa con beforeinstallprompt.
// iPhone/iPad: no existe esa ventana; se muestran los pasos de «Agregar a inicio».

import { registerSW } from 'virtual:pwa-register';
import { escribirTexto, leerTexto } from '../almacenamiento/almacen';

/** Versión de este build, p. ej. «1.0.0 (2026-10-27 16:40)». */
export const VERSION_APP = __VERSION_APP__;
const CLAVE_VERSION_APP = 'fincaMat:versionApp';
const REVISAR_CADA_MS = 15 * 60 * 1000;

type Oyente = () => void;
const oyentesListo = new Set<Oyente>();
const oyentesInstalar = new Set<Oyente>();
let listoSinInternet = false;
let recienInstalada = false;

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
declare global {
  interface Window {
    /** Evento capturado por el script en línea de index.html, antes de que cargue la app. */
    __eventoInstalar?: EventoInstalar | null;
    Capacitor?: unknown;
  }
}
let eventoInstalar: EventoInstalar | null = window.__eventoInstalar ?? null;

let registro: ServiceWorkerRegistration | undefined;
let activarNueva: ((recargar?: boolean) => Promise<void>) | null = null;
/** Hay una versión nueva instalada que espera para activarse. */
let nuevaEnEspera = false;
/** La app está en un nivel o una prueba: no se recarga hasta que termine. */
let ocupada = false;

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    activarNueva = registerSW({
      immediate: true,
      onNeedRefresh() {
        nuevaEnEspera = true;
        intentarActualizar();
      },
      // La versión nueva ya controla la página: se borra la caché vieja y se recarga.
      onNeedReload() {
        void limpiarCachesViejas().finally(() => window.location.reload());
      },
      onOfflineReady() {
        listoSinInternet = true;
        oyentesListo.forEach((f) => f());
      },
      onRegisteredSW(_url, r) {
        registro = r;
        programarRevisiones();
      },
    });
  } catch {
    // sin service worker (por ejemplo, en modo de desarrollo)
  }
}

function programarRevisiones() {
  window.setInterval(() => void buscarActualizacion(), REVISAR_CADA_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void buscarActualizacion();
  });
  window.addEventListener('online', () => void buscarActualizacion());
}

/** Pregunta al servidor si hay una versión nueva (el navegador pide sw.js sin usar su caché). */
async function buscarActualizacion(): Promise<void> {
  if (!registro || !navigator.onLine || registro.installing) return;
  try {
    await registro.update();
  } catch {
    // sin señal o servidor caído: se intenta en la próxima revisión
  }
}

function intentarActualizar() {
  if (!nuevaEnEspera || ocupada || !activarNueva) return;
  nuevaEnEspera = false;
  void activarNueva(true);
}

/** La app avisa si está en un nivel o una prueba; al salir se aplica la actualización pendiente. */
export function marcarOcupada(si: boolean) {
  ocupada = si;
  intentarActualizar();
}

/** Borra las cachés que no son la del service worker actual (restos de versiones viejas). */
async function limpiarCachesViejas(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter((n) => !n.startsWith('workbox-precache-v2-')).map((n) => caches.delete(n)));
  } catch {
    // sin acceso a la caché
  }
}

export type Revision = 'actualizando' | 'al-dia' | 'sin-conexion' | 'sin-service-worker';

/** Ajustes → «Buscar actualización». Si hay versión nueva, se aplica sola (Ajustes no es un nivel). */
export async function buscarActualizacionAhora(): Promise<Revision> {
  if (!registro) return 'sin-service-worker';
  if (!navigator.onLine) return 'sin-conexion';
  try {
    await registro.update();
  } catch {
    return 'sin-conexion';
  }
  // Si la descarga empezó, se espera a que termine de instalarse.
  const nueva = registro.installing;
  if (nueva) {
    await new Promise<void>((listo) => {
      const fin = () => (nueva.state === 'installed' || nueva.state === 'redundant' ? listo() : undefined);
      nueva.addEventListener('statechange', fin);
      window.setTimeout(listo, 30_000);
    });
  }
  if (registro.waiting || nuevaEnEspera) {
    nuevaEnEspera = true;
    intentarActualizar();
    return 'actualizando';
  }
  return 'al-dia';
}

/**
 * Ajustes → «Reparar la aplicación»: quita el service worker y borra toda la caché, y vuelve a
 * cargar desde internet. No toca los perfiles ni el avance (están en el almacenamiento local).
 */
export async function repararCache(): Promise<void> {
  try {
    const registros = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(registros.map((r) => r.unregister()));
  } catch {
    // sin service worker
  }
  try {
    if ('caches' in window) await Promise.all((await caches.keys()).map((n) => caches.delete(n)));
  } catch {
    // sin caché
  }
  window.location.reload();
}

/** true la primera vez que abre una versión distinta de la anterior (para avisar «Se actualizó»). */
export function seActualizo(): boolean {
  const anterior = leerTexto(CLAVE_VERSION_APP);
  if (anterior === VERSION_APP) return false;
  escribirTexto(CLAVE_VERSION_APP, VERSION_APP);
  return anterior !== null;
}

const avisarCambio = () => oyentesInstalar.forEach((f) => f());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalar = e as EventoInstalar;
  avisarCambio();
});

window.addEventListener('appinstalled', () => {
  eventoInstalar = null;
  window.__eventoInstalar = null;
  recienInstalada = true;
  avisarCambio();
});

try {
  window.matchMedia('(display-mode: standalone)').addEventListener('change', avisarCambio);
} catch {
  // navegadores antiguos
}

export function alListoSinInternet(f: Oyente): () => void {
  oyentesListo.add(f);
  if (listoSinInternet) f();
  return () => oyentesListo.delete(f);
}

export function alCambiarInstalable(f: Oyente): () => void {
  oyentesInstalar.add(f);
  return () => oyentesInstalar.delete(f);
}

/** Hay ventana nativa de instalación lista (Android, escritorio). */
export function puedeInstalar(): boolean {
  return eventoInstalar !== null;
}

/** Se acaba de instalar desde el navegador (la pestaña sigue abierta). */
export function seInstaloRecien(): boolean {
  return recienInstalada;
}

export function estaInstalada(): boolean {
  try {
    return (
      ['standalone', 'fullscreen', 'minimal-ui'].some((m) => window.matchMedia(`(display-mode: ${m})`).matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  } catch {
    return false;
  }
}

/** Dentro de la app nativa de Capacitor no tiene sentido ofrecer la instalación. */
export function esAppNativa(): boolean {
  return window.Capacitor !== undefined;
}

/** Abre la ventana nativa. Devuelve 'sin-ventana' si el navegador no la ofrece. */
export async function instalar(): Promise<'aceptada' | 'rechazada' | 'sin-ventana'> {
  if (!eventoInstalar) return 'sin-ventana';
  const evento = eventoInstalar;
  // El evento solo sirve una vez.
  eventoInstalar = null;
  window.__eventoInstalar = null;
  try {
    await evento.prompt();
    const r = await evento.userChoice;
    return r.outcome === 'accepted' ? 'aceptada' : 'rechazada';
  } catch {
    return 'sin-ventana';
  } finally {
    avisarCambio();
  }
}

export type Plataforma =
  | 'android-chrome' // Chrome, Edge, Brave… (ventana nativa)
  | 'android-samsung'
  | 'android-firefox'
  | 'android-app' // navegador dentro de WhatsApp, Facebook, Instagram…
  | 'ios-safari'
  | 'ios-otro' // Chrome, Firefox o Edge en iPhone
  | 'ios-app'
  | 'escritorio';

export function detectarPlataforma(ua = navigator.userAgent): Plataforma {
  // iPadOS 13+ se presenta como un Mac de escritorio.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const enApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|musical_ly|Snapchat|WhatsApp|GSA\//.test(ua);
  if (ios) {
    if (enApp) return 'ios-app';
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-otro';
    return 'ios-safari';
  }
  if (/Android/.test(ua)) {
    if (enApp || /; wv\)/.test(ua)) return 'android-app';
    if (/SamsungBrowser/.test(ua)) return 'android-samsung';
    if (/Firefox/.test(ua)) return 'android-firefox';
    return 'android-chrome';
  }
  return 'escritorio';
}

/** Versión de iOS (p. ej., 16.4) o null. Antes de 16.4 solo Safari puede agregar a inicio. */
export function versionIos(ua = navigator.userAgent): number | null {
  const m = ua.match(/OS (\d+)_(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 10 : null;
}

/** Enlace que abre esta misma página en Chrome desde el navegador interno de otra app (Android). */
export function enlaceAbrirEnChrome(): string {
  const { host, pathname, search } = location;
  return `intent://${host}${pathname}${search}#Intent;scheme=${location.protocol.replace(':', '')};package=com.android.chrome;end`;
}

/** Enlace que abre esta misma página en Safari (iOS 17 o superior). */
export function enlaceAbrirEnSafari(): string {
  return `x-safari-${location.href}`;
}
