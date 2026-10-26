// Lectura en voz alta con speechSynthesis, solo si hay una voz local en español.
// Si no hay voces locales, el botón de audio se oculta sin errores.

import { useEffect, useState } from 'react';

function vozEspanolLocal(): SpeechSynthesisVoice | null {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es') && v.localService);
    return voces.find((v) => /co/i.test(v.lang)) ?? voces.find((v) => /419|mx|us/i.test(v.lang)) ?? voces[0] ?? null;
  } catch {
    return null;
  }
}

export function useVoz() {
  const [voz, setVoz] = useState<SpeechSynthesisVoice | null>(() => vozEspanolLocal());
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
        window.speechSynthesis.cancel();
      } catch {
        // nada
      }
    };
  }, []);

  const leer = (texto: string) => {
    if (!voz) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto.replace(/\$/g, '').replace(/−/g, ' menos ').replace(/×/g, ' por ').replace(/÷/g, ' entre '));
      u.voice = voz;
      u.lang = voz.lang;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch {
      // ignorar
    }
  };

  return { disponible: voz !== null, leer };
}
