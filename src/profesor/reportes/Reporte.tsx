// Informe del profesor: secciones con indicadores, gráficas y tablas sobre un conjunto filtrado.
// El mismo componente se ve en pantalla, se imprime como PDF y sirve para un grupo o un usuario.

import { useMemo, useState, type ReactNode } from 'react';
import type { Pista } from '../../juego/tipos';
import { nombreGrupo, type Alumno } from '../informes';
import { progresoDe } from '../../almacenamiento/datos';
import { nivelMaximo, temaDe } from '../../juego/motor';
import { etiquetaNivel } from '../../juego/complejidad';
import type { PartidaRemota } from '../api';
import {
  DEFINICIONES,
  filasAlumnos,
  indicadores,
  mapaAlumnoTema,
  matrizErrores,
  nombrePista,
  ordenarPistas,
  porOperacion,
  porTema,
  prePost,
  serie,
  contarErrores,
  type Conjunto,
  type FilaAlumno,
  type FilaDesglose,
  type FilaPrePost,
} from '../metricas';
import {
  BarraApilada,
  FilaKPI,
  GraficaBarras,
  GraficaColumnas,
  GraficaLinea,
  GraficaPrePost,
  IndicadorKPI,
  Insignia,
  MapaCalor,
  Medidor,
  TablaDatos,
  Tarjeta,
} from '../graficas';
import { fmtDelta, fmtFechaCorta, fmtMin, fmtNum, fmtPct } from '../graficas/formato';
import { hallazgos } from './hallazgos';

/** Secciones del informe (en orden). */
export const SECCIONES = [
  { id: 'resumen', titulo: 'Resumen' },
  { id: 'pruebas', titulo: 'Entrada vs. final' },
  { id: 'seguimiento', titulo: 'Seguimiento' },
  { id: 'evolucion', titulo: 'Evolución' },
  { id: 'temas', titulo: 'Temas y operaciones' },
  { id: 'errores', titulo: 'Errores' },
  { id: 'usuarios', titulo: 'Usuarios' },
] as const;

export type IdSeccion = (typeof SECCIONES)[number]['id'];

type Props = {
  c: Conjunto;
  /** Mismo filtro en el periodo anterior (para las variaciones), si el periodo tiene límites. */
  anterior: Conjunto | null;
  /** Un solo usuario: sin comparación entre usuarios. */
  deUnAlumno?: boolean;
  impreso?: boolean;
  /** Secciones a mostrar (por defecto, todas). */
  secciones?: IdSeccion[];
  alPulsarAlumno?: (id: string) => void;
  ahora?: number;
};

const META = 70;
const v = (x: number | null | undefined, f: (n: number) => string) => (x === null || x === undefined ? '—' : f(x));
const pctTxt = (x: number | null | undefined) => v(x, (n) => fmtPct(n));
const dec = (x: number | null | undefined, d = 1) => v(x, (n) => fmtNum(n, d));
const pValor = (x: number | null) => (x === null ? '—' : x < 0.001 ? '< 0,001' : fmtNum(x, 3));

function Seccion({ id, titulo, children, nota }: { id: string; titulo: string; children: ReactNode; nota?: ReactNode }) {
  return (
    <section id={`informe-${id}`} className="informe-seccion" aria-labelledby={`titulo-${id}`}>
      <header className="informe-seccion-cabeza">
        <h3 id={`titulo-${id}`}>{titulo}</h3>
        {nota && <p className="pequeno suave">{nota}</p>}
      </header>
      {children}
    </section>
  );
}

const Vacio = ({ texto = 'No hay datos con estos filtros.' }: { texto?: string }) => <p className="informe-vacio pequeno suave">{texto}</p>;

/** Tabla de un desglose (operación o tema). */
function tablaDesglose(filas: FilaDesglose[], titulo: string) {
  return (
    <TablaDatos<FilaDesglose>
      clave={(f) => f.id}
      filas={filas}
      columnas={[
        { id: 'etiqueta', titulo, valor: (f) => f.etiqueta, render: (f) => (f.detalle ? <span>{f.etiqueta} <span className="suave pequeno">· {f.detalle}</span></span> : f.etiqueta) },
        { id: 'ejercicios', titulo: 'Ejercicios', valor: (f) => f.ejercicios, formato: (x) => fmtNum(Number(x)), alinear: 'der', ordenable: true },
        { id: 'alumnos', titulo: 'Usuarios', valor: (f) => f.alumnos, alinear: 'der', ordenable: true },
        { id: 'primer', titulo: 'Acierto 1.er intento', valor: (f) => f.primerIntento, formato: (x) => pctTxt(x as number | null), alinear: 'der', ordenable: true },
        { id: 'logro', titulo: 'Resueltos', valor: (f) => f.logro, formato: (x) => pctTxt(x as number | null), alinear: 'der', ordenable: true },
        { id: 'seg', titulo: 'Seg. por ejercicio', valor: (f) => f.segMediana, formato: (x) => dec(x as number | null, 0), alinear: 'der', ordenable: true },
        { id: 'pistas', titulo: 'Pistas', valor: (f) => f.pistasPorEjercicio, formato: (x) => dec(x as number | null), alinear: 'der', ordenable: true },
        { id: 'error', titulo: 'Error más común', valor: (f) => f.erroresTop ?? '—' },
      ]}
    />
  );
}

export default function Reporte({ c, anterior, deUnAlumno, impreso, secciones, alPulsarAlumno, ahora = Date.now() }: Props) {
  const ver = (s: IdSeccion) => (!secciones || secciones.includes(s)) && !(deUnAlumno && s === 'usuarios');
  const k = useMemo(() => indicadores(c), [c]);
  const kAnt = useMemo(() => (anterior ? indicadores(anterior) : null), [anterior]);
  const s = useMemo(() => serie(c), [c]);
  const ops = useMemo(() => porOperacion(c), [c]);
  const temas = useMemo(() => porTema(c), [c]);
  const pp = useMemo(() => prePost(c), [c]);
  const filas = useMemo(() => filasAlumnos(c, ahora), [c, ahora]);
  const mErr = useMemo(() => matrizErrores(c), [c]);
  const errores = useMemo(() => contarErrores(c.eventos), [c]);
  const lo = useMemo(() => hallazgos(k, kAnt, ops, temas, pp, filas, deUnAlumno), [k, kAnt, ops, temas, pp, filas, deUnAlumno]);
  const pistasPrueba = pp.temas.map((t) => t.pista);
  const [pistaTemas, setPistaTemas] = useState<Pista | null>(null);
  const pistaElegida = pistaTemas && pistasPrueba.includes(pistaTemas) ? pistaTemas : pistasPrueba[0] ?? null;
  const pistasJuego = useMemo(() => ordenarPistas([...new Set(c.eventos.filter((e) => e.tipo === 'nivel').map((e) => e.pista as Pista))]), [c]);
  const pistasTema = useMemo(() => ordenarPistas([...new Set(temas.map((t) => t.id.split('|')[0] as Pista))]), [temas]);
  const [pistaTema, setPistaTema] = useState<Pista | null>(null);
  const pistaTemaElegida = pistaTema && pistasTema.includes(pistaTema) ? pistaTema : pistasTema[0] ?? null;
  const [pistaMapa, setPistaMapa] = useState<Pista | null>(null);
  const pistaMapaElegida = pistaMapa && pistasJuego.includes(pistaMapa) ? pistaMapa : pistasJuego[0] ?? null;
  const mapa = useMemo(() => (pistaMapaElegida ? mapaAlumnoTema(c, pistaMapaElegida) : null), [c, pistaMapaElegida]);

  const delta = (actual: number | null, previo: number | null | undefined, mejorSiSube: boolean, texto: (d: number) => string) =>
    actual !== null && previo !== null && previo !== undefined && kAnt && kAnt.ejercicios > 0 ? { valor: actual - previo, texto: texto(actual - previo), mejorSiSube } : undefined;
  const unidadSerie = s.unidad === 'dia' ? 'día' : s.unidad === 'semana' ? 'semana' : 'mes';
  const xs = s.puntos.map((p) => p.desde);
  const alumno = deUnAlumno ? filas[0] : undefined;

  const selector = (lista: Pista[], actual: Pista | null, cambiar: (p: Pista) => void, nombre: (p: Pista) => string) =>
    lista.length > 1 && !impreso ? (
      <div className="segmentado pequeno" role="radiogroup" aria-label="Grupo de temas">
        {lista.map((p) => (
          <button key={p} type="button" role="radio" aria-checked={p === actual} className={p === actual ? 'activo' : ''} onClick={() => cambiar(p)}>
            {nombre(p)}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className={`informe ${impreso ? 'informe-impreso' : ''}`}>
      {ver('resumen') && (
        <Seccion id="resumen" titulo="Resumen" nota={kAnt ? 'Las flechas comparan con el periodo anterior de la misma duración.' : undefined}>
          {alumno && alumno.alertas.length > 0 && (
            <div className="fila alertas-alumno">
              {alumno.alertas.map((a) => (
                <Insignia key={a.tipo} tono={a.tono}>
                  {a.texto}
                </Insignia>
              ))}
            </div>
          )}
          <FilaKPI>
            {!deUnAlumno && (
              <IndicadorKPI
                etiqueta="Usuarios activos"
                valor={`${fmtNum(k.activos)} de ${fmtNum(k.alumnos)}`}
                delta={delta(k.activos, kAnt?.activos, true, (d) => `${fmtDelta(d)} vs. periodo anterior`)}
                ayuda={DEFINICIONES.activos}
              />
            )}
            <IndicadorKPI etiqueta="Ejercicios" valor={fmtNum(k.ejercicios)} delta={delta(k.ejercicios, kAnt?.ejercicios, true, (d) => `${fmtDelta(d)} vs. periodo anterior`)} tendencia={k.tendenciaEjercicios} />
            <IndicadorKPI
              etiqueta="Acierto al primer intento"
              valor={pctTxt(k.primerIntento)}
              delta={delta(k.primerIntento, kAnt?.primerIntento, true, (d) => `${fmtDelta(d, 'pts')} vs. periodo anterior`)}
              tendencia={k.tendencia}
              ayuda={DEFINICIONES.primerIntento}
            />
            <IndicadorKPI etiqueta="Resueltos" valor={pctTxt(k.logro)} ayuda={DEFINICIONES.logro} />
            <IndicadorKPI
              etiqueta={deUnAlumno ? 'Tiempo en tarea' : 'Tiempo por usuario activo'}
              valor={deUnAlumno ? fmtMin(k.minutos) : v(k.minutosPorActivo, fmtMin)}
              ayuda={`${DEFINICIONES.minutos} Total: ${fmtMin(k.minutos)}.`}
            />
            <IndicadorKPI etiqueta="Niveles superados" valor={fmtNum(k.nivelesSuperados)} ayuda={DEFINICIONES.superados} />
            <IndicadorKPI etiqueta="Pistas por ejercicio" valor={dec(k.pistasPorEjercicio)} delta={delta(k.pistasPorEjercicio, kAnt?.pistasPorEjercicio, false, (d) => `${fmtDelta(d)} vs. periodo anterior`)} ayuda={DEFINICIONES.pistas} />
            <IndicadorKPI etiqueta={deUnAlumno ? 'Días activos' : 'Días activos por usuario'} valor={dec(k.diasActivosProm)} ayuda={DEFINICIONES.dias} />
          </FilaKPI>
          {alumno && (
            <div className="fila medidores">
              <Medidor valor={alumno.avance} etiqueta={`Ruta ${nombrePista(alumno.pista)}: ${alumno.superados} de ${alumno.nivelesRuta} niveles · nivel actual ${alumno.nivelActual}`} />
            </div>
          )}
          <Tarjeta titulo="Lo más importante">
            <ul className="hallazgos">
              {lo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Tarjeta>
        </Seccion>
      )}

      {ver('pruebas') && (
        <Seccion id="pruebas" titulo="Prueba de entrada vs. prueba final" nota="Usa la última prueba de cada usuario; no depende del periodo elegido. Puntajes en % de aciertos.">
          {!pp.filas.length ? (
            <Vacio texto={deUnAlumno ? 'Este usuario no tiene pruebas (Inclusión no las hace, o aún no las ha presentado).' : 'Nadie ha presentado pruebas con estos filtros.'} />
          ) : (
            <>
              {pp.estadistica && pp.estadistica.n >= 1 && !deUnAlumno && (
                <FilaKPI>
                  <IndicadorKPI etiqueta="Con las dos pruebas" valor={`${pp.estadistica.n}`} ayuda={`${pp.conEntrada} con prueba de entrada, ${pp.conFinal} con prueba final.`} />
                  <IndicadorKPI etiqueta="Promedio de entrada" valor={pctTxt(pp.estadistica.mediaAntes)} />
                  <IndicadorKPI etiqueta="Promedio final" valor={pctTxt(pp.estadistica.mediaDespues)} delta={{ valor: pp.estadistica.diferencia, texto: `${fmtDelta(pp.estadistica.diferencia, 'pts')} de diferencia`, mejorSiSube: true }} />
                  <IndicadorKPI
                    etiqueta="IC 95 % de la diferencia"
                    valor={pp.estadistica.ic95 ? `${fmtNum(pp.estadistica.ic95[0], 1)} a ${fmtNum(pp.estadistica.ic95[1], 1)} pts` : '—'}
                    ayuda="Intervalo de confianza del 95 % para la diferencia media (final − entrada)."
                  />
                  <IndicadorKPI etiqueta="Prueba t pareada" valor={pp.estadistica.t !== null ? `t(${pp.estadistica.gl}) = ${fmtNum(pp.estadistica.t, 2)}` : '—'} ayuda={`${DEFINICIONES.t} p = ${pValor(pp.estadistica.p)}.`} />
                  <IndicadorKPI etiqueta="Valor p" valor={pValor(pp.estadistica.p)} ayuda={DEFINICIONES.t} />
                  <IndicadorKPI etiqueta={`Tamaño del efecto (d)${pp.estadistica.d !== null ? ` · ${pp.estadistica.magnitud}` : ''}`} valor={pp.estadistica.d !== null ? fmtNum(pp.estadistica.d, 2) : '—'} ayuda={DEFINICIONES.d} />
                  <IndicadorKPI etiqueta="Ganancia normalizada" valor={dec(pp.gananciaNormalizadaProm, 2)} ayuda={DEFINICIONES.ganancia} />
                  <IndicadorKPI
                    etiqueta="Wilcoxon"
                    valor={pp.estadistica.wilcoxon ? (pp.estadistica.wilcoxon.p < 0.001 ? 'p < 0,001' : `p = ${pValor(pp.estadistica.wilcoxon.p)}`) : '—'}
                    ayuda={`${DEFINICIONES.wilcoxon}${pp.estadistica.wilcoxon ? ` W = ${fmtNum(pp.estadistica.wilcoxon.w, 1)}, z = ${fmtNum(pp.estadistica.wilcoxon.z, 2)}.` : ''}`}
                  />
                </FilaKPI>
              )}
              {pp.estadistica && pp.estadistica.n >= 1 && !deUnAlumno && (
                <Tarjeta titulo="¿Cuántos mejoraron?" subtitulo={`De ${pp.estadistica.n} usuarios con las dos pruebas`}>
                  <BarraApilada
                    mostrarPct
                    partes={[
                      { id: 'mejoro', etiqueta: 'Mejoraron', valor: pp.estadistica.mejoraron, tono: 'bien' },
                      { id: 'igual', etiqueta: 'Igual', valor: pp.estadistica.iguales, tono: 'neutro' },
                      { id: 'bajo', etiqueta: 'Bajaron', valor: pp.estadistica.bajaron, tono: 'grave' },
                    ]}
                  />
                </Tarjeta>
              )}
              {(impreso ? pistasPrueba : pistaElegida ? [pistaElegida] : []).map((pt) => {
                const g = pp.temas.find((t) => t.pista === pt)!;
                return (
                  <Tarjeta
                    key={pt}
                    titulo={impreso && pistasPrueba.length > 1 ? `Por tema · ${g.nombre}` : 'Por tema'}
                    subtitulo={`% de ${deUnAlumno ? 'aciertos' : 'usuarios que acertaron'} la pregunta de cada tema · ${g.nombre}`}
                    acciones={selector(pistasPrueba, pt, setPistaTemas, (p) => pp.temas.find((t) => t.pista === p)!.nombre)}
                  >
                    <GraficaPrePost escala="pct" max={100} filas={g.temas.map((t) => ({ id: t.id, etiqueta: t.etiqueta, antes: t.antes, despues: t.despues, n: Math.max(t.nAntes, t.nDespues) }))} />
                  </Tarjeta>
                );
              })}
              {!deUnAlumno && (
                <Tarjeta titulo="Por usuario" subtitulo="Puntaje de entrada y final de cada usuario">
                  <GraficaPrePost escala="pct" max={100} filas={pp.filas.map((f) => ({ id: f.id, etiqueta: f.nombre, antes: f.antes, despues: f.despues }))} />
                </Tarjeta>
              )}
              <Tarjeta titulo="Detalle de las pruebas">
                <TablaDatos<FilaPrePost>
                  clave={(f) => f.id}
                  filas={pp.filas}
                  ordenInicial={{ id: 'dif', desc: true }}
                  alPulsarFila={alPulsarAlumno && !deUnAlumno ? (f) => alPulsarAlumno(f.id) : undefined}
                  columnas={[
                    { id: 'nombre', titulo: 'Usuario', valor: (f) => f.nombre, ordenable: true },
                    { id: 'grupo', titulo: 'Grupo', valor: (f) => nombreGrupo(f.grupo), ordenable: true },
                    { id: 'antes', titulo: 'Entrada', valor: (f) => f.aciertosAntes, formato: (x) => (x === null ? '—' : `${x}`), alinear: 'der', ordenable: true },
                    { id: 'despues', titulo: 'Final', valor: (f) => f.aciertosDespues, formato: (x) => (x === null ? '—' : `${x}`), alinear: 'der', ordenable: true },
                    { id: 'dif', titulo: 'Diferencia', valor: (f) => f.diferencia, formato: (x) => (x === null ? '—' : fmtDelta(x as number, 'pts')), alinear: 'der', ordenable: true },
                    { id: 'g', titulo: 'Ganancia norm.', valor: (f) => f.ganancia, formato: (x) => dec(x as number | null, 2), alinear: 'der', ordenable: true },
                    { id: 'fa', titulo: 'Fecha entrada', valor: (f) => f.fechaAntes, formato: (x) => (x ? fmtFechaCorta(String(x)) : '—') },
                    { id: 'ff', titulo: 'Fecha final', valor: (f) => f.fechaDespues, formato: (x) => (x ? fmtFechaCorta(String(x)) : '—') },
                    { id: 'min', titulo: 'Min. final', valor: (f) => f.minutosDespues, formato: (x) => dec(x as number | null), alinear: 'der' },
                  ]}
                  pie={<span className="pequeno suave">Puntajes en aciertos de {pp.filas[0]?.total ?? 10}. {DEFINICIONES.ganancia}</span>}
                />
              </Tarjeta>
              {!deUnAlumno && pp.sinEntrada.length > 0 && <p className="pequeno suave">{pp.sinEntrada.length} usuario(s) todavía no presentan la prueba de entrada.</p>}
            </>
          )}
        </Seccion>
      )}

      {ver('seguimiento') && !deUnAlumno && (
        <Seccion id="seguimiento" titulo="Seguimiento" nota="Usuarios que necesitan atención, del caso más urgente al menos urgente.">
          {(() => {
            const peso = { critico: 3, grave: 2, aviso: 1 } as const;
            const conAlertas = filas
              .filter((f) => f.alertas.length)
              .map((f) => ({ f, puntos: f.alertas.reduce((s2, a) => s2 + peso[a.tono], 0) }))
              .sort((a, b) => b.puntos - a.puntos);
            if (!conAlertas.length) return <Vacio texto="Nadie necesita atención especial con estos filtros." />;
            return (
              <div className="lista-seguimiento">
                {conAlertas.map(({ f }) => (
                  <article key={f.id} className="tarjeta-seguimiento">
                    <div className="fila" style={{ justifyContent: 'space-between', gap: 8 }}>
                      {alPulsarAlumno && !impreso ? (
                        <button type="button" className="boton enlace" onClick={() => alPulsarAlumno(f.id)}>
                          <strong>{f.nombre}</strong>
                        </button>
                      ) : (
                        <strong>{f.nombre}</strong>
                      )}
                      <span className="pequeno suave">
                        {nombreGrupo(f.grupo)} · nivel {f.nivelActual} · {pctTxt(f.primerIntento)} de acierto
                      </span>
                    </div>
                    <div className="fila" style={{ gap: 6 }}>
                      {f.alertas.map((a) => (
                        <Insignia key={a.tipo} tono={a.tono}>
                          {a.texto}
                        </Insignia>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            );
          })()}
        </Seccion>
      )}

      {ver('evolucion') && (
        <Seccion id="evolucion" titulo="Evolución en el tiempo" nota={`Un punto por ${unidadSerie}.`}>
          {!k.ejercicios ? (
            <Vacio />
          ) : (
            <>
              <Tarjeta
                titulo="Acierto"
                subtitulo={`Al primer intento y resueltos, por ${unidadSerie}`}
                tabla={tablaSerie(s.puntos, unidadSerie)}
              >
                <GraficaLinea
                  x={xs}
                  escala="pct"
                  meta={{ valor: META, etiqueta: 'Meta' }}
                  series={[
                    { id: 'primer', nombre: 'Primer intento', valores: s.puntos.map((p) => p.primerIntento) },
                    { id: 'logro', nombre: 'Resueltos', valores: s.puntos.map((p) => p.logro) },
                  ]}
                />
              </Tarjeta>
              <div className="rejilla-dos">
                <Tarjeta titulo="Ejercicios respondidos" subtitulo={`Por ${unidadSerie}`}>
                  <GraficaColumnas x={xs} valores={s.puntos.map((p) => p.ejercicios)} escala="num" nombre="Ejercicios" />
                </Tarjeta>
                <Tarjeta titulo="Tiempo en tarea" subtitulo={`Minutos por ${unidadSerie}`}>
                  <GraficaColumnas x={xs} valores={s.puntos.map((p) => p.minutos)} escala="min" nombre="Minutos" />
                </Tarjeta>
                {!deUnAlumno && (
                  <Tarjeta titulo="Usuarios activos" subtitulo={`Por ${unidadSerie}`}>
                    <GraficaColumnas x={xs} valores={s.puntos.map((p) => p.activos)} escala="num" nombre="Usuarios activos" />
                  </Tarjeta>
                )}
                <Tarjeta titulo="Pistas por ejercicio" subtitulo={`Promedio por ${unidadSerie}`}>
                  <GraficaLinea x={xs} escala="num" series={[{ id: 'pistas', nombre: 'Pistas por ejercicio', valores: s.puntos.map((p) => p.pistasPorEjercicio) }]} />
                </Tarjeta>
              </div>
            </>
          )}
        </Seccion>
      )}

      {ver('temas') && (
        <Seccion id="temas" titulo="Temas y operaciones" nota={`La línea marca la meta del ${META} % de acierto al primer intento.`}>
          {!k.ejercicios ? (
            <Vacio />
          ) : (
            <>
              <Tarjeta titulo="Por operación" subtitulo="Acierto al primer intento. En azul, las que están por debajo de la meta." tabla={tablaDesglose(ops, 'Operación')}>
                <GraficaBarras
                  escala="pct"
                  max={100}
                  orden="original"
                  meta={{ valor: META, etiqueta: 'Meta' }}
                  categorias={ops.map((o) => ({ id: o.id, etiqueta: o.etiqueta, valor: o.primerIntento, n: o.ejercicios }))}
                  resaltar={ops.filter((o) => o.primerIntento !== null && o.primerIntento < META).map((o) => o.id)}
                />
              </Tarjeta>
              {(impreso ? pistasTema : pistaTemaElegida ? [pistaTemaElegida] : []).map((pt) => {
                const lista = temas.filter((t) => t.id.startsWith(`${pt}|`));
                return (
                  <Tarjeta
                    key={pt}
                    titulo={impreso && pistasTema.length > 1 ? `Por tema · ${nombrePista(pt)}` : 'Por tema'}
                    subtitulo={`Acierto al primer intento en cada tema de ${nombrePista(pt)} (niveles y pruebas). En azul, los que están por debajo de la meta.`}
                    acciones={selector(pistasTema, pt, setPistaTema, nombrePista)}
                    tabla={tablaDesglose(lista, 'Tema')}
                  >
                    <GraficaBarras
                      escala="pct"
                      max={100}
                      orden="original"
                      meta={{ valor: META, etiqueta: 'Meta' }}
                      categorias={lista.map((t) => ({ id: t.id, etiqueta: t.etiqueta, valor: t.primerIntento, n: t.ejercicios }))}
                      resaltar={lista.filter((t) => t.primerIntento !== null && t.primerIntento < META).map((t) => t.id)}
                    />
                  </Tarjeta>
                );
              })}
              {!deUnAlumno &&
                filas.length > 1 &&
                (impreso ? pistasJuego : pistaMapaElegida ? [pistaMapaElegida] : []).map((pt) => {
                  const m = pt === pistaMapaElegida && mapa ? mapa : mapaAlumnoTema(c, pt);
                  const quienes = filas.filter((f) => f.pista === pt);
                  if (!quienes.length) return null;
                  return (
                    <Tarjeta
                      key={pt}
                      titulo={impreso && pistasJuego.length > 1 ? `Usuario × tema · ${nombrePista(pt)}` : 'Usuario × tema'}
                      subtitulo={`Acierto al primer intento de cada usuario en cada tema de ${nombrePista(pt)}. Más oscuro = más bajo.`}
                      acciones={selector(pistasJuego, pt, setPistaMapa, nombrePista)}
                    >
                      <MapaCalor escala="pct" filas={quienes.map((f) => ({ id: f.id, etiqueta: f.nombre }))} columnas={m.temas} valor={(fila, col) => m.valor.get(`${fila}|${col}`) ?? null} alPulsarFila={impreso ? undefined : alPulsarAlumno} />
                    </Tarjeta>
                  );
                })}
            </>
          )}
        </Seccion>
      )}

      {ver('errores') && (
        <Seccion id="errores" titulo="Errores" nota="Tipo de error que la app detectó en la primera respuesta equivocada de cada ejercicio.">
          {!mErr.conError ? (
            <Vacio texto="No hay errores registrados con estos filtros." />
          ) : (
            <>
              <FilaKPI>
                <IndicadorKPI etiqueta="Ejercicios con error" valor={fmtNum(mErr.conError)} ayuda="Ejercicios en los que la primera respuesta fue equivocada." />
                <IndicadorKPI etiqueta="Tasa de error" valor={pctTxt((100 * mErr.conError) / Math.max(1, mErr.total))} />
                <IndicadorKPI etiqueta="Error más frecuente" valor={errores[0]?.nombre ?? '—'} ayuda={errores[0] ? `${fmtNum(errores[0].n)} veces (${fmtPct(errores[0].pct)} de los errores).` : undefined} />
              </FilaKPI>
              <Tarjeta titulo="Tipos de error" subtitulo="% de los ejercicios con error">
                <GraficaBarras escala="pct" categorias={errores.map((e) => ({ id: e.tipo, etiqueta: e.nombre, valor: e.pct, n: e.n }))} orden="valor" />
              </Tarjeta>
              {mErr.operaciones.length > 1 && (
                <Tarjeta titulo="Tipo de error × operación" subtitulo="Cantidad de ejercicios">
                  <MapaCalor escala="num" invertir filas={mErr.tipos} columnas={mErr.operaciones} valor={(t, o) => mErr.valor.get(`${t}|${o}`) ?? null} />
                </Tarjeta>
              )}
            </>
          )}
        </Seccion>
      )}

      {deUnAlumno && c.alumnos[0] && (!secciones || secciones.includes('temas')) && <RutaAlumno a={c.alumnos[0]} partidas={c.partidas} impreso={impreso} />}

      {ver('usuarios') && (
        <Seccion id="usuarios" titulo="Comparación de usuarios" nota="Toque una columna para ordenar y un nombre para ver su informe.">
          <TablaDatos<FilaAlumno>
            clave={(f) => f.id}
            filas={filas}
            ordenInicial={{ id: 'nombre' }}
            alPulsarFila={alPulsarAlumno && !impreso ? (f) => alPulsarAlumno(f.id) : undefined}
            vacio="No hay usuarios con estos filtros."
            columnas={[
              { id: 'nombre', titulo: 'Usuario', valor: (f) => f.nombre, ordenable: true },
              { id: 'grupo', titulo: 'Grupo', valor: (f) => nombreGrupo(f.grupo), ordenable: true },
              { id: 'nivel', titulo: 'Nivel', valor: (f) => f.nivelActual, formato: (x) => `${x}`, alinear: 'der', ordenable: true },
              { id: 'avance', titulo: 'Avance ruta', valor: (f) => f.avance, formato: (x) => pctTxt(x as number), alinear: 'der', ordenable: true },
              { id: 'ej', titulo: 'Ejercicios', valor: (f) => f.ejercicios, formato: (x) => fmtNum(Number(x)), alinear: 'der', ordenable: true },
              { id: 'primer', titulo: 'Acierto 1.er int.', valor: (f) => f.primerIntento, formato: (x) => pctTxt(x as number | null), alinear: 'der', ordenable: true },
              { id: 'tend', titulo: 'Tendencia', valor: (f) => f.tendencia, formato: (x) => (x === null ? '—' : fmtDelta(x as number, 'pts')), alinear: 'der', ordenable: true },
              { id: 'min', titulo: 'Minutos', valor: (f) => f.minutos, formato: (x) => fmtNum(Number(x)), alinear: 'der', ordenable: true },
              { id: 'dias', titulo: 'Días', valor: (f) => f.dias, alinear: 'der', ordenable: true },
              { id: 'pistas', titulo: 'Pistas/ej.', valor: (f) => f.pistasPorEjercicio, formato: (x) => dec(x as number | null), alinear: 'der', ordenable: true },
              { id: 'pre', titulo: 'Entrada', valor: (f) => f.antes, formato: (x) => pctTxt(x as number | null), alinear: 'der', ordenable: true },
              { id: 'post', titulo: 'Final', valor: (f) => f.despues, formato: (x) => pctTxt(x as number | null), alinear: 'der', ordenable: true },
              { id: 'debil', titulo: 'Le cuesta', valor: (f) => f.operacionDebil ?? '—' },
              { id: 'ultima', titulo: 'Última vez', valor: (f) => f.ultima, formato: (x) => (x ? fmtFechaCorta(String(x)) : 'Nunca'), ordenable: true },
              {
                id: 'alertas',
                titulo: 'Alertas',
                valor: (f) => f.alertas.length,
                ordenable: true,
                render: (f) => (f.alertas.length ? <Insignia tono={f.alertas.some((a) => a.tono === 'critico') ? 'critico' : f.alertas.some((a) => a.tono === 'grave') ? 'grave' : 'aviso'}>{f.alertas.length}</Insignia> : '—'),
              },
            ]}
          />
        </Seccion>
      )}
      {impreso && (
        <Seccion id="definiciones" titulo="Cómo se calcula cada métrica">
          <dl className="definiciones">
            {Object.values(DEFINICIONES).map((t) => {
              const [nombre, ...resto] = t.split(':');
              return (
                <div key={nombre}>
                  <dt>{nombre}</dt>
                  <dd>{resto.join(':').trim()}</dd>
                </div>
              );
            })}
          </dl>
        </Seccion>
      )}
    </div>
  );
}

/** Ruta del usuario nivel por nivel y sus últimas partidas (solo en el informe de una persona). */
function RutaAlumno({ a, partidas, impreso }: { a: Alumno; partidas: PartidaRemota[]; impreso?: boolean }) {
  const pista = a.informe.pista;
  const prog = progresoDe(a.fuente, pista);
  const niveles = Array.from({ length: nivelMaximo(pista) }, (_, i) => {
    const n = i + 1;
    const e = prog.niveles[n];
    return { n, tema: temaDe(pista, n).titulo, estrellas: e?.estrellas ?? 0, intentos: e?.intentos ?? 0, mejor: e?.mejorAciertos ?? null, estado: e?.completado ? 'Superado' : n === a.informe.nivelMaximo ? 'Jugando' : n < a.informe.nivelMaximo ? 'Superado' : 'Bloqueado' };
  });
  const ultimas = [...partidas].sort((x, y) => y.t.localeCompare(x.t)).slice(0, impreso ? 15 : 30);
  return (
    <Seccion id="ruta" titulo={`Ruta: ${nombrePista(pista)}`} nota="Estado de cada nivel (de todo el registro) y las últimas partidas del periodo.">
      <Tarjeta titulo="Niveles">
        <TablaDatos
          clave={(f) => String(f.n)}
          filas={niveles}
          columnas={[
            { id: 'n', titulo: 'Nivel', valor: (f) => f.n, formato: (x) => etiquetaNivel(pista, Number(x)), alinear: 'der' },
            { id: 'tema', titulo: 'Tema', valor: (f) => f.tema },
            { id: 'estado', titulo: 'Estado', valor: (f) => f.estado },
            { id: 'estrellas', titulo: 'Estrellas', valor: (f) => f.estrellas, formato: (x) => (Number(x) ? '★'.repeat(Number(x)) : '—') },
            { id: 'intentos', titulo: 'Intentos', valor: (f) => f.intentos, alinear: 'der' },
            { id: 'mejor', titulo: 'Mejor puntaje', valor: (f) => f.mejor, formato: (x) => (x === null ? '—' : `${x} de 10`), alinear: 'der' },
          ]}
        />
      </Tarjeta>
      <Tarjeta titulo="Últimas partidas">
        <TablaDatos
          clave={(p) => p.id}
          filas={ultimas}
          vacio="Sin partidas en el periodo."
          columnas={[
            { id: 't', titulo: 'Fecha', valor: (p) => p.t, formato: (x) => new Date(String(x)).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }) },
            { id: 'que', titulo: 'Actividad', valor: (p) => (p.tipo === 'nivel' ? `Nivel ${etiquetaNivel(p.pista as never, p.nivel ?? 1)}${p.repaso ? ' (repaso)' : ''}` : p.tipo === 'prueba-final' ? 'Prueba final' : 'Prueba de entrada') },
            { id: 'pts', titulo: 'Aciertos', valor: (p) => `${p.aciertos} de ${p.total}`, alinear: 'der' },
            { id: 'est', titulo: 'Estrellas', valor: (p) => p.estrellas, formato: (x) => (x === null ? '—' : Number(x) ? '★'.repeat(Number(x)) : '0') },
            { id: 'min', titulo: 'Minutos', valor: (p) => (p.ms_total ?? 0) / 60000, formato: (x) => fmtNum(Number(x), 1), alinear: 'der' },
          ]}
        />
      </Tarjeta>
    </Seccion>
  );
}

function tablaSerie(puntos: ReturnType<typeof serie>['puntos'], unidad: string) {
  return (
    <TablaDatos
      clave={(p) => p.desde}
      filas={puntos}
      columnas={[
        { id: 'desde', titulo: unidad === 'día' ? 'Día' : unidad === 'semana' ? 'Semana del' : 'Mes', valor: (p) => p.desde, formato: (x) => fmtFechaCorta(String(x)) },
        { id: 'ej', titulo: 'Ejercicios', valor: (p) => p.ejercicios, alinear: 'der' },
        { id: 'act', titulo: 'Usuarios activos', valor: (p) => p.activos, alinear: 'der' },
        { id: 'primer', titulo: 'Acierto 1.er intento', valor: (p) => p.primerIntento, formato: (x) => pctTxt(x as number | null), alinear: 'der' },
        { id: 'logro', titulo: 'Resueltos', valor: (p) => p.logro, formato: (x) => pctTxt(x as number | null), alinear: 'der' },
        { id: 'min', titulo: 'Minutos', valor: (p) => p.minutos, formato: (x) => fmtNum(Number(x)), alinear: 'der' },
      ]}
    />
  );
}
