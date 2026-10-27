// Informe global: cómo va cada grupo (grado, Familias, Inclusión) y todos los usuarios en una tabla.

import Icono from '../componentes/Icono';
import { nombresOperacion, OPERACIONES } from '../juego/informes';
import { BANDAS, nivelMaximo } from '../juego/motor';
import { nivelConTotal } from '../juego/complejidad';
import type { Banda } from '../juego/tipos';
import { useProfesor } from './contexto';
import { GRUPOS, nombreGrupo, resumenGrupo, type Alumno, type ResumenGrupo } from './informes';
import { BarraConteo, BarraPct, LeyendaPruebas, ParPruebas } from './Graficas';
import { hace } from './Usuarios';

const uno = (x: number | null, sufijo = '') => (x === null ? '—' : `${x.toFixed(1).replace('.', ',')}${sufijo}`);

function TarjetaGrupo({ r }: { r: ResumenGrupo }) {
  const maxBanda = Math.max(...Object.values(r.bandas));
  const maxError = Math.max(0, ...r.errores.map((e) => e.n));
  const ops = OPERACIONES.filter((o) => r.porOperacion[o]?.total);
  return (
    <section className="tarjeta columna grupo-informe" aria-label={r.nombre}>
      <h3 className="fila" style={{ margin: 0 }}>
        {r.nombre} <span className="chip">{r.usuarios} {r.usuarios === 1 ? 'usuario' : 'usuarios'}</span>
      </h3>
      <div className="cifras-panel">
        <div>
          <span>Jugaron esta semana</span>
          <strong>
            {r.activosSemana} <small>de {r.usuarios}</small>
          </strong>
        </div>
        <div>
          <span>Niveles superados (prom.)</span>
          <strong>
            {uno(r.superadosProm)} <small>de {r.nivelesRuta}</small>
          </strong>
        </div>
        <div>
          <span>Tiempo por ejercicio</span>
          <strong>{r.msPorEjercicio === null ? '—' : `${(r.msPorEjercicio / 1000).toFixed(1).replace('.', ',')} s`}</strong>
        </div>
        {r.grupo !== 'inclusion' && (
          <>
            <div>
              <span>Entrada (prom.)</span>
              <strong>
                {uno(r.diagnosticaProm)} <small>/10 · {r.conDiagnostica}</small>
              </strong>
            </div>
            <div>
              <span>Final (prom.)</span>
              <strong>
                {uno(r.finalProm)} <small>/10 · {r.conFinal}</small>
              </strong>
            </div>
            <div>
              <span>Mejora (prom.)</span>
              <strong>
                {r.gananciaProm === null ? '—' : `${r.gananciaProm >= 0 ? '+' : ''}${uno(r.gananciaProm)}`} <small>{r.pares} con ambas</small>
              </strong>
            </div>
          </>
        )}
      </div>

      {r.grupo !== 'inclusion' && r.conDiagnostica > 0 && (
        <div className="columna">
          <h4>Aciertos por tema</h4>
          <LeyendaPruebas />
          {r.porTema.map((t, k) => (
            <ParPruebas key={k} etiqueta={`${k + 1}. ${t.titulo}`} antes={t.antes} despues={t.despues} nAntes={t.nAntes} nDespues={t.nDespues} />
          ))}
          <p className="pequeno suave" style={{ margin: 0 }}>
            Porcentaje del grupo que respondió bien la pregunta de cada tema. Entre paréntesis, en la descripción de cada barra, cuántos hicieron la prueba.
          </p>
        </div>
      )}

      <div className="rejilla-panel">
        {r.grupo.startsWith('g') && r.conDiagnostica > 0 && (
          <div className="columna">
            <h4>Exigencia según la prueba de entrada</h4>
            {(Object.keys(BANDAS) as Banda[]).map((b) => (
              <BarraConteo key={b} etiqueta={BANDAS[b].nombre} valor={r.bandas[b]} maximo={maxBanda} />
            ))}
          </div>
        )}
        <div className="columna">
          <h4>Aciertos por operación</h4>
          {ops.length === 0 && <p className="pequeno suave" style={{ margin: 0 }}>Aún no hay ejercicios.</p>}
          {ops.map((o) => {
            const v = r.porOperacion[o]!;
            return <BarraPct key={o} etiqueta={nombresOperacion[o]} valor={(100 * v.aciertos) / v.total} detalle={`${v.total} ej.`} />;
          })}
        </div>
        {r.errores.length > 0 && (
          <div className="columna">
            <h4>Errores más frecuentes</h4>
            {r.errores.slice(0, 5).map((e) => (
              <BarraConteo key={e.tipo} etiqueta={e.nombre} valor={e.n} maximo={maxError} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TablaUsuarios({ alumnos }: { alumnos: Alumno[] }) {
  const { abrirDetalle } = useProfesor();
  return (
    <div className="tabla-scroll">
      <table className="tabla-panel">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Grupo</th>
            <th scope="col">Nivel</th>
            <th scope="col">★</th>
            <th scope="col">% aciertos</th>
            {OPERACIONES.slice(0, 4).map((o) => (
              <th key={o} scope="col">
                % {nombresOperacion[o].slice(0, 5)}.
              </th>
            ))}
            <th scope="col">Entrada → final</th>
            <th scope="col">Exigencia</th>
            <th scope="col">Jugó</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((a) => {
            const i = a.informe;
            return (
              <tr key={a.fila.id}>
                <th scope="row">
                  <button type="button" className="boton enlace" onClick={() => abrirDetalle(a.fila.id)}>
                    {a.fila.nombre}
                  </button>
                </th>
                <td>{nombreGrupo(a.grupo)}</td>
                <td>{nivelConTotal(i.pista, Math.min(i.nivelMaximo, nivelMaximo(i.pista)))}</td>
                <td>{i.estrellas}</td>
                <td>{i.ejercicios ? `${Math.round((100 * i.aciertos) / i.ejercicios)} %` : '—'}</td>
                {OPERACIONES.slice(0, 4).map((o) => (
                  <td key={o}>{i.porcentajes[o] ? `${i.porcentajes[o]!.pct} %` : '—'}</td>
                ))}
                <td>{i.diagnostica === null ? '—' : `${i.diagnostica} → ${i.final ?? '…'}`}</td>
                <td>{i.banda ? BANDAS[i.banda].nombre : '—'}</td>
                <td>{hace(a.ultimaActividad)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Contenido del informe global (en pantalla y en papel). */
export function InformeGlobal({ alumnos }: { alumnos: Alumno[] }) {
  const activos = alumnos.filter((a) => a.fila.activo);
  const grupos = GRUPOS.map((g) => resumenGrupo(alumnos, g.id)).filter((r) => r.usuarios > 0);
  const semana = activos.filter((a) => a.activoSemana).length;
  const pares = activos.filter((a) => a.informe.diagnostica !== null && a.informe.final !== null);
  const ganancia = pares.length ? pares.reduce((s, a) => s + a.informe.final! - a.informe.diagnostica!, 0) / pares.length : null;
  return (
    <div className="columna">
      <section className="cifras-panel grande" aria-label="Resumen general">
        <div>
          <span>Usuarios activos</span>
          <strong>{activos.length}</strong>
        </div>
        <div>
          <span>Jugaron esta semana</span>
          <strong>{semana}</strong>
        </div>
        <div>
          <span>Hicieron la entrada</span>
          <strong>{activos.filter((a) => a.informe.diagnostica !== null).length}</strong>
        </div>
        <div>
          <span>Hicieron la final</span>
          <strong>{activos.filter((a) => a.informe.final !== null).length}</strong>
        </div>
        <div>
          <span>Mejora promedio</span>
          <strong>{ganancia === null ? '—' : `${ganancia >= 0 ? '+' : ''}${uno(ganancia)}`}</strong>
          <small>{pares.length} con ambas pruebas</small>
        </div>
      </section>
      {grupos.map((r) => (
        <TarjetaGrupo key={r.grupo} r={r} />
      ))}
      <section className="tarjeta columna">
        <h3>Todos los usuarios</h3>
        <TablaUsuarios alumnos={activos} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Los porcentajes no son notas escolares: muestran en qué conviene reforzar. Los datos llegan cuando cada celular tiene señal.
        </p>
      </section>
    </div>
  );
}

export default function Informe() {
  const { alumnos, imprimir } = useProfesor();
  if (!alumnos.some((a) => a.fila.activo)) {
    return (
      <main className="pantalla panel-pantalla">
        <p className="tarjeta">Cuando cree usuarios y empiecen a jugar, aquí verá cómo va cada grupo.</p>
      </main>
    );
  }
  return (
    <main className="pantalla panel-pantalla">
      <div className="fila panel-acciones">
        <button
          type="button"
          className="boton"
          onClick={() =>
            imprimir(
              'Informe global',
              <div className="impreso">
                <header className="impreso-cabeza">
                  <h1>Informe global · La Finca Matemática</h1>
                  <p>Generado el {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </header>
                <InformeGlobal alumnos={alumnos} />
              </div>,
            )
          }
        >
          <Icono nombre="imprimir" tamano={22} /> Informe global en PDF
        </button>
      </div>
      <InformeGlobal alumnos={alumnos} />
    </main>
  );
}
