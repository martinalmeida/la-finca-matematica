// Registro de las seis pistas de juego.
import type { DefinicionPista, Pista } from '../juego/tipos';
import { g1 } from './plantillas/g1';
import { g2 } from './plantillas/g2';
import { g3 } from './plantillas/g3';
import { g4 } from './plantillas/g4';
import { g5 } from './plantillas/g5';
import { familia } from './plantillas/familia';

export const definiciones: Record<Pista, DefinicionPista> = { g1, g2, g3, g4, g5, familia };
