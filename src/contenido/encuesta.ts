// Encuesta de satisfacción sobre la aplicación: se responde una vez, al terminar la ruta.
// Las claves deben coincidir con las que acepta enviar_encuesta (supabase/migraciones/006_encuestas.sql).

export type ClavePregunta = 'facil' | 'gusto' | 'aprendi' | 'videos' | 'dibujos_voz' | 'otra_vez' | 'recomendar';

export type PreguntaEncuesta = {
  clave: ClavePregunta;
  /** Texto para niños (tú). */
  nino: string;
  /** Texto para familias (usted). */
  adulto: string;
  /** Texto corto para los informes del profesor. */
  corto: string;
  /** Si se puede responder «No lo usé» (se guarda null). */
  noUso?: { nino: string; adulto: string };
};

export const PREGUNTAS_ENCUESTA: PreguntaEncuesta[] = [
  { clave: 'facil', nino: '¿Fue fácil usar la aplicación?', adulto: '¿Le resultó fácil usar la aplicación?', corto: 'Fácil de usar' },
  { clave: 'gusto', nino: '¿Te gustó jugar en La Finca Matemática?', adulto: '¿Le gustó usar La Finca Matemática?', corto: 'Le gustó' },
  { clave: 'aprendi', nino: '¿Sientes que aprendiste matemáticas?', adulto: '¿Siente que aprendió matemáticas para la vida diaria?', corto: 'Aprendió' },
  {
    clave: 'videos',
    nino: '¿Te ayudaron los videos y las lecciones?',
    adulto: '¿Le ayudaron los videos y las lecciones?',
    corto: 'Videos y lecciones',
    noUso: { nino: 'No los vi', adulto: 'No los vi' },
  },
  { clave: 'dibujos_voz', nino: '¿Entendiste bien los dibujos y la voz que lee?', adulto: '¿Entendió bien los dibujos y la voz que lee?', corto: 'Dibujos y voz' },
  { clave: 'otra_vez', nino: '¿Te gustaría seguir usándola?', adulto: '¿Le gustaría seguir usándola?', corto: 'La usaría otra vez' },
  { clave: 'recomendar', nino: '¿Se la recomendarías a un amigo?', adulto: '¿Se la recomendaría a otra familia?', corto: 'La recomendaría' },
];

/** Inclusión: versión corta, sin preguntas para escribir. */
export const PREGUNTAS_INCLUSION: ClavePregunta[] = ['gusto', 'facil', 'dibujos_voz', 'otra_vez'];

/** Caritas de la 1 (nada) a la 5 (mucho). */
export const ESCALA = [
  { valor: 1, texto: 'Nada' },
  { valor: 2, texto: 'Poco' },
  { valor: 3, texto: 'Más o menos' },
  { valor: 4, texto: 'Bastante' },
  { valor: 5, texto: 'Mucho' },
] as const;

export const ABIERTAS = {
  gusto: { nino: '¿Qué fue lo que más te gustó?', adulto: '¿Qué fue lo que más le gustó?', corto: 'Lo que más le gustó' },
  mejorar: { nino: '¿Qué le cambiarías o mejorarías?', adulto: '¿Qué le cambiaría o mejoraría?', corto: 'Qué mejoraría' },
} as const;

export const MAX_TEXTO_ENCUESTA = 1000;

export function preguntasDe(inclusion: boolean): PreguntaEncuesta[] {
  return inclusion ? PREGUNTAS_INCLUSION.map((c) => PREGUNTAS_ENCUESTA.find((p) => p.clave === c)!) : PREGUNTAS_ENCUESTA;
}

export function preguntaDe(clave: string): PreguntaEncuesta | undefined {
  return PREGUNTAS_ENCUESTA.find((p) => p.clave === clave);
}
