// Barra de filtros de los informes: una fila de botones (Periodo, Grupo, Usuarios, Operación,
// Actividad) que abren su panel de opciones, y debajo los filtros aplicados como chips que se
// quitan con un toque. Todo lo de abajo respeta los filtros. En el celular cada panel sale como
// una hoja desde abajo.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icono, { type NombreIcono } from '../../componentes/Icono';
import type { Operacion } from '../../juego/tipos';
import { nombresOperacion, OPERACIONES } from '../../juego/informes';
import { GRUPOS, nombreGrupo, type Alumno, type Grupo } from '../informes';
import type { EventoRemoto } from '../api';
import { diaDe, FILTROS_INICIALES, rangoDePeriodo, type Actividad, type Filtros, type Periodo } from '../metricas';
import { fmtNum } from '../graficas/formato';

type Panel = 'periodo' | 'grupo' | 'usuarios' | 'operacion' | 'actividad';

const PERIODOS: { id: Exclude<Periodo, 'personalizado'>; texto: string }[] = [
  { id: '7', texto: 'Últimos 7 días' },
  { id: '30', texto: 'Últimos 30 días' },
  { id: '90', texto: 'Últimos 90 días' },
  { id: 'mes', texto: 'Este mes' },
  { id: 'todo', texto: 'Todo el registro' },
];

const ACTIVIDADES: { id: Actividad; texto: string; detalle: string }[] = [
  { id: 'todo', texto: 'Todo', detalle: 'Niveles y pruebas' },
  { id: 'niveles', texto: 'Solo niveles', detalle: 'Práctica en la ruta' },
  { id: 'pruebas', texto: 'Solo pruebas', detalle: 'Entrada y final' },
];

const alternar = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);

const fechaCorta = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fechaLarga = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const rangoTexto = (desde: string | null, hasta: string | null) =>
  desde && hasta ? `${fechaCorta(desde)} – ${fechaLarga(hasta)}` : desde ? `Desde el ${fechaLarga(desde)}` : hasta ? `Hasta el ${fechaLarga(hasta)}` : 'Todo el registro';

type Props = {
  filtros: Filtros;
  periodo: Periodo;
  alCambiar: (f: Filtros, periodo: Periodo) => void;
  alumnos: Alumno[];
  eventos: EventoRemoto[];
  /** Informe de un solo usuario: sin grupo ni selección de usuarios. */
  deUnAlumno?: boolean;
  resumen?: string;
  /** Botones a la derecha de la fila (PDF, Excel). */
  acciones?: ReactNode;
};

const conPortal = (aBody: boolean, nodo: ReactNode) => (aBody ? createPortal(nodo, document.body) : nodo);

/** Botón de la fila con su panel desplegable. */
function Desplegable({ id, abierto, alAbrir, icono, titulo, valor, activo, children }: { id: Panel; abierto: boolean; alAbrir: (p: Panel | null) => void; icono: NombreIcono; titulo: string; valor: string; activo: boolean; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [derecha, setDerecha] = useState(false);
  // En el celular el panel es una hoja desde abajo: va directo al <body> para quedar encima de las
  // pestañas (un contenedor con su propio apilamiento la dejaría debajo, sin importar el z-index).
  const [hoja] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 699px)').matches);
  useEffect(() => {
    if (!abierto) return;
    // Si el panel se saldría por la derecha, se alinea al borde derecho del botón.
    const r = caja.current?.getBoundingClientRect();
    if (r) setDerecha(r.left + 340 > window.innerWidth - 12);
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!caja.current?.contains(t) && !panel.current?.contains(t)) alAbrir(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        alAbrir(null);
        caja.current?.querySelector<HTMLButtonElement>('.filtro-boton')?.focus();
      }
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto, alAbrir]);
  return (
    <div className="filtro-desplegable" ref={caja}>
      <button type="button" className={`filtro-boton ${activo ? 'activo' : ''}`} aria-expanded={abierto} aria-controls={`panel-${id}`} onClick={() => alAbrir(abierto ? null : id)}>
        <Icono nombre={icono} tamano={18} anim="no" />
        <span className="filtro-boton-textos">
          <span className="filtro-boton-titulo">{titulo}</span>
          <span className="filtro-boton-valor">{valor}</span>
        </span>
        <span className="filtro-flecha" aria-hidden="true" />
      </button>
      {abierto && conPortal(
        hoja,
        <>
          <div className="filtro-velo" aria-hidden="true" />
          <div ref={panel} id={`panel-${id}`} className={`filtro-panel ${derecha ? 'a-la-derecha' : ''} ${hoja ? 'filtro-hoja' : ''}`} role="dialog" aria-label={titulo}>
            <div className="filtro-panel-cabeza">
              <strong>{titulo}</strong>
              <button type="button" className="filtro-cerrar" onClick={() => alAbrir(null)} aria-label="Cerrar">
                <Icono nombre="cerrar" tamano={18} anim="no" />
              </button>
            </div>
            {children}
          </div>
        </>,
      )}
    </div>
  );
}

/** Opción de una lista: casilla (varias) o radio (una), con marca de verificación y conteo. */
function Opcion({ marcada, alPulsar, texto, detalle, cuenta, tipo = 'casilla' }: { marcada: boolean; alPulsar: () => void; texto: string; detalle?: string; cuenta?: number; tipo?: 'casilla' | 'radio' }) {
  return (
    <button type="button" role={tipo === 'radio' ? 'menuitemradio' : 'menuitemcheckbox'} aria-checked={marcada} className={`filtro-opcion ${marcada ? 'marcada' : ''}`} onClick={alPulsar}>
      <span className={`filtro-marca ${tipo}`} aria-hidden="true">
        {marcada && <Icono nombre="check" tamano={14} anim="no" />}
      </span>
      <span className="filtro-opcion-textos">
        <span>{texto}</span>
        {detalle && <span className="pequeno suave">{detalle}</span>}
      </span>
      {cuenta !== undefined && <span className="filtro-cuenta">{fmtNum(cuenta)}</span>}
    </button>
  );
}

export default function FiltrosBarra({ filtros: f, periodo, alCambiar, alumnos, eventos, deUnAlumno, resumen, acciones }: Props) {
  const [abierto, setAbierto] = useState<Panel | null>(null);
  const [buscar, setBuscar] = useState('');
  const [desde, setDesde] = useState(f.desde ?? '');
  const [hasta, setHasta] = useState(f.hasta ?? '');
  useEffect(() => {
    setDesde(f.desde ?? '');
    setHasta(f.hasta ?? '');
  }, [f.desde, f.hasta]);

  const cambiar = (parcial: Partial<Filtros>, p: Periodo = periodo) => alCambiar({ ...f, ...parcial }, p);

  // Conteos para orientar: usuarios por grupo y ejercicios por operación (con los demás filtros).
  const visiblesTodos = useMemo(() => alumnos.filter((a) => f.inactivos || a.fila.activo), [alumnos, f.inactivos]);
  const porGrupo = useMemo(() => {
    const m = new Map<Grupo, number>();
    for (const a of visiblesTodos) m.set(a.grupo, (m.get(a.grupo) ?? 0) + 1);
    return m;
  }, [visiblesTodos]);
  const grupos = GRUPOS.filter((g) => porGrupo.has(g.id));
  const porOperacion = useMemo(() => {
    const ids = new Set(visiblesTodos.filter((a) => !f.grupos.length || f.grupos.includes(a.grupo)).filter((a) => !f.alumnos.length || f.alumnos.includes(a.fila.id)).map((a) => a.fila.id));
    const m = new Map<string, number>();
    const tipoOk = (t: string) => f.actividad === 'todo' || (f.actividad === 'niveles' ? t === 'nivel' : t !== 'nivel');
    for (const e of eventos) {
      if (!ids.has(e.usuario_id) || !tipoOk(e.tipo)) continue;
      const d = diaDe(e.t);
      if ((f.desde && d < f.desde) || (f.hasta && d > f.hasta)) continue;
      m.set(e.operacion, (m.get(e.operacion) ?? 0) + 1);
    }
    return m;
  }, [eventos, visiblesTodos, f.grupos, f.alumnos, f.actividad, f.desde, f.hasta]);
  const candidatos = useMemo(() => visiblesTodos.filter((a) => !f.grupos.length || f.grupos.includes(a.grupo)), [visiblesTodos, f.grupos]);
  const encontrados = useMemo(() => {
    const q = buscar.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!q) return candidatos;
    return candidatos.filter((a) => `${a.fila.nombre} ${a.fila.usuario}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q));
  }, [candidatos, buscar]);

  const textoPeriodo = periodo === 'personalizado' ? rangoTexto(f.desde, f.hasta) : (PERIODOS.find((p) => p.id === periodo)?.texto ?? 'Todo el registro');
  const textoGrupo = !f.grupos.length ? 'Todos' : f.grupos.length === 1 ? nombreGrupo(f.grupos[0]) : `${f.grupos.length} grupos`;
  const textoUsuarios = !f.alumnos.length ? 'Todos' : f.alumnos.length === 1 ? (alumnos.find((a) => a.fila.id === f.alumnos[0])?.fila.nombre ?? '1 usuario') : `${f.alumnos.length} usuarios`;
  const textoOperacion = !f.operaciones.length ? 'Todas' : f.operaciones.length === 1 ? nombresOperacion[f.operaciones[0]] : `${f.operaciones.length} operaciones`;
  const textoActividad = ACTIVIDADES.find((a) => a.id === f.actividad)!.texto;

  // Chips de lo aplicado (cada uno se quita solo).
  const chips: { id: string; texto: string; quitar: () => void }[] = [];
  if (periodo !== 'todo') chips.push({ id: 'periodo', texto: periodo === 'personalizado' ? rangoTexto(f.desde, f.hasta) : `${textoPeriodo} · ${rangoTexto(f.desde, f.hasta)}`, quitar: () => cambiar({ desde: null, hasta: null }, 'todo') });
  if (!deUnAlumno) for (const g of f.grupos) chips.push({ id: `g-${g}`, texto: nombreGrupo(g), quitar: () => cambiar({ grupos: f.grupos.filter((x) => x !== g), alumnos: [] }) });
  if (!deUnAlumno)
    for (const id of f.alumnos.slice(0, 4)) chips.push({ id: `a-${id}`, texto: alumnos.find((a) => a.fila.id === id)?.fila.nombre ?? 'Usuario', quitar: () => cambiar({ alumnos: f.alumnos.filter((x) => x !== id) }) });
  if (!deUnAlumno && f.alumnos.length > 4) chips.push({ id: 'a-mas', texto: `y ${f.alumnos.length - 4} más`, quitar: () => cambiar({ alumnos: f.alumnos.slice(0, 4) }) });
  for (const o of f.operaciones) chips.push({ id: `o-${o}`, texto: nombresOperacion[o], quitar: () => cambiar({ operaciones: f.operaciones.filter((x) => x !== o) }) });
  if (f.actividad !== 'todo') chips.push({ id: 'actividad', texto: textoActividad, quitar: () => cambiar({ actividad: 'todo' }) });
  if (!deUnAlumno && f.inactivos) chips.push({ id: 'inactivos', texto: 'Con cuentas desactivadas', quitar: () => cambiar({ inactivos: false }) });

  return (
    <section className="filtros-informe" aria-label="Filtros del informe">
      <div className="filtros-fila">
        <div className="filtros-botones">
          <Desplegable id="periodo" abierto={abierto === 'periodo'} alAbrir={setAbierto} icono="calendario" titulo="Periodo" valor={textoPeriodo} activo={periodo !== 'todo'}>
            <div role="menu" className="filtro-lista">
              {PERIODOS.map((p) => {
                const r = rangoDePeriodo(p.id);
                return (
                  <Opcion
                    key={p.id}
                    tipo="radio"
                    marcada={periodo === p.id}
                    texto={p.texto}
                    detalle={p.id === 'todo' ? 'Sin límite de fechas' : rangoTexto(r.desde, r.hasta)}
                    alPulsar={() => {
                      cambiar(r, p.id);
                      setAbierto(null);
                    }}
                  />
                );
              })}
            </div>
            <form
              className="filtro-rango"
              onSubmit={(e) => {
                e.preventDefault();
                if (!desde && !hasta) return;
                cambiar({ desde: desde || null, hasta: hasta || null }, 'personalizado');
                setAbierto(null);
              }}
            >
              <span className="filtro-subtitulo">Rango personalizado</span>
              <div className="filtro-fechas">
                <label>
                  <span className="pequeno suave">Desde</span>
                  <input type="date" className="campo" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
                </label>
                <label>
                  <span className="pequeno suave">Hasta</span>
                  <input type="date" className="campo" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
                </label>
              </div>
              <button type="submit" className="filtro-aplicar" disabled={!desde && !hasta}>
                Aplicar fechas
              </button>
            </form>
          </Desplegable>

          {!deUnAlumno && grupos.length > 1 && (
            <Desplegable id="grupo" abierto={abierto === 'grupo'} alAbrir={setAbierto} icono="grado" titulo="Grupo" valor={textoGrupo} activo={f.grupos.length > 0}>
              <div role="menu" className="filtro-lista">
                <Opcion tipo="radio" marcada={!f.grupos.length} texto="Todos los grupos" cuenta={visiblesTodos.length} alPulsar={() => cambiar({ grupos: [], alumnos: [] })} />
                {grupos.map((g) => (
                  <Opcion key={g.id} marcada={f.grupos.includes(g.id)} texto={g.nombre} cuenta={porGrupo.get(g.id)} alPulsar={() => cambiar({ grupos: alternar<Grupo>(f.grupos, g.id), alumnos: [] })} />
                ))}
              </div>
              <p className="filtro-pie-panel pequeno suave">El número es la cantidad de usuarios.</p>
            </Desplegable>
          )}

          {!deUnAlumno && (
            <Desplegable id="usuarios" abierto={abierto === 'usuarios'} alAbrir={setAbierto} icono="personas" titulo="Usuarios" valor={textoUsuarios} activo={f.alumnos.length > 0}>
              <div className="filtro-buscar">
                <Icono nombre="buscar" tamano={18} anim="no" />
                <input type="search" className="campo" placeholder="Buscar por nombre o usuario" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar usuario" autoFocus />
              </div>
              <div className="filtro-atajos">
                <button type="button" className="boton plano pequeno" onClick={() => cambiar({ alumnos: [...new Set([...f.alumnos, ...encontrados.map((a) => a.fila.id)])] })} disabled={!encontrados.length}>
                  {buscar ? 'Elegir encontrados' : 'Elegir todos'} ({encontrados.length})
                </button>
                <button type="button" className="boton plano pequeno" onClick={() => cambiar({ alumnos: [] })} disabled={!f.alumnos.length}>
                  Ninguno
                </button>
              </div>
              <div role="menu" className="filtro-lista filtro-lista-larga">
                {(f.grupos.length === 1 ? [f.grupos[0]] : grupos.map((g) => g.id)).map((g) => {
                  const del = encontrados.filter((a) => a.grupo === g);
                  if (!del.length) return null;
                  return (
                    <div key={g} role="group" aria-label={nombreGrupo(g)}>
                      {grupos.length > 1 && <span className="filtro-subtitulo">{nombreGrupo(g)}</span>}
                      {del.map((a) => (
                        <Opcion key={a.fila.id} marcada={f.alumnos.includes(a.fila.id)} texto={a.fila.nombre} detalle={`${a.fila.usuario}${a.fila.activo ? '' : ' · desactivada'}`} alPulsar={() => cambiar({ alumnos: alternar(f.alumnos, a.fila.id) })} />
                      ))}
                    </div>
                  );
                })}
                {!encontrados.length && <p className="pequeno suave filtro-vacio">Nadie con ese nombre.</p>}
              </div>
              <label className="filtro-interruptor">
                <input type="checkbox" checked={f.inactivos} onChange={(e) => cambiar({ inactivos: e.target.checked })} />
                <span>Incluir cuentas desactivadas</span>
              </label>
            </Desplegable>
          )}

          <Desplegable id="operacion" abierto={abierto === 'operacion'} alAbrir={setAbierto} icono="numeros" titulo="Operación" valor={textoOperacion} activo={f.operaciones.length > 0}>
            <div role="menu" className="filtro-lista">
              <Opcion tipo="radio" marcada={!f.operaciones.length} texto="Todas las operaciones" alPulsar={() => cambiar({ operaciones: [] })} />
              {OPERACIONES.map((o) => (
                <Opcion key={o} marcada={f.operaciones.includes(o)} texto={nombresOperacion[o]} detalle={o === 'mixta' ? 'Pruebas y ejercicios combinados' : undefined} cuenta={porOperacion.get(o) ?? 0} alPulsar={() => cambiar({ operaciones: alternar<Operacion>(f.operaciones, o) })} />
              ))}
            </div>
            <p className="filtro-pie-panel pequeno suave">El número es la cantidad de ejercicios en el periodo.</p>
          </Desplegable>

          <Desplegable id="actividad" abierto={abierto === 'actividad'} alAbrir={setAbierto} icono="diana" titulo="Actividad" valor={textoActividad} activo={f.actividad !== 'todo'}>
            <div role="menu" className="filtro-lista">
              {ACTIVIDADES.map((a) => (
                <Opcion
                  key={a.id}
                  tipo="radio"
                  marcada={f.actividad === a.id}
                  texto={a.texto}
                  detalle={a.detalle}
                  alPulsar={() => {
                    cambiar({ actividad: a.id });
                    setAbierto(null);
                  }}
                />
              ))}
            </div>
          </Desplegable>
        </div>
        {acciones && <div className="filtros-acciones">{acciones}</div>}
      </div>

      <div className="filtros-aplicados" aria-live="polite">
        {resumen && <span className="filtros-resumen">{resumen}</span>}
        {chips.map((c) => (
          <button key={c.id} type="button" className="chip-filtro" onClick={c.quitar} aria-label={`Quitar filtro: ${c.texto}`}>
            {c.texto}
            <Icono nombre="cerrar" tamano={14} anim="no" />
          </button>
        ))}
        {chips.length > 1 && (
          <button type="button" className="boton plano pequeno" onClick={() => alCambiar({ ...FILTROS_INICIALES, alumnos: deUnAlumno ? f.alumnos : [] }, 'todo')}>
            Quitar todos
          </button>
        )}
      </div>
    </section>
  );
}
