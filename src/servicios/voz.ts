// Lectura en voz alta con speechSynthesis, solo si hay una voz local en español (sin internet).
// Si no hay voces locales, los botones de audio se ocultan sin errores.
// Un solo estado global: se sabe qué texto (clave) se está leyendo para animar su botón.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApp } from '../estado';

function vozEspanolLocal(): SpeechSynthesisVoice | null {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es') && v.localService);
    return voces.find((v) => /co/i.test(v.lang)) ?? voces.find((v) => /419|mx|us/i.test(v.lang)) ?? voces[0] ?? null;
  } catch {
    return null;
  }
}

// --- Estado global de lo que se está leyendo ---
let leyendo: string | null = null;
const oyentes = new Set<() => void>();
function fijarLeyendo(clave: string | null) {
  leyendo = clave;
  oyentes.forEach((f) => f());
}
function suscribir(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

/** Convierte signos a palabras para que la voz los lea bien. */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/\$/g, '')
    .replace(/−/g, ' menos ')
    .replace(/×/g, ' por ')
    .replace(/÷/g, ' entre ')
    .replace(/(\d)\s*%/g, '$1 por ciento')
    .replace(/[«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detenerVoz() {
  try {
    window.speechSynthesis.cancel();
  } catch {
    // nada
  }
  fijarLeyendo(null);
}

export function useVoz() {
  const [voz, setVoz] = useState<SpeechSynthesisVoice | null>(() => vozEspanolLocal());
  const actual = useSyncExternalStore(suscribir, () => leyendo);
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const actualizar = () => setVoz(vozEspanolLocal());
    try {
      window.speechSynthesis.addEventListener('voiceschanged', actualizar);
    } catch {
      return;
    }
    actualizar();
    return () => {
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', actualizar);
      } catch {
        // nada
      }
    };
  }, []);

  const leer = (texto: string, clave = texto) => {
    if (!voz) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(textoParaVoz(texto));
      u.voice = voz;
      u.lang = voz.lang;
      u.rate = 0.88;
      u.onstart = () => fijarLeyendo(clave);
      u.onend = () => leyendo === clave && fijarLeyendo(null);
      u.onerror = () => leyendo === clave && fijarLeyendo(null);
      fijarLeyendo(clave);
      window.speechSynthesis.speak(u);
    } catch {
      fijarLeyendo(null);
    }
  };

  return { disponible: voz !== null, leer, detener: detenerVoz, leyendo: actual };
}

/**
 * Lee el texto en voz alta automáticamente cada vez que cambia la clave
 * (p. ej., un ejercicio nuevo), si la lectura en voz alta está activada.
 * Al salir de la pantalla, la voz se detiene.
 */
export function useLecturaAutomatica(clave: string, texto: string, activo = true) {
  const { ajustes } = useApp();
  const voz = useVoz();
  const leida = useRef<string | null>(null);
  const puede = voz.disponible && ajustes.audioEnunciados && activo;
  useEffect(() => {
    if (!puede || leida.current === clave) return;
    // Una pausa corta deja terminar la animación de entrada antes de hablar.
    const t = window.setTimeout(() => {
      leida.current = clave;
      voz.leer(texto, clave);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, puede]);
  useEffect(() => () => detenerVoz(), []);
}
