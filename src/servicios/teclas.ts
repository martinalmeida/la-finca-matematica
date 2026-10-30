// Teclado físico (computador): un solo oyente de «keydown» con una pila de oyentes. Se preguntan
// del más reciente al más viejo hasta que uno use la tecla; una capa «modal» (pausa, video,
// ventanas) corta ahí, así no le llegan teclas al ejercicio que quedó debajo.
// Se ignoran las teclas con Ctrl, Alt o Cmd y las que van a un campo de texto.

import { useEffect, useRef, useState } from 'react';

/** Devuelve true si usó la tecla (entonces se evita la acción del navegador). */
export type ManejadorTeclas = (e: KeyboardEvent) => boolean | void;

type Capa = { manejar: () => ManejadorTeclas; modal: boolean; orden: number };

const pila: Capa[] = [];
let escuchando = false;
/** Orden de primer render: el padre se dibuja antes que sus hijos (los efectos van al revés),
 *  así lo de una ventana queda encima de la ventana y la ventana encima de lo de abajo. */
let contador = 0;

function enCampoDeTexto(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return true;
  return t instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(t.type);
}

function alTeclear(e: KeyboardEvent) {
  if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
  if (enCampoDeTexto(e.target)) return;
  for (let i = pila.length - 1; i >= 0; i--) {
    if (pila[i].manejar()(e) === true) {
      e.preventDefault();
      return;
    }
    if (pila[i].modal) return;
  }
}

/** Escucha el teclado mientras `activo` sea true. Con `modal`, lo montado antes deja de oír. */
export function useTeclas(manejador: ManejadorTeclas, activo = true, modal = false): void {
  const ref = useRef(manejador);
  ref.current = manejador;
  const [orden] = useState(() => ++contador);
  useEffect(() => {
    if (!activo) return;
    const capa: Capa = { manejar: () => ref.current, modal, orden };
    const i = pila.findIndex((c) => c.orden > orden);
    pila.splice(i < 0 ? pila.length : i, 0, capa);
    if (!escuchando) {
      window.addEventListener('keydown', alTeclear);
      escuchando = true;
    }
    return () => {
      const i = pila.indexOf(capa);
      if (i >= 0) pila.splice(i, 1);
    };
  }, [activo, modal, orden]);
}

/** Capa modal vacía: tapa lo de abajo (p. ej., una ventana que solo se maneja con Tab y Enter). */
export function useTapaTeclas(activo = true): void {
  useTeclas(() => undefined, activo, true);
}

/** ¿Hay mouse o panel táctil de computador? (Para mostrar ayudas de teclado solo ahí.) */
export function esComputador(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
}

/** El foco está en un botón u otro control: Enter y espacio son de él. */
export function focoEnControl(): boolean {
  const a = document.activeElement;
  return a instanceof HTMLButtonElement || a instanceof HTMLAnchorElement || (a instanceof HTMLElement && a.getAttribute('role') === 'button');
}

/** Letra A, B, C… para la opción k (atajos de las opciones). */
export const letraOpcion = (k: number) => String.fromCharCode(65 + k);

/** Índice de la opción si la tecla es una letra A…, o −1. */
export function opcionDeTecla(e: KeyboardEvent, total: number): number {
  if (e.key.length !== 1) return -1;
  const k = e.key.toUpperCase().charCodeAt(0) - 65;
  return k >= 0 && k < total ? k : -1;
}

/** Respaldo de toda la app: Enter, sin otro control con foco, pulsa el botón principal de la
 *  pantalla si hay uno solo a la vista (resultados, bienvenida de la prueba, etc.). */
export function useEnterPrincipal(): void {
  useTeclas((e) => {
    if (e.key !== 'Enter' || focoEnControl()) return false;
    const visibles = [...document.querySelectorAll<HTMLButtonElement>('main .boton.principal:not(:disabled)')].filter((b) => b.offsetParent !== null);
    if (visibles.length !== 1) return false;
    visibles[0].click();
    return true;
  });
}
