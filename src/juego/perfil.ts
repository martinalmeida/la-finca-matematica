// Identificadores aleatorios (eventos y partidas que se suben a la nube).

function azar(n: number): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  } catch {
    return Math.floor(Math.random() * n);
  }
}

export function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // contexto no seguro: se usa el respaldo
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = azar(16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
