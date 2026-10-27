// Registro de las rutas de juego (y de la prueba de entrada de las familias).
import type { DefinicionPista, Pista } from '../juego/tipos';
import { g1 } from './plantillas/g1';
import { g2 } from './plantillas/g2';
import { g3 } from './plantillas/g3';
import { g4 } from './plantillas/g4';
import { g5 } from './plantillas/g5';
import { inclusion } from './plantillas/inclusion';
import { famAvanzada, famBasica, familia, famIntermedia } from './plantillas/familia';

export const definiciones: Record<Pista, DefinicionPista> = {
  g1,
  g2,
  g3,
  g4,
  g5,
  inclusion,
  familia,
  'fam-basica': famBasica,
  'fam-intermedia': famIntermedia,
  'fam-avanzada': famAvanzada,
};
