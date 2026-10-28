// Botón «atrás» de Android (y del navegador) dentro de la app.
// - Mientras la pila de pantallas tiene más de una, hay UNA entrada de historial de guarda.
// - Cada capa abierta (lección, video, pausa, realidad aumentada…) agrega su propia entrada:
//   «atrás» cierra la capa en vez de salir de la app.
// Cerrar una capa con su botón consume su entrada con history.back(); ese popstate se ignora.
// Un pushState no se hace mientras hay un back pendiente (si no, el back se llevaría la entrada nueva).

import { useEffect, useRef } from 'react';

const capas: (() => void)[] = [];
let ignorar = 0;
let empujarDespues = 0;
let guarda = false;

function empujar(estado: object) {
  if (ignorar > 0) {
    empujarDespues++;
    return;
  }
  try {
    history.pushState(estado, '');
  } catch {
    // sin historial
  }
}

function retroceder() {
  ignorar++;
  try {
    history.back();
  } catch {
    ignorar--;
  }
}

/** Atiende un popstate: true si era un back propio o cerró una capa; false si toca volver una pantalla. */
function atender(): boolean {
  if (ignorar > 0) {
    ignorar--;
    if (ignorar === 0) {
      for (; empujarDespues > 0; empujarDespues--) empujar({ finca: true });
    }
    return true;
  }
  const cerrar = capas.pop();
  if (cerrar) {
    cerrar();
    return true;
  }
  guarda = false;
  return false;
}

// Oyente propio, registrado al cargar el módulo: corre antes que el de la app. Así las capas
// (también la hoja de instalar en la entrada o en el panel del profesor) se cierran con «atrás».
let atendido = false;
if (typeof window !== 'undefined') window.addEventListener('popstate', () => (atendido = atender()));

/** Para el oyente de popstate de la app: true si el evento ya se atendió aquí. */
export function alAtras(): boolean {
  return atendido;
}

/** Mantiene la entrada de guarda: presente si hay pantallas a las que volver, ausente si no. */
export function ajustarGuarda(hayAtras: boolean): void {
  if (hayAtras && !guarda) {
    guarda = true;
    empujar({ finca: true });
  } else if (!hayAtras && guarda && capas.length === 0) {
    guarda = false;
    retroceder();
  }
}

/** Mientras `abierta`, «atrás» llama a `cerrar` en vez de cambiar de pantalla. */
export function useCapaConAtras(abierta: boolean, cerrar: () => void): void {
  const ref = useRef(cerrar);
  ref.current = cerrar;
  useEffect(() => {
    if (!abierta) return;
    let porAtras = false;
    const alCerrar = () => {
      porAtras = true;
      ref.current();
    };
    capas.push(alCerrar);
    empujar({ capa: true });
    return () => {
      if (porAtras) return;
      const i = capas.indexOf(alCerrar);
      if (i >= 0) {
        capas.splice(i, 1);
        retroceder();
      }
    };
  }, [abierta]);
}
