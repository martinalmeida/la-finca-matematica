// Panel del profesor: interfaz propia (sin juego). Usuarios, informes con filtros (del grupo y de
// cada usuario) y exportaciones. Necesita internet: todo se lee y se escribe en Supabase.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icono, { type NombreIcono } from '../componentes/Icono';
import { Logo } from '../componentes/Ilustraciones';
import { leerAjustes, primerNombre, type FilaPerfil } from '../almacenamiento/datos';
import * as api from './api';
import { ContextoProfesor, useProfesor, type EstadoProfesor } from './contexto';
import { armarAlumnos, csvEventos, csvPartidas, csvResumen, type Alumno } from './informes';
import type { Credencial } from './Tarjetas';
import { descargar, fechaArchivo } from './descargas';
import Usuarios from './Usuarios';
import Detalle from './Detalle';
import Informes from './reportes/Informes';
import Reporte from './reportes/Reporte';
import Portada from './reportes/Portada';
import { describirFiltros, filtrar, FILTROS_INICIALES } from './metricas';
import './profesor.css';

type Pestana = 'usuarios' | 'informe' | 'exportar';

const PESTANAS: { id: Pestana; texto: string; icono: NombreIcono }[] = [
  { id: 'usuarios', texto: 'Usuarios', icono: 'personas' },
  { id: 'informe', texto: 'Informes', icono: 'grafico' },
  { id: 'exportar', texto: 'Exportar', icono: 'carpeta' },
];

function Exportar() {
  const { alumnos, eventos, imprimir, ejecutar, profesor } = useProfesor();
  const [ocupado, setOcupado] = useState(false);
  const activos = alumnos.filter((a) => a.fila.activo);
  return (
    <main className="pantalla panel-pantalla">
      <section className="tarjeta columna">
        <h3>Informes con filtros</h3>
        <p className="pequeno suave" style={{ margin: 0 }}>
          En la pestaña <strong>Informes</strong> elija el periodo, el grupo, los usuarios y las operaciones, y descargue exactamente lo que ve en PDF o en Excel. Cada ficha de usuario
          tiene también su informe con los mismos botones.
        </p>
      </section>
      <section className="tarjeta columna">
        <h3>Todo en un solo archivo</h3>
        <button
          type="button"
          className="boton"
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true);
            await ejecutar(async () => {
              const [{ descargarLibro }, { hojasInforme }] = await Promise.all([import('./excel'), import('./reportes/libro')]);
              const c = filtrar(alumnos, eventos, { ...FILTROS_INICIALES, inactivos: true });
              const titulo = 'Informe completo';
              descargarLibro(`finca-informe-completo-${fechaArchivo()}.xlsx`, hojasInforme(c, { titulo, filtros: describirFiltros(c.filtros, alumnos), profesor }), { titulo, autor: profesor });
            }, 'Excel descargado');
            setOcupado(false);
          }}
        >
          <Icono nombre="guardar" tamano={24} /> {ocupado ? 'Preparando…' : 'Excel con todos los datos'}
        </button>
        <button
          type="button"
          className="boton"
          disabled={!activos.length}
          onClick={() =>
            imprimir(
              'Informes individuales',
              <>
                {activos.map((a) => {
                  const c = filtrar(alumnos, eventos, { ...FILTROS_INICIALES, alumnos: [a.fila.id], inactivos: true });
                  return (
                    <div key={a.fila.id} className="salto-pagina impreso informe-pdf">
                      <Portada titulo={`Informe de ${a.fila.nombre}`} profesor={profesor} filtros={describirFiltros(c.filtros, alumnos)} resumen={`${c.eventos.length} ejercicios`} />
                      <Reporte c={c} anterior={null} deUnAlumno impreso />
                    </div>
                  );
                })}
              </>,
            )
          }
        >
          <Icono nombre="imprimir" tamano={24} /> PDF: un informe por usuario (todos los activos)
        </button>
      </section>
      <section className="tarjeta columna">
        <h3>Tablas para SPSS, R o Excel (CSV)</h3>
        <p className="pequeno suave" style={{ margin: 0 }}>
          Separadas por punto y coma y con tildes correctas para Excel en español. Incluyen nombres: guárdelas con cuidado.
        </p>
        <button type="button" className="boton" onClick={() => descargar(`finca-resumen-${fechaArchivo()}.csv`, csvResumen(alumnos))}>
          <Icono nombre="grafico" tamano={24} /> Resumen por usuario
        </button>
        <button type="button" className="boton" onClick={() => descargar(`finca-partidas-${fechaArchivo()}.csv`, csvPartidas(alumnos))}>
          <Icono nombre="cuaderno" tamano={24} /> Partidas (niveles y pruebas)
        </button>
        <button type="button" className="boton" onClick={() => descargar(`finca-ejercicios-${fechaArchivo()}.csv`, csvEventos(eventos, alumnos))}>
          <Icono nombre="guardar" tamano={24} /> Cada ejercicio respondido
        </button>
      </section>
    </main>
  );
}

export default function AppProfesor({ cuenta, alSalir, alVencer }: { cuenta: FilaPerfil; alSalir: () => void; alVencer: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('usuarios');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [eventos, setEventos] = useState<api.EventoRemoto[]>([]);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [impresion, setImpresion] = useState<{ titulo: string; contenido: ReactNode } | null>(null);
  const temporizador = useRef<number>(undefined);

  // Paleta azul (de adultos), letra normal y sin grado.
  useEffect(() => {
    const raiz = document.documentElement;
    const ajustes = leerAjustes();
    raiz.dataset.rol = 'familia';
    raiz.dataset.grado = '';
    raiz.dataset.apoyo = '';
    raiz.dataset.efectos = ajustes.efectos;
    raiz.style.setProperty('--fs-base', `${17 + (ajustes.tamanoLetra === 'grande' ? 2 : ajustes.tamanoLetra === 'muy-grande' ? 4 : 0)}px`);
    // En computador el panel usa más ancho que la app de los niños.
    raiz.classList.add('panel-profesor');
    return () => raiz.classList.remove('panel-profesor');
  }, []);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setAviso(null), 4000);
  }, []);

  const manejar = useCallback(
    (e: unknown) => {
      if (e instanceof api.ErrorPanel && e.sesionVencida) alVencer();
      else avisar((e as Error).message);
    },
    [alVencer, avisar],
  );

  const recargar = useCallback(async () => {
    try {
      const [d, ev] = await Promise.all([api.cargarDatos(), api.cargarEventos()]);
      setAlumnos(armarAlumnos(d));
      setEventos(ev);
      setError(null);
      void api.cargarFotos(d.usuarios).then(setFotos);
    } catch (e) {
      if (e instanceof api.ErrorPanel && e.sesionVencida) alVencer();
      else setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [alVencer]);

  useEffect(() => {
    void recargar();
    const alVolver = () => void recargar();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [recargar]);

  const ejecutar = useCallback<EstadoProfesor['ejecutar']>(
    async (accion, exito) => {
      try {
        await accion();
        if (exito) avisar(exito);
        return true;
      } catch (e) {
        manejar(e);
        return false;
      }
    },
    [avisar, manejar],
  );

  // Impresión: el contenido se pinta fuera de la app y solo se ve en papel.
  useEffect(() => {
    if (!impresion) return;
    const tituloAnterior = document.title;
    document.title = impresion.titulo;
    document.documentElement.classList.add('imprimiendo');
    const fin = () => setImpresion(null);
    window.addEventListener('afterprint', fin);
    const t = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('afterprint', fin);
      document.documentElement.classList.remove('imprimiendo');
      document.title = tituloAnterior;
    };
  }, [impresion]);

  const valor = useMemo<EstadoProfesor>(
    () => ({
      alumnos,
      eventos,
      profesor: cuenta.nombre,
      fotos,
      recargar,
      avisar,
      ejecutar,
      abrirDetalle: (id) => {
        setDetalle(id);
        window.scrollTo(0, 0);
      },
      credenciales,
      agregarCredencial: (c) => setCredenciales((l) => [...l.filter((x) => x.usuario !== c.usuario), c]),
      imprimir: (titulo, contenido) => setImpresion({ titulo, contenido }),
    }),
    [alumnos, eventos, cuenta.nombre, fotos, recargar, avisar, ejecutar, credenciales],
  );

  const abierto = detalle ? alumnos.find((a) => a.fila.id === detalle) : undefined;

  let cuerpo: ReactNode;
  if (cargando) cuerpo = <div className="cargando" aria-live="polite">Cargando usuarios…</div>;
  else if (error && alumnos.length === 0)
    cuerpo = (
      <main className="pantalla panel-pantalla">
        <section className="tarjeta columna centro">
          <Icono nombre="aviso" tamano={48} />
          <p style={{ margin: 0 }}>{error}</p>
          <button type="button" className="boton principal" onClick={() => void recargar()}>
            <Icono nombre="repetir" tamano={24} /> Reintentar
          </button>
        </section>
      </main>
    );
  else if (abierto) cuerpo = <Detalle a={abierto} />;
  else cuerpo = pestana === 'usuarios' ? <Usuarios /> : pestana === 'informe' ? (
          <main className="pantalla panel-pantalla">
            <Informes />
          </main>
        ) : <Exportar />;

  return (
    <ContextoProfesor.Provider value={valor}>
      <div className="app-profesor">
        <header className="cabecera vidrio">
          <Logo tamano={38} />
          <div className="cabecera-textos">
            <h1>Panel del profesor</h1>
            <div className="pequeno suave">
              {primerNombre(cuenta)} · {cuenta.usuario} · <span title={`Compilada el ${__COMPILACION__}`}>v{__VERSION__}</span>
            </div>
          </div>
          <button type="button" className="boton icono vidrio-boton" onClick={() => void recargar()} aria-label="Actualizar datos" title="Actualizar datos">
            <Icono nombre="repetir" tamano={26} />
          </button>
          <button
            type="button"
            className="boton icono vidrio-boton"
            onClick={() => window.confirm('¿Cerrar la sesión del profesor en este equipo?') && alSalir()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <Icono nombre="salir" tamano={26} />
          </button>
        </header>
        {error && alumnos.length > 0 && (
          <p className="retro casi panel-error" role="status">
            {error}
          </p>
        )}
        <div className="escenario con-pestanas" key={abierto ? `d-${abierto.fila.id}` : pestana}>
          {cuerpo}
        </div>
        {!abierto && (
          <nav className="pestanas vidrio pestanas-tres" aria-label="Secciones del panel" style={{ ['--activa' as string]: PESTANAS.findIndex((p) => p.id === pestana) }}>
            <span className="pestana-indicador" aria-hidden="true" />
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`pestana ${p.id === pestana ? 'activa' : ''}`}
                aria-current={p.id === pestana ? 'page' : undefined}
                onClick={() => {
                  setPestana(p.id);
                  window.scrollTo(0, 0);
                }}
              >
                <span className="pestana-icono" aria-hidden="true">
                  <Icono key={p.id === pestana ? 'a' : 'i'} nombre={p.icono} tamano={28} anim={p.id === pestana ? 'una' : 'no'} />
                </span>
                <span className="pestana-texto">{p.texto}</span>
              </button>
            ))}
          </nav>
        )}
        {aviso && (
          <div className="aviso" role="status" aria-live="polite">
            {aviso}
          </div>
        )}
      </div>
      {impresion && createPortal(<div className="zona-impresion">{impresion.contenido}</div>, document.body)}
    </ContextoProfesor.Provider>
  );
}
