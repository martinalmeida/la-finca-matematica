// Genera los íconos PNG de la PWA (192 y 512, normales y maskable) sin dependencias:
// dibuja una mazorca de cacao sobre fondo verde cacao y crema, y codifica el PNG con zlib.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'iconos');
mkdirSync(raiz, { recursive: true });

const VERDE = [74, 107, 47];
const CREMA = [251, 245, 230];
const CACAO = [217, 130, 43];
const BORDE = [122, 66, 17];
const SURCO = [166, 90, 23];
const TALLO = [91, 58, 28];

const crcTabla = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTabla[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}

function dibujar(tam, maskable) {
  const px = Buffer.alloc(tam * tam * 4);
  const s = tam / 64; // coordenadas en una cuadrícula de 64
  const escala = maskable ? 0.78 : 1; // zona segura del ícono maskable
  const muestras = 3;
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < muestras; sy++) {
        for (let sx = 0; sx < muestras; sx++) {
          const u0 = (x + (sx + 0.5) / muestras) / s;
          const v0 = (y + (sy + 0.5) / muestras) / s;
          const u = 32 + (u0 - 32) / escala;
          const v = 32 + (v0 - 32) / escala;
          let c = null;
          const dc = Math.hypot(u0 - 32, v0 - 32);
          if (maskable) c = VERDE;
          else if (dc <= 30) c = VERDE;
          if (Math.hypot(u - 32, v - 32) <= 25) c = CREMA;
          const e = ((u - 32) / 13) ** 2 + ((v - 33) / 19) ** 2;
          if (e <= 1.12 && e > 1) c = BORDE;
          if (e <= 1) {
            c = CACAO;
            const surco = [Math.abs(u - 32), Math.abs(u - (32 - 7 * Math.sqrt(Math.max(0, 1 - ((v - 33) / 19) ** 2)))), Math.abs(u - (32 + 7 * Math.sqrt(Math.max(0, 1 - ((v - 33) / 19) ** 2))))];
            if (Math.min(...surco) < 0.9) c = SURCO;
          }
          if (Math.abs(u - 32) < 1.6 && v > 8 && v < 14.5) c = TALLO;
          if (c) {
            acc[0] += c[0];
            acc[1] += c[1];
            acc[2] += c[2];
            acc[3] += 255;
          }
        }
      }
      const n = muestras * muestras;
      const i = (y * tam + x) * 4;
      const a = acc[3] / n;
      px[i] = a ? Math.round(acc[0] / (acc[3] / 255)) : 0;
      px[i + 1] = a ? Math.round(acc[1] / (acc[3] / 255)) : 0;
      px[i + 2] = a ? Math.round(acc[2] / (acc[3] / 255)) : 0;
      px[i + 3] = Math.round(a);
    }
  }
  const filas = Buffer.alloc(tam * (tam * 4 + 1));
  for (let y = 0; y < tam; y++) {
    filas[y * (tam * 4 + 1)] = 0;
    px.copy(filas, y * (tam * 4 + 1) + 1, y * tam * 4, (y + 1) * tam * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', deflateSync(filas, { level: 9 })), trozo('IEND', Buffer.alloc(0))]);
}

for (const tam of [192, 512]) {
  writeFileSync(join(raiz, `icono-${tam}.png`), dibujar(tam, false));
  writeFileSync(join(raiz, `icono-maskable-${tam}.png`), dibujar(tam, true));
}
console.log('Íconos generados en public/iconos');
