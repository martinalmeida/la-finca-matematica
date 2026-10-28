// Informe uno a uno: progreso, pruebas, operaciones, errores, tiempo y actividad de un usuario,
// con las acciones de gestión de su cuenta.

import { useState } from 'react';
import Icono from '../componentes/Icono';
import FotoPerfil from '../componentes/FotoPerfil';
import Comparacion from '../componentes/Comparacion';
import { pruebasDe, progresoDe, type Pruebas } from '../almacenamiento/datos';
import { BANDAS, nivelMaximo, temaDe } from '../juego/motor';
import { etiquetaNivel, RESUMEN_GRADO } from '../juego/complejidad';
import { nombresOperacion, OPERACIONES } from '../juego/informes';
import { bandaPorPuntaje } from '../juego/pruebas';
import type { Banda, Pista } from '../juego/tipos';
import { descargar, fechaArchivo } from './descargas';
import * as api from './api';
import { useProfesor } from './contexto';
import { csvEventos, csvPartidas, pistaPruebasDe, type Alumno } from './informes';
import { Actividad, BarraConteo, BarraPct } from './Graficas';
import { CambiarClave, Confirmar, detalleCuenta, EditarUsuario, hace } from './Usuarios';

const segundos = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** Días con partidas (o con ejercicios, según el resumen) → cuántas partidas hubo. */
function diasDe(a: Alumno): Map<string, number> {
  const dias = new Map<string, number>();
  for (const d of a.informe.diasJugados) dias.set(d, Math.max(dias.get(d) ?? 0, 1));
  const porPartida = new Map<string, number>();
  for (const p of a.partidas) {
    const d = new Date(p.t).toLocaleDateString('en-CA');
    porPartida.set(d, (porPartida.get(d) ?? 0) + 1);
  }
  for (const [d, n] of porPartida) dias.set(d, n);
  return dias;
}

/** Contenido del informe (en pantalla y en papel). */
export function InformeUsuario({ a, impreso = false }: { a: Alumno; impreso?: boolean }) {
  const i = a.informe;
  const pruebas: Pruebas = pruebasDe(a.perfil, a.fuente);
  const progreso = progresoDe(a.fuente, i.pista);
  const maximo = nivelMaximo(i.pista);
  const actual = Math.min(i.nivelMaximo, maximo);
  const pctTotal = i.ejercicios ? Math.round((100 * i.aciertos) / i.ejercicios) : null;
  const ultimas = a.partidas.slice(-15).reverse();
  const maxError = Math.max(0, ...i.errores.map((e) => e.n));

  return (
    <div className="columna informe-usuario">
      <section className="cifras-panel" aria-label="Resumen">
        <div>
          <span>Nivel actual</span>
          <strong>{etiquetaNivel(i.pista, actual)}</strong>
          <small>
            {i.superados} de {maximo} superados
          </small>
        </div>
        <div>
          <span>Aciertos en niveles</span>
          <strong>{pctTotal === null ? '—' : `${pctTotal} %`}</strong>
          <small>{i.ejercicios} ejercicios</small>
        </div>
        <div>
          <span>Estrellas</span>
          <strong>{i.estrellas}</strong>
          <small>{i.semillas} semillas</small>
        </div>
        <div>
          <span>Tiempo por ejercicio</span>
          <strong>{segundos(a.msPorEjercicio)}</strong>
          <small>{a.partidas.length} partidas</small>
        </div>
        <div>
          <span>Días que jugó</span>
          <strong>{a.diasActivos.length}</strong>
          <small>última vez {hace(a.ultimaActividad)}</small>
        </div>
        {i.pasoAPaso > 0 && (
          <div>
            <span>Con paso a paso</span>
            <strong>{i.pasoAPaso}</strong>
            <small>ejercicios</small>
          </div>
        )}
      </section>

      {a.perfil.grado !== 'inclusion' && (
        <section className="tarjeta columna">
          <h3>Prueba de entrada y prueba final</h3>
          {!pruebas.diagnostica && <p style={{ margin: 0 }}>Aún no ha hecho la prueba de entrada.</p>}
          {pruebas.diagnostica && !pruebas.final && (
            <p style={{ margin: 0 }}>
              Entrada: <strong>{pruebas.diagnostica.aciertos} de {pruebas.diagnostica.total}</strong> ({fechaCorta(pruebas.diagnostica.fecha)}). La final se habilita al superar el nivel {maximo}.
            </p>
          )}
          {pruebas.diagnostica && pruebas.final && (
            <>
              <p className="pequeno suave" style={{ margin: 0 }}>
                Entrada el {fechaCorta(pruebas.diagnostica.fecha)} · final el {fechaCorta(pruebas.final.fecha)}
              </p>
              <Comparacion diagnostica={pruebas.diagnostica} final={pruebas.final} adulto />
            </>
          )}
          {pruebas.diagnostica && !impreso && (
            <p className="pequeno suave" style={{ margin: 0 }}>
              {a.perfil.rol === 'familia'
                ? `Cuaderno asignado por la prueba de entrada: ${RESUMEN_GRADO[i.pista].nombre}.`
                : `La prueba de entrada asignó la exigencia ${BANDAS[bandaPorPuntaje(pruebas.diagnostica.aciertos, pruebas.diagnostica.total)].nombre}.`}
            </p>
          )}
        </section>
      )}

      <section className="tarjeta columna">
        <h3>Ruta nivel por nivel · {RESUMEN_GRADO[i.pista].nombre}</h3>
        <div className="tabla-scroll">
          <table className="tabla-panel apilable tabla-ruta">
            <thead>
              <tr>
                <th scope="col">Nivel</th>
                <th scope="col">Tema</th>
                <th scope="col">Estrellas</th>
                <th scope="col">Intentos</th>
                <th scope="col">Mejor puntaje</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maximo }, (_, k) => k + 1).map((n) => {
                const e = progreso.niveles[n];
                const estado = e?.completado ? 'Superado' : n <= progreso.nivelMaximoDesbloqueado ? (e ? 'En curso' : 'Abierto') : 'Bloqueado';
                return (
                  <tr key={n} className={estado === 'Bloqueado' ? 'apagada' : ''}>
                    <th scope="row">{etiquetaNivel(i.pista, n)}</th>
                    <td className="celda-titulo">{temaDe(i.pista, n).titulo}</td>
                    <td data-etiqueta="Estrellas" aria-label={`${e?.estrellas ?? 0} estrellas`}>{e ? '★'.repeat(e.estrellas) + '☆'.repeat(3 - e.estrellas) : '—'}</td>
                    <td data-etiqueta="Intentos">{e?.intentos ?? 0}</td>
                    <td data-etiqueta="Mejor puntaje">{e ? `${e.mejorAciertos} de 10` : '—'}</td>
                    <td data-etiqueta="Estado">{estado}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rejilla-panel">
        <section className="tarjeta columna">
          <h3>Aciertos por operación</h3>
          {OPERACIONES.filter((o) => i.porcentajes[o]).length === 0 && <p style={{ margin: 0 }}>Aún no hay ejercicios.</p>}
          {OPERACIONES.filter((o) => i.porcentajes[o]).map((o) => (
            <BarraPct key={o} etiqueta={nombresOperacion[o]} valor={i.porcentajes[o]!.pct} detalle={`${i.porcentajes[o]!.total} ej.`} />
          ))}
          {i.masCuesta.length > 0 && (
            <p className="pequeno" style={{ margin: 0 }}>
              Le cuesta más: <strong>{i.masCuesta.map((o) => nombresOperacion[o].toLowerCase()).join(' y ')}</strong>.
            </p>
          )}
        </section>
        <section className="tarjeta columna">
          <h3>Errores más frecuentes</h3>
          {i.errores.length === 0 && <p style={{ margin: 0 }}>Sin errores identificados todavía.</p>}
          {i.errores.slice(0, 6).map((e) => (
            <BarraConteo key={e.tipo} etiqueta={e.nombre} valor={e.n} maximo={maxError} />
          ))}
        </section>
      </div>

      <section className="tarjeta columna">
        <h3>Actividad</h3>
        <Actividad dias={diasDe(a)} />
      </section>

      <section className="tarjeta columna">
        <h3>Últimas partidas</h3>
        {ultimas.length === 0 ? (
          <p style={{ margin: 0 }}>Aún no hay partidas sincronizadas.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-panel apilable">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Qué</th>
                  <th scope="col">Aciertos</th>
                  <th scope="col">Estrellas</th>
                  <th scope="col">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {ultimas.map((p) => (
                  <tr key={p.id}>
                    <td className="celda-titulo">{new Date(p.t).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
                    <td data-etiqueta="Qué">
                      {p.tipo === 'nivel' ? `Nivel ${etiquetaNivel(p.pista as Pista, p.nivel ?? 1)}${p.repaso ? ' (repaso)' : ''}` : p.tipo === 'prueba-diagnostica' ? 'Prueba de entrada' : 'Prueba final'}
                    </td>
                    <td data-etiqueta="Aciertos">
                      {p.aciertos} de {p.total}
                    </td>
                    <td data-etiqueta="Estrellas">{p.estrellas ?? '—'}</td>
                    <td data-etiqueta="Tiempo">{Math.round((p.ms_total ?? 0) / 1000)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Detalle({ a }: { a: Alumno }) {
  const { abrirDetalle, ejecutar, recargar, imprimir, alumnos, fotos } = useProfesor();
  const [hoja, setHoja] = useState<null | 'editar' | 'clave' | 'reiniciar' | 'eliminar'>(null);
  const [exportando, setExportando] = useState(false);
  const pistaPruebas = pistaPruebasDe(a);
  const pruebas = pruebasDe(a.perfil, a.fuente);
  const bandaFijada = a.fila.bandas?.[pistaPruebas] ?? null;
  const esEstudiante = a.fila.tipo === 'estudiante';

  const cambiarBanda = async (valor: string) => {
    const banda = valor === 'auto' ? null : (valor as Banda);
    if (await ejecutar(() => api.fijarBanda(a.fila.id, pistaPruebas, banda), banda ? `Exigencia: ${BANDAS[banda].nombre}` : 'Exigencia según la prueba de entrada')) await recargar();
  };

  const exportar = async () => {
    setExportando(true);
    try {
      const eventos = await api.cargarEventos(a.fila.id);
      descargar(`finca-${a.fila.usuario}-ejercicios-${fechaArchivo()}.csv`, csvEventos(eventos, alumnos), 'text/csv');
      descargar(`finca-${a.fila.usuario}-partidas-${fechaArchivo()}.csv`, csvPartidas([a]), 'text/csv');
    } catch (e) {
      void ejecutar(() => Promise.reject(e));
    } finally {
      setExportando(false);
    }
  };

  return (
    <main className="pantalla panel-pantalla">
      <header className="detalle-cabeza vidrio">
        <button type="button" className="boton icono" onClick={() => abrirDetalle(null)} aria-label="Volver a la lista">
          <Icono nombre="atras" tamano={24} />
        </button>
        <span className="anillo-avatar">{fotos[a.fila.id] || a.fila.avatar ? <FotoPerfil url={fotos[a.fila.id] ?? null} avatar={a.fila.avatar ?? ''} tamano={56} etiqueta="" /> : <Icono nombre="personas" tamano={40} anim="no" />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{a.fila.nombre}</h2>
          <div className="pequeno suave">
            {a.fila.usuario} · {detalleCuenta(a.fila)}
            {!a.fila.activo && <span className="chip chip-alerta">Desactivado</span>}
          </div>
          <div className="pequeno suave">
            Creado {fechaCorta(a.fila.creado)} · última sincronización {a.fila.ultima_sync ? hace(a.fila.ultima_sync) : 'nunca'}
          </div>
        </div>
      </header>

      <section className="fila panel-acciones" aria-label="Acciones">
        <button type="button" className="boton" onClick={() => setHoja('editar')}>
          <Icono nombre="lapiz" tamano={22} /> Editar tipo y grado
        </button>
        <button type="button" className="boton" onClick={() => setHoja('clave')}>
          <Icono nombre="candado" tamano={22} /> Cambiar contraseña
        </button>
        <button type="button" className="boton" onClick={() => imprimir(`Informe de ${a.fila.nombre}`, <InformeImpreso a={a} />)}>
          <Icono nombre="imprimir" tamano={22} /> Informe PDF
        </button>
        <button type="button" className="boton" onClick={exportar} disabled={exportando}>
          <Icono nombre="guardar" tamano={22} /> {exportando ? 'Preparando…' : 'Datos CSV'}
        </button>
        {a.fila.foto && (
          <button
            type="button"
            className="boton"
            onClick={async () => {
              if (window.confirm(`¿Quitar la foto de ${a.fila.nombre}? Volverá a verse su personaje.`) && (await ejecutar(() => api.quitarFoto(a.fila.id), 'Foto quitada'))) await recargar();
            }}
          >
            <Icono nombre="camara" tamano={22} /> Quitar foto
          </button>
        )}
      </section>

      {esEstudiante && (
        <section className="tarjeta columna">
          <h3>Exigencia y prueba final</h3>
          <label className="fila" style={{ gap: 10 }}>
            <span style={{ flex: '1 1 180px' }}>Exigencia en {a.fila.grado}.º</span>
            <select className="campo" style={{ flex: '1 1 200px' }} value={bandaFijada ?? 'auto'} onChange={(e) => void cambiarBanda(e.target.value)}>
              <option value="auto">Según la prueba de entrada{a.informe.banda && !bandaFijada ? ` (${BANDAS[a.informe.banda].nombre})` : ''}</option>
              {(Object.keys(BANDAS) as Banda[]).map((b) => (
                <option key={b} value={b}>
                  {BANDAS[b].nombre}: pasa con {BANDAS[b].aprobar} de 10
                </option>
              ))}
            </select>
          </label>
          <p className="pequeno suave" style={{ margin: 0 }}>
            Refuerzo: números más pequeños, dos opciones, el dibujo de ayuda visible y voz más lenta. Avanzado: números más grandes. El cambio llega al celular la próxima vez que tenga señal.
          </p>
          {pruebas.final && (
            <button
              type="button"
              className="boton"
              disabled={pruebas.repetirFinal}
              onClick={async () => {
                if (await ejecutar(() => api.permitirFinal(a.fila.id, pistaPruebas), 'Podrá repetir la prueba final')) await recargar();
              }}
            >
              <Icono nombre="repetir" tamano={22} /> {pruebas.repetirFinal ? 'Ya puede repetir la prueba final' : 'Permitir repetir la prueba final'}
            </button>
          )}
        </section>
      )}

      <InformeUsuario a={a} />

      <section className="tarjeta columna zona-peligro" aria-label="Cuenta">
        <h3>Cuenta</h3>
        <div className="fila">
          <button
            type="button"
            className="boton"
            onClick={async () => {
              const activar = !a.fila.activo;
              if (!activar && !window.confirm(`¿Desactivar a ${a.fila.nombre}? No podrá entrar hasta que la active de nuevo. Sus resultados se conservan.`)) return;
              if (await ejecutar(() => api.fijarActivo(a.fila.id, activar), activar ? 'Cuenta activada' : 'Cuenta desactivada')) await recargar();
            }}
          >
            <Icono nombre={a.fila.activo ? 'pausa' : 'jugar-simple'} tamano={22} /> {a.fila.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" className="boton" onClick={() => setHoja('reiniciar')}>
            <Icono nombre="repetir" tamano={22} /> Reiniciar progreso
          </button>
          <button type="button" className="boton peligro" onClick={() => setHoja('eliminar')}>
            <Icono nombre="equis" tamano={22} /> Eliminar
          </button>
        </div>
      </section>

      {hoja === 'editar' && <EditarUsuario a={a} alCerrar={() => setHoja(null)} />}
      {hoja === 'clave' && <CambiarClave a={a} alCerrar={() => setHoja(null)} />}
      {(hoja === 'reiniciar' || hoja === 'eliminar') && <Confirmar a={a} accion={hoja} alCerrar={() => setHoja(null)} />}
    </main>
  );
}

export function InformeImpreso({ a }: { a: Alumno }) {
  return (
    <div className="impreso">
      <header className="impreso-cabeza">
        <h1>Informe individual · La Finca Matemática</h1>
        <p>
          <strong>{a.fila.nombre}</strong> ({a.fila.usuario}) · {detalleCuenta(a.fila)} · generado el {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>
      <InformeUsuario a={a} impreso />
    </div>
  );
}
