// Registro del service worker, detección de la plataforma e instalación de la PWA.
// Android/escritorio (Chrome, Edge, Samsung Internet): ventana nativa con beforeinstallprompt.
// iPhone/iPad: no existe esa ventana; se muestran los pasos de «Agregar a inicio».

import { registerSW } from 'virtual:pwa-register';

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

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    registerSW({
      immediate: true,
      onOfflineReady() {
        listoSinInternet = true;
        oyentesListo.forEach((f) => f());
      },
    });
  } catch {
    // sin service worker (por ejemplo, en modo de desarrollo)
  }
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
