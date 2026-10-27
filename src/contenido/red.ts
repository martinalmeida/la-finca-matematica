// Contenido de "la red de la finca" (el inicio): datos curiosos, consejos para familias y
// avatares de los personajes que publican. Todo es local: no hay red real ni datos de nadie.

import type { AvatarId } from '../componentes/Ilustraciones';

/** Avatar que se muestra para un personaje de contexto.ts. */
export function avatarDeAutor(autor: string): AvatarId {
  const a = autor.toLowerCase();
  if (a.includes('abuela')) return 'abuela';
  if (a.includes('abuelo')) return 'abuelo';
  if (a.includes('doña') || a.includes('tía') || a.includes('la profe')) return 'adulta';
  if (a.includes('don') || a.includes('profe')) return 'adulto';
  // Niñas y niños del banco de contexto.
  return /a$|valentina|mariana|luisa|sofía|daniela|isabela/.test(a) ? 'nina-cacaotera' : 'nino-caficultor';
}

export type DatoCurioso = { autor: string; titulo: string; texto: string; emoji: string };

export const datosCuriosos: DatoCurioso[] = [
  { autor: 'doña Rosa', emoji: '🥚', titulo: 'La cubeta es una multiplicación', texto: 'Una cubeta trae 5 filas de 6 huevos. 5 × 6 = 30 huevos.' },
  { autor: 'el abuelo Pedro', emoji: '⚖️', titulo: '¿Cuánto pesa una arroba?', texto: 'Una arroba son 25 libras. Una libra son 500 gramos. Por eso una arroba pesa 12,5 kilos.' },
  { autor: 'el profe Julián', emoji: '🔟', titulo: 'Multiplicar por 10', texto: 'Para multiplicar por 10 se agrega un cero: 7 × 10 = 70 y 25 × 10 = 250.' },
  { autor: 'la abuela Carmen', emoji: '🍊', titulo: 'Repartir es dividir', texto: 'Si repartes 12 naranjas entre 3 primos, a cada uno le tocan 4. 12 ÷ 3 = 4.' },
  { autor: 'el profe Julián', emoji: '🔁', titulo: 'Sumar y restar son hermanas', texto: 'Si 8 + 5 = 13, entonces 13 − 5 = 8. Con una suma puedes revisar una resta.' },
  { autor: 'don Ramiro', emoji: '🌳', titulo: 'Árboles en filas', texto: 'Un lote con 4 filas de 6 árboles tiene 4 × 6 = 24 árboles. ¡Y 6 × 4 también da 24!' },
  { autor: 'doña Marleny', emoji: '🧮', titulo: 'Truco del 9', texto: 'Para sumar 9, suma 10 y quita 1. 25 + 9 → 35 − 1 = 34.' },
  { autor: 'la tía Gloria', emoji: '✅', titulo: 'Revisa tu división', texto: 'Si 20 ÷ 4 = 5, multiplica para revisar: 5 × 4 = 20. ¡Cuadra!' },
  { autor: 'don Efraín', emoji: '🥖', titulo: 'Docena y media docena', texto: 'Una docena son 12 y media docena son 6. Dos docenas de arepas son 24.' },
  { autor: 'el profe Julián', emoji: '🎯', titulo: 'Estimar antes de calcular', texto: '48 + 31 está cerca de 50 + 30 = 80. Si te da 790, ¡algo salió mal!' },
];

export const consejosFamilia = [
  { t: 'Acompañe, no haga la tarea', d: 'Siéntese a su lado y déjelo pensar. Si usted resuelve por él o ella, se pierde la oportunidad de aprender.' },
  { t: 'Pregunte cómo lo pensó', d: '«¿Cómo lo hiciste?» vale más que «¿cuánto te dio?». Escuche su explicación aunque la respuesta no sea correcta.' },
  { t: 'Use lo que pasa en la finca', d: 'Invente problemas con lo de todos los días: cuántas mazorcas cortaron, cuántos huevos pusieron las gallinas, cuánto cuesta el mercado.' },
  { t: 'Cuenten juntos en la tienda', d: 'Pídale que calcule el total de una compra pequeña o los vueltos. El dinero es una gran forma de practicar.' },
  { t: 'Celebre el esfuerzo', d: 'Felicite cuando insiste y cuando corrige un error. Equivocarse es parte de aprender, no un motivo de regaño.' },
  { t: 'Diez minutos al día', d: 'Es mejor practicar un poco todos los días que mucho de vez en cuando. Busque un momento tranquilo, sin afán.' },
  { t: 'Use objetos', d: 'Granos de cacao, piedritas o tapas sirven para contar, juntar, quitar y repartir. Ver y tocar ayuda a entender.' },
  { t: 'No compare con otros', d: 'Cada niño y niña tiene su ritmo. Compárelo solo con lo que él o ella sabía antes y note cuánto ha avanzado.' },
];

/** Índice del día (cambia el contenido destacado cada día, igual en todo el celular). */
export function indiceDelDia(n: number, desfase = 0): number {
  const dias = Math.floor(Date.now() / 86_400_000);
  return (dias + desfase) % n;
}
