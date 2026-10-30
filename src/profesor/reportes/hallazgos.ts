// «Lo más importante»: frases cortas que resumen el informe para el profesor (y para la portada
// del PDF). Se arman solo con lo que muestran las gráficas, sin interpretar de más.

import type { FilaAlumno, FilaDesglose, Indicadores, PrePost } from '../metricas';
import { fmtMin, fmtNum, fmtPct } from '../graficas/formato';

const p = (x: number) => (x < 0.001 ? 'p < 0,001' : `p = ${fmtNum(x, 3)}`);

export function hallazgos(k: Indicadores, anterior: Indicadores | null, ops: FilaDesglose[], temas: FilaDesglose[], pp: PrePost, filas: FilaAlumno[], deUnAlumno = false): string[] {
  const h: string[] = [];
  if (!k.ejercicios) {
    h.push('No hay ejercicios respondidos con estos filtros.');
    return h;
  }
  h.push(
    deUnAlumno
      ? `Practicó ${k.diasActivosProm ?? 0} ${k.diasActivosProm === 1 ? 'día' : 'días'}: ${fmtNum(k.ejercicios)} ejercicios y ${fmtMin(k.minutos)} de práctica.`
      : `${k.activos} de ${k.alumnos} usuarios practicaron: ${fmtNum(k.ejercicios)} ejercicios y ${fmtMin(k.minutos)} de práctica en total.`,
  );
  if (k.primerIntento !== null) {
    let t = `Acertaron al primer intento el ${fmtPct(k.primerIntento)} de los ejercicios`;
    if (anterior?.primerIntento !== null && anterior?.primerIntento !== undefined && anterior.ejercicios >= 20) {
      const d = k.primerIntento - anterior.primerIntento;
      t += Math.abs(d) < 1 ? ', casi igual que en el periodo anterior' : `, ${fmtNum(Math.abs(d))} puntos ${d > 0 ? 'más' : 'menos'} que en el periodo anterior`;
    }
    h.push(t + '.');
  }
  const conDatos = ops.filter((o) => o.ejercicios >= 20 && o.primerIntento !== null && o.id !== 'mixta');
  if (conDatos.length >= 2) {
    const peor = [...conDatos].sort((a, b) => a.primerIntento! - b.primerIntento!)[0];
    h.push(`La operación con menor acierto es ${peor.etiqueta.toLowerCase()} (${fmtPct(peor.primerIntento!)}).`);
  }
  const temasDificiles = temas.filter((t) => t.ejercicios >= 20 && t.primerIntento !== null && t.primerIntento < 60);
  if (temasDificiles.length) {
    const peor = [...temasDificiles].sort((a, b) => a.primerIntento! - b.primerIntento!)[0];
    h.push(`${temasDificiles.length === 1 ? 'Un tema está' : `${temasDificiles.length} temas están`} por debajo del 60 % de acierto; el más difícil es «${peor.etiqueta}» (${fmtPct(peor.primerIntento!)}).`);
  }
  const e = pp.estadistica;
  const f0 = pp.filas[0];
  if (deUnAlumno) {
    if (f0?.aciertosAntes !== null && f0?.aciertosAntes !== undefined && f0.aciertosDespues !== null) h.push(`Prueba de entrada: ${f0.aciertosAntes} de ${f0.total}; prueba final: ${f0.aciertosDespues} de ${f0.total}.`);
    else if (f0?.aciertosAntes !== null && f0?.aciertosAntes !== undefined) h.push(`Prueba de entrada: ${f0.aciertosAntes} de ${f0.total}; todavía no presenta la final.`);
    return h;
  }
  if (e && e.n >= 2) {
    let t = `En la prueba final, ${e.mejoraron} de ${e.n} mejoraron respecto a la de entrada (de ${fmtPct(e.mediaAntes)} a ${fmtPct(e.mediaDespues)} en promedio`;
    if (e.p !== null) t += `; ${p(e.p)}, efecto ${e.magnitud}`;
    h.push(t + ').');
  } else if (pp.conEntrada && !pp.conFinal) h.push(`${pp.conEntrada} hicieron la prueba de entrada; nadie ha hecho aún la final.`);
  const atencion = filas.filter((f) => f.alertas.some((a) => a.tono !== 'aviso'));
  if (atencion.length) h.push(`${atencion.length === 1 ? 'Un usuario necesita' : `${atencion.length} usuarios necesitan`} atención (ver «Seguimiento»).`);
  return h;
}
