import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Icono, { NOMBRES_ICONOS } from '../src/componentes/Icono';
import { TONOS } from '../src/componentes/paleta';

describe('paquete de iconos', () => {
  it('ningún tono usa las claves reservadas para brillo, sombra y reflejo', () => {
    for (const k of ['b', 's', 'e']) expect(Object.keys(TONOS)).not.toContain(k);
  });

  it.each(NOMBRES_ICONOS)('%s se dibuja y sus degradados existen', (nombre) => {
    const html = renderToStaticMarkup(createElement(Icono, { nombre, tamano: 48 }));
    expect(html).toMatch(/<svg/);
    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids, `${nombre} usa #${ref}`).toContain(ref);
  });
});
