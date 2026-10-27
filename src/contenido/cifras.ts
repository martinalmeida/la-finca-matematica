// Trazos de las cifras 0–9, como se enseñan en 1.º. Cada cifra tiene una forma principal
// (la que se anima y se repasa en el Taller) y variantes que también se aceptan al escribir.
// Coordenadas en una caja de 60 × 100 (x hacia la derecha, y hacia abajo).

export type Punto = { x: number; y: number };
export type Trazo = Punto[];
export type FormaCifra = Trazo[];

export const ANCHO_CIFRA = 60;
export const ALTO_CIFRA = 100;

const p = (x: number, y: number): Punto => ({ x, y });

/** Arco de elipse: ángulos en grados (0 = derecha, 90 = abajo); de a0 a a1 en el sentido que indiquen. */
function arco(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, pasos = 18): Trazo {
  const puntos: Trazo = [];
  for (let k = 0; k <= pasos; k++) {
    const a = ((a0 + ((a1 - a0) * k) / pasos) * Math.PI) / 180;
    puntos.push(p(cx + rx * Math.cos(a), cy + ry * Math.sin(a)));
  }
  return puntos;
}

/** Une tramos en un solo trazo (sin repetir el punto de unión). */
function unir(...tramos: Trazo[]): Trazo {
  return tramos.reduce<Trazo>((t, s) => [...t, ...(t.length ? s.slice(1) : s)], []);
}

export const FORMAS: Record<number, FormaCifra[]> = {
  0: [
    // Desde arriba, vuelta hacia la izquierda.
    [arco(30, 50, 27, 48, -90, -450, 32)],
    [arco(30, 50, 27, 48, -90, 270, 32)],
  ],
  1: [
    [unir([p(14, 20), p(30, 0)], [p(30, 0), p(30, 100)])],
    [[p(30, 0), p(30, 100)]],
    [unir([p(14, 20), p(30, 0)], [p(30, 0), p(30, 100)]), [p(12, 100), p(48, 100)]],
  ],
  2: [
    [unir(arco(30, 27, 25, 24, 190, 400), [p(49, 43), p(4, 100)], [p(4, 100), p(58, 100)])],
    // Variante con la curva más larga, como un patico.
    [unir(arco(30, 30, 26, 27, 170, 420), [p(46, 52), p(6, 100)], [p(6, 100), p(58, 98)])],
  ],
  3: [
    [unir(arco(28, 25, 24, 23, 200, 450), arco(28, 73, 27, 25, -90, 160))],
    // Variante con la parte de arriba recta (como un 3 «de imprenta»).
    [unir([p(6, 0), p(54, 0), p(28, 42)], arco(28, 70, 27, 28, -90, 160))],
  ],
  4: [
    [[p(40, 0), p(4, 66), p(58, 66)], [p(44, 34), p(44, 100)]],
    [[p(8, 0), p(8, 56), p(56, 56)], [p(44, 0), p(44, 100)]],
    // Abierto, con el palito largo desde arriba.
    [[p(40, 0), p(4, 66), p(58, 66)], [p(44, 0), p(44, 100)]],
  ],
  5: [
    [unir([p(12, 0), p(10, 44)], arco(30, 69, 25, 27, -125, 145)), [p(12, 0), p(54, 0)]],
    [unir([p(54, 0), p(12, 0), p(10, 44)], arco(30, 69, 25, 27, -125, 145))],
  ],
  6: [
    [unir([p(48, 4), p(34, 9), p(20, 23), p(11, 44), p(8, 70)], arco(30, 72, 22, 26, 180, -180))],
    [unir([p(50, 0), p(26, 20), p(10, 48)], arco(30, 74, 22, 25, 200, -150))],
  ],
  7: [
    [[p(4, 0), p(56, 0), p(22, 100)]],
    [[p(4, 0), p(56, 0), p(22, 100)], [p(16, 52), p(48, 52)]],
    [[p(4, 12), p(4, 0), p(56, 0), p(26, 100)]],
  ],
  8: [
    [unir(arco(30, 24, 21, 23, -20, -270), arco(30, 73, 25, 26, -90, 270), [p(30, 47), p(47, 13)])],
    [arco(30, 24, 21, 23, 0, 360, 24), arco(30, 73, 25, 26, 0, 360, 24)],
  ],
  9: [
    [unir(arco(30, 27, 23, 25, 0, -360, 24), [p(53, 27), p(51, 100)])],
    [unir(arco(30, 27, 23, 25, 0, -360, 24), [p(53, 27), p(50, 80)], arco(36, 82, 14, 18, 0, 140, 8))],
  ],
};

/** Cómo se escribe cada cifra (se lee en voz alta en el Taller). */
export const COMO_SE_ESCRIBE: Record<number, string> = {
  0: 'El cero: una vuelta redonda, como un huevo.',
  1: 'El uno: un palito derecho, de arriba hacia abajo.',
  2: 'El dos: una curva arriba, bajamos en diagonal y terminamos con una raya acostada. Parece un patico.',
  3: 'El tres: una barriguita arriba y otra barriguita abajo.',
  4: 'El cuatro: bajamos, hacemos una raya acostada y luego un palito de arriba hacia abajo.',
  5: 'El cinco: un palito hacia abajo, una barriga y, al final, el sombrero arriba.',
  6: 'El seis: bajamos en curva y hacemos una vuelta abajo.',
  7: 'El siete: una raya arriba y bajamos en diagonal.',
  8: 'El ocho: una ese y volvemos a subir, como dos rosquitas una encima de la otra.',
  9: 'El nueve: una bolita arriba y un palito hacia abajo, como un globo.',
};

export const NOMBRES_CIFRA = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
