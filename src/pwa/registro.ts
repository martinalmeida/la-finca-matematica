// Registro del service worker y botón de instalación (beforeinstallprompt).

import { registerSW } from 'virtual:pwa-register';

type Oyente = () => void;
const oyentesListo = new Set<Oyente>();
const oyentesInstalar = new Set<Oyente>();
let listoSinInternet = false;

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let eventoInstalar: EventoInstalar | null = null;

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

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalar = e as EventoInstalar;
  oyentesInstalar.forEach((f) => f());
});

window.addEventListener('appinstalled', () => {
  eventoInstalar = null;
  oyentesInstalar.forEach((f) => f());
});

export function alListoSinInternet(f: Oyente): () => void {
  oyentesListo.add(f);
  if (listoSinInternet) f();
  return () => oyentesListo.delete(f);
}

export function alCambiarInstalable(f: Oyente): () => void {
  oyentesInstalar.add(f);
  return () => oyentesInstalar.delete(f);
}

export function puedeInstalar(): boolean {
  return eventoInstalar !== null;
}

export function estaInstalada(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export async function instalar(): Promise<boolean> {
  if (!eventoInstalar) return false;
  await eventoInstalar.prompt();
  const r = await eventoInstalar.userChoice;
  eventoInstalar = null;
  oyentesInstalar.forEach((f) => f());
  return r.outcome === 'accepted';
}
