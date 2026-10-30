// Libro de Excel del informe: una hoja por tabla, con los mismos filtros que la pantalla.
// Se carga solo al exportar (import dinámico), junto con el escritor de excel.ts.

import type { Hoja } from '../excel';
import { nombreGrupo } from '../informes';
import {
  alPrimerIntento,
  contarErrores,
  DEFINICIONES,
  filasAlumnos,
  indicadores,
  matrizErrores,
  nombreError,
  nombrePista,
  nombreTema,
  porOperacion,
  porPlantilla,
  porTema,
  prePost,
  serie,
  type Conjunto,
  type FilaDesglose,
} from '../metricas';
import { nombresOperacion } from '../../juego/informes';
import type { Operacion } from '../../juego/tipos';

const r = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);

function hojaDesglose(nombre: string, titulo: string, primera: string, filas: FilaDesglose[]): Hoja {
  return {
    nombre,
    titulo,
    columnas: [
      { titulo: primera, ancho: 36 },
      { titulo: 'Detalle', ancho: 24 },
      { titulo: 'Ejercicios', formato: 'entero' },
      { titulo: 'Usuarios', formato: 'entero' },
      { titulo: 'Acierto al primer intento', formato: 'porcentaje' },
      { titulo: 'Resueltos', formato: 'porcentaje' },
      { titulo: 'Minutos', formato: 'minutos' },
      { titulo: 'Segundos por ejercicio (mediana)', formato: 'decimal' },
      { titulo: 'Pistas por ejercicio', formato: 'decimal' },
      { titulo: 'Error más común', ancho: 28 },
    ],
    filas: filas.map((f) => [f.etiqueta, f.detalle ?? '', f.ejercicios, f.alumnos, r(f.primerIntento), r(f.logro), r(f.minutos), r(f.segMediana), r(f.pistasPorEjercicio, 2), f.erroresTop ?? '']),
  };
}

export function hojasInforme(c: Conjunto, meta: { titulo: string; filtros: string[]; profesor: string }): Hoja[] {
  const k = indicadores(c);
  const pp = prePost(c);
  const e = pp.estadistica;
  const generado = `Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} por ${meta.profesor}`;
  const por = new Map(c.alumnos.map((a) => [a.fila.id, a]));

  const resumen: Hoja = {
    nombre: 'Resumen',
    titulo: `La Finca Matemática · ${meta.titulo}`,
    subtitulo: [generado, ...meta.filtros],
    columnas: [{ titulo: 'Indicador', ancho: 42 }, { titulo: 'Valor', ancho: 18 }, { titulo: 'Cómo se calcula', ancho: 90 }],
    filas: [
      ['Usuarios en la selección', k.alumnos, ''],
      ['Usuarios activos', k.activos, DEFINICIONES.activos],
      ['Ejercicios respondidos', k.ejercicios, ''],
      ['Acierto al primer intento (%)', r(k.primerIntento), DEFINICIONES.primerIntento],
      ['Resueltos (%)', r(k.logro), DEFINICIONES.logro],
      ['Tiempo en tarea (minutos)', r(k.minutos), DEFINICIONES.minutos],
      ['Minutos por usuario activo', r(k.minutosPorActivo), ''],
      ['Segundos por ejercicio (mediana)', r(k.segMediana), DEFINICIONES.segMediana],
      ['Pistas por ejercicio', r(k.pistasPorEjercicio, 2), DEFINICIONES.pistas],
      ['Días activos por usuario', r(k.diasActivosProm), DEFINICIONES.dias],
      ['Niveles superados', k.nivelesSuperados, DEFINICIONES.superados],
      ['Usuarios con prueba de entrada', pp.conEntrada, ''],
      ['Usuarios con prueba final', pp.conFinal, ''],
      ['Usuarios con las dos pruebas (n)', e?.n ?? 0, ''],
      ['Promedio de entrada (%)', r(e?.mediaAntes), ''],
      ['Promedio final (%)', r(e?.mediaDespues), ''],
      ['Diferencia media (pts)', r(e?.diferencia, 2), 'Final − entrada, en puntos porcentuales.'],
      ['Desviación de las diferencias', r(e?.deDiferencia, 2), ''],
      ['IC 95 % inferior', r(e?.ic95?.[0], 2), ''],
      ['IC 95 % superior', r(e?.ic95?.[1], 2), ''],
      ['t (muestras pareadas)', r(e?.t, 3), DEFINICIONES.t],
      ['Grados de libertad', e?.gl ?? null, ''],
      ['Valor p (bilateral)', r(e?.p, 4), ''],
      ['d de Cohen (pareada)', r(e?.d, 3), DEFINICIONES.d],
      ['Magnitud del efecto', e?.magnitud ?? '', ''],
      ['Wilcoxon W+', r(e?.wilcoxon?.w, 1), DEFINICIONES.wilcoxon],
      ['Wilcoxon z', r(e?.wilcoxon?.z, 3), ''],
      ['Wilcoxon p', r(e?.wilcoxon?.p, 4), ''],
      ['Ganancia normalizada promedio', r(pp.gananciaNormalizadaProm, 3), DEFINICIONES.ganancia],
      ['Mejoraron / igual / bajaron', e ? `${e.mejoraron} / ${e.iguales} / ${e.bajaron}` : '', ''],
    ],
    filtro: false,
  };

  const usuarios: Hoja = {
    nombre: 'Usuarios',
    titulo: 'Comparación de usuarios',
    columnas: [
      { titulo: 'Usuario', ancho: 26 },
      { titulo: 'Nombre de usuario', ancho: 18 },
      { titulo: 'Grupo' },
      { titulo: 'Ruta', ancho: 22 },
      { titulo: 'Nivel actual', formato: 'entero' },
      { titulo: 'Niveles superados', formato: 'entero' },
      { titulo: 'Avance de la ruta', formato: 'porcentaje' },
      { titulo: 'Ejercicios', formato: 'entero' },
      { titulo: 'Acierto al primer intento', formato: 'porcentaje' },
      { titulo: 'Resueltos', formato: 'porcentaje' },
      { titulo: 'Tendencia (pts)', formato: 'decimal' },
      { titulo: 'Minutos', formato: 'minutos' },
      { titulo: 'Días activos', formato: 'entero' },
      { titulo: 'Pistas por ejercicio', formato: 'decimal' },
      { titulo: 'Segundos por ejercicio', formato: 'decimal' },
      { titulo: 'Prueba de entrada', formato: 'porcentaje' },
      { titulo: 'Prueba final', formato: 'porcentaje' },
      { titulo: 'Diferencia (pts)', formato: 'decimal' },
      { titulo: 'Le cuesta más', ancho: 16 },
      { titulo: 'Error más frecuente', ancho: 28 },
      { titulo: 'Última actividad', formato: 'fechaHora' },
      { titulo: 'Alertas', ancho: 60 },
    ],
    filas: filasAlumnos(c).map((f) => [
      f.nombre, f.usuario, nombreGrupo(f.grupo), nombrePista(f.pista), f.nivelActual, f.superados, r(f.avance), f.ejercicios, r(f.primerIntento), r(f.logro), r(f.tendencia),
      r(f.minutos), f.dias, r(f.pistasPorEjercicio, 2), r(f.segMediana), r(f.antes), r(f.despues), r(f.diferencia), f.operacionDebil ?? '', f.errorFrecuente ?? '', f.ultima,
      f.alertas.map((a) => a.texto).join('; '),
    ]),
  };

  const pruebas: Hoja = {
    nombre: 'Entrada vs final',
    titulo: 'Prueba de entrada y prueba final por usuario',
    subtitulo: ['Última prueba de cada usuario (no depende del periodo). 1 = acertó la pregunta del tema, 0 = no.'],
    columnas: [
      { titulo: 'Usuario', ancho: 26 },
      { titulo: 'Grupo' },
      { titulo: 'Prueba', ancho: 16 },
      { titulo: 'Aciertos entrada', formato: 'entero' },
      { titulo: 'Aciertos final', formato: 'entero' },
      { titulo: 'Preguntas', formato: 'entero' },
      { titulo: 'Entrada %', formato: 'porcentaje' },
      { titulo: 'Final %', formato: 'porcentaje' },
      { titulo: 'Diferencia (pts)', formato: 'decimal' },
      { titulo: 'Ganancia normalizada', formato: 'decimal' },
      { titulo: 'Fecha entrada', formato: 'fechaHora' },
      { titulo: 'Fecha final', formato: 'fechaHora' },
      { titulo: 'Minutos entrada', formato: 'minutos' },
      { titulo: 'Minutos final', formato: 'minutos' },
      ...Array.from({ length: 10 }, (_, i) => ({ titulo: `E${i + 1}`, formato: 'entero' as const, ancho: 5 })),
      ...Array.from({ length: 10 }, (_, i) => ({ titulo: `F${i + 1}`, formato: 'entero' as const, ancho: 5 })),
    ],
    filas: pp.filas.map((f) => [
      f.nombre, nombreGrupo(f.grupo), nombrePista(f.pista), f.aciertosAntes, f.aciertosDespues, f.total, r(f.antes), r(f.despues), r(f.diferencia), r(f.ganancia, 3), f.fechaAntes, f.fechaDespues, r(f.minutosAntes), r(f.minutosDespues),
      ...Array.from({ length: 10 }, (_, i) => (f.porTemaAntes?.[i] === undefined ? null : f.porTemaAntes[i] ? 1 : 0)),
      ...Array.from({ length: 10 }, (_, i) => (f.porTemaDespues?.[i] === undefined ? null : f.porTemaDespues[i] ? 1 : 0)),
    ]),
    notas: ['E1…E10: pregunta de cada tema en la prueba de entrada; F1…F10: en la final (los temas de cada grado están en la hoja «Temas de las pruebas»).'],
  };

  const temasPruebas: Hoja = {
    nombre: 'Temas de las pruebas',
    titulo: '% de usuarios que acertaron cada tema',
    columnas: [{ titulo: 'Prueba', ancho: 16 }, { titulo: 'N.º', formato: 'entero' }, { titulo: 'Tema', ancho: 40 }, { titulo: 'Entrada', formato: 'porcentaje' }, { titulo: 'n entrada', formato: 'entero' }, { titulo: 'Final', formato: 'porcentaje' }, { titulo: 'n final', formato: 'entero' }, { titulo: 'Diferencia (pts)', formato: 'decimal' }],
    filas: pp.temas.flatMap((g) => g.temas.map((t, i) => [g.nombre, i + 1, t.etiqueta, r(t.antes), t.nAntes, r(t.despues), t.nDespues, t.antes !== null && t.despues !== null ? r(t.despues - t.antes) : null])),
  };

  const s = serie(c);
  const evolucion: Hoja = {
    nombre: 'Evolución',
    titulo: `Evolución por ${s.unidad === 'dia' ? 'día' : s.unidad}`,
    columnas: [{ titulo: s.unidad === 'semana' ? 'Semana del' : s.unidad === 'mes' ? 'Mes' : 'Día', formato: 'fecha' }, { titulo: 'Ejercicios', formato: 'entero' }, { titulo: 'Usuarios activos', formato: 'entero' }, { titulo: 'Acierto al primer intento', formato: 'porcentaje' }, { titulo: 'Resueltos', formato: 'porcentaje' }, { titulo: 'Minutos', formato: 'minutos' }, { titulo: 'Pistas por ejercicio', formato: 'decimal' }],
    filas: s.puntos.map((p) => [p.desde, p.ejercicios, p.activos, r(p.primerIntento), r(p.logro), r(p.minutos), r(p.pistasPorEjercicio, 2)]),
  };

  const m = matrizErrores(c);
  const errores: Hoja = {
    nombre: 'Errores',
    titulo: 'Tipos de error por operación',
    columnas: [{ titulo: 'Tipo de error', ancho: 34 }, { titulo: 'Total', formato: 'entero' }, { titulo: '% de los errores', formato: 'porcentaje' }, ...m.operaciones.map((o) => ({ titulo: o.etiqueta, formato: 'entero' as const }))],
    filas: contarErrores(c.eventos).map((x) => [x.nombre, x.n, r(x.pct), ...m.operaciones.map((o) => m.valor.get(`${x.tipo}|${o.id}`) ?? 0)]),
  };

  const ejercicios: Hoja = {
    nombre: 'Ejercicios',
    titulo: 'Cada ejercicio respondido',
    columnas: [
      { titulo: 'Fecha y hora', formato: 'fechaHora' }, { titulo: 'Usuario', ancho: 24 }, { titulo: 'Grupo' }, { titulo: 'Actividad', ancho: 16 }, { titulo: 'Ruta', ancho: 20 }, { titulo: 'Nivel', formato: 'entero' }, { titulo: 'Tema', ancho: 36 },
      { titulo: 'Plantilla', ancho: 24 }, { titulo: 'Operación' }, { titulo: 'Correcto', ancho: 9 }, { titulo: 'Al primer intento', ancho: 9 }, { titulo: 'Intentos', formato: 'entero' }, { titulo: 'Pistas', formato: 'entero' }, { titulo: 'Tipo de error', ancho: 26 }, { titulo: 'Segundos', formato: 'decimal' },
    ],
    filas: c.eventos.map((ev) => {
      const a = por.get(ev.usuario_id);
      return [
        ev.t, a?.fila.nombre ?? ev.usuario_id, a ? nombreGrupo(a.grupo) : '', ev.tipo === 'nivel' ? 'Nivel' : ev.tipo === 'prueba-final' ? 'Prueba final' : 'Prueba de entrada', nombrePista(ev.pista), ev.nivel, nombreTema(ev.pista, ev.nivel),
        ev.plantilla, nombresOperacion[ev.operacion as Operacion] ?? ev.operacion, ev.correcto, alPrimerIntento(ev), ev.intentos, ev.pistas_usadas, ev.tipo_error ? nombreError(ev.tipo_error) : '', r((ev.ms ?? 0) / 1000),
      ];
    }),
  };

  const partidas: Hoja = {
    nombre: 'Partidas',
    titulo: 'Niveles y pruebas terminados',
    columnas: [{ titulo: 'Fecha y hora', formato: 'fechaHora' }, { titulo: 'Usuario', ancho: 24 }, { titulo: 'Actividad', ancho: 16 }, { titulo: 'Ruta', ancho: 20 }, { titulo: 'Nivel', formato: 'entero' }, { titulo: 'Aciertos', formato: 'entero' }, { titulo: 'Preguntas', formato: 'entero' }, { titulo: 'Estrellas', formato: 'entero' }, { titulo: 'Minutos', formato: 'minutos' }, { titulo: 'Repaso', ancho: 8 }, { titulo: 'Exigencia' }],
    filas: c.partidas.map((p) => [p.t, por.get(p.usuario_id)?.fila.nombre ?? p.usuario_id, p.tipo === 'nivel' ? 'Nivel' : p.tipo === 'prueba-final' ? 'Prueba final' : 'Prueba de entrada', nombrePista(p.pista), p.nivel, p.aciertos, p.total, p.estrellas, r((p.ms_total ?? 0) / 60000), p.repaso, p.banda ?? '']),
  };

  return [
    resumen,
    usuarios,
    pruebas,
    temasPruebas,
    evolucion,
    hojaDesglose('Por operación', 'Desempeño por operación', 'Operación', porOperacion(c)),
    hojaDesglose('Por tema', 'Desempeño por tema', 'Tema', porTema(c)),
    hojaDesglose('Por plantilla', 'Desempeño por tipo de ejercicio (plantilla)', 'Plantilla', porPlantilla(c)),
    errores,
    ejercicios,
    partidas,
    {
      nombre: 'Definiciones',
      titulo: 'Cómo se calcula cada métrica',
      columnas: [{ titulo: 'Métrica', ancho: 24 }, { titulo: 'Definición', ancho: 120 }],
      filas: Object.entries(DEFINICIONES).map(([, t]) => {
        const [nombre, ...resto] = t.split(':');
        return [nombre, resto.join(':').trim()];
      }),
      filtro: false,
    },
  ];
}
