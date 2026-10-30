// Barra de filtros de los informes: una sola fila arriba de todo, y todo lo de abajo la respeta.
// Periodo primero (con atajos), luego grupo, usuarios, operación y tipo de actividad.

import { useMemo, useState } from 'react';
import Icono from '../../componentes/Icono';
import type { Operacion } from '../../juego/tipos';
import { nombresOperacion, OPERACIONES } from '../../juego/informes';
import { GRUPOS, type Alumno, type Grupo } from '../informes';
import { FILTROS_INICIALES, rangoDePeriodo, type Actividad, type Filtros, type Periodo } from '../metricas';

const PERIODOS: { id: Periodo; texto: string }[] = [
  { id: '7', texto: '7 días' },
  { id: '30', texto: '30 días' },
  { id: '90', texto: '90 días' },
  { id: 'mes', texto: 'Este mes' },
  { id: 'todo', texto: 'Todo' },
  { id: 'personalizado', texto: 'Fechas…' },
];

const alternar = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);

type Props = {
  filtros: Filtros;
  periodo: Periodo;
  alCambiar: (f: Filtros, periodo: Periodo) => void;
  alumnos: Alumno[];
  /** Informe de un solo usuario: sin grupo ni selección de usuarios. */
  deUnAlumno?: boolean;
  resumen?: string;
};

export default function FiltrosBarra({ filtros: f, periodo, alCambiar, alumnos, deUnAlumno, resumen }: Props) {
  const [buscar, setBuscar] = useState('');
  const grupos = useMemo(() => GRUPOS.filter((g) => alumnos.some((a) => a.grupo === g.id)), [alumnos]);
  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return alumnos
      .filter((a) => (f.inactivos || a.fila.activo) && (!f.grupos.length || f.grupos.includes(a.grupo)))
      .filter((a) => !q || a.fila.nombre.toLowerCase().includes(q) || a.fila.usuario.includes(q));
  }, [alumnos, buscar, f.grupos, f.inactivos]);
  const cambiar = (parcial: Partial<Filtros>, p: Periodo = periodo) => alCambiar({ ...f, ...parcial }, p);
  const elegirPeriodo = (p: Periodo) => (p === 'personalizado' ? cambiar({}, p) : cambiar(rangoDePeriodo(p), p));
  const [abierto] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 700px)').matches);
  const activos = [periodo !== 'todo', f.grupos.length > 0, f.alumnos.length > 0, f.operaciones.length > 0, f.actividad !== 'todo', f.inactivos].filter(Boolean).length;
  const hayFiltros = f.desde || f.hasta || f.grupos.length || f.alumnos.length || f.operaciones.length || f.actividad !== 'todo' || f.inactivos;

  return (
    <details className="filtros-plegable tarjeta" open={abierto}>
      <summary>
        <span className="filtro-titulo">Filtros{activos ? ` · ${activos} aplicados` : ''}</span>
        {resumen && <span className="pequeno suave">{resumen}</span>}
      </summary>
    <section className="filtros-informe" aria-label="Filtros del informe">
      <div className="filtro-bloque">
        <span className="filtro-titulo">Periodo</span>
        <div className="segmentado" role="radiogroup" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={periodo === p.id} className={periodo === p.id ? 'activo' : ''} onClick={() => elegirPeriodo(p.id)}>
              {p.texto}
            </button>
          ))}
        </div>
        {periodo === 'personalizado' && (
          <div className="fila fechas-filtro">
            <label>
              Desde <input type="date" className="campo" value={f.desde ?? ''} max={f.hasta ?? undefined} onChange={(e) => cambiar({ desde: e.target.value || null })} />
            </label>
            <label>
              Hasta <input type="date" className="campo" value={f.hasta ?? ''} min={f.desde ?? undefined} onChange={(e) => cambiar({ hasta: e.target.value || null })} />
            </label>
          </div>
        )}
      </div>

      {!deUnAlumno && grupos.length > 1 && (
        <div className="filtro-bloque">
          <span className="filtro-titulo">Grupo</span>
          <div className="filtros" role="group" aria-label="Grupos">
            {grupos.map((g) => (
              <button key={g.id} type="button" className="chip filtro" aria-pressed={f.grupos.includes(g.id)} onClick={() => cambiar({ grupos: alternar<Grupo>(f.grupos, g.id), alumnos: [] })}>
                {g.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {!deUnAlumno && (
        <details className="filtro-bloque filtro-usuarios">
          <summary>
            <span className="filtro-titulo">Usuarios</span>
            <span className="pequeno">{f.alumnos.length ? `${f.alumnos.length} elegidos` : 'Todos'}</span>
          </summary>
          <div className="columna" style={{ gap: 8 }}>
            <div className="fila" style={{ gap: 8 }}>
              <input type="search" className="campo" placeholder="Buscar por nombre o usuario" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar usuario" />
              {f.alumnos.length > 0 && (
                <button type="button" className="boton plano pequeno" onClick={() => cambiar({ alumnos: [] })}>
                  Todos
                </button>
              )}
            </div>
            <div className="lista-marcar">
              {visibles.map((a) => (
                <label key={a.fila.id}>
                  <input type="checkbox" checked={f.alumnos.includes(a.fila.id)} onChange={() => cambiar({ alumnos: alternar(f.alumnos, a.fila.id) })} />
                  <span>{a.fila.nombre}</span>
                </label>
              ))}
              {!visibles.length && <span className="pequeno suave">Nadie con ese nombre.</span>}
            </div>
          </div>
        </details>
      )}

      <div className="filtro-bloque">
        <span className="filtro-titulo">Operación</span>
        <div className="filtros" role="group" aria-label="Operaciones">
          {OPERACIONES.map((o) => (
            <button key={o} type="button" className="chip filtro" aria-pressed={f.operaciones.includes(o)} onClick={() => cambiar({ operaciones: alternar<Operacion>(f.operaciones, o) })}>
              {nombresOperacion[o]}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro-bloque">
        <span className="filtro-titulo">Actividad</span>
        <div className="segmentado" role="radiogroup" aria-label="Tipo de actividad">
          {(
            [
              ['todo', 'Todo'],
              ['niveles', 'Niveles'],
              ['pruebas', 'Pruebas'],
            ] as [Actividad, string][]
          ).map(([id, texto]) => (
            <button key={id} type="button" role="radio" aria-checked={f.actividad === id} className={f.actividad === id ? 'activo' : ''} onClick={() => cambiar({ actividad: id })}>
              {texto}
            </button>
          ))}
        </div>
        {!deUnAlumno && (
          <label className="pequeno marcar-inactivos">
            <input type="checkbox" checked={f.inactivos} onChange={(e) => cambiar({ inactivos: e.target.checked })} /> Incluir cuentas desactivadas
          </label>
        )}
      </div>

      <div className="filtro-pie">
        {resumen && <span className="pequeno suave">{resumen}</span>}
        {hayFiltros ? (
          <button type="button" className="boton plano pequeno" onClick={() => alCambiar(FILTROS_INICIALES, 'todo')}>
            <Icono nombre="repetir" tamano={18} /> Quitar filtros
          </button>
        ) : null}
      </div>
    </section>
    </details>
  );
}
