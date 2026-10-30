// Pestaña «Informes»: filtros arriba, índice de secciones y el informe; exporta exactamente lo que
// se ve (con los mismos filtros) a PDF o a Excel. También es el informe de un usuario (en su ficha).

import { useMemo, useState } from 'react';
import Icono from '../../componentes/Icono';
import { useProfesor } from '../contexto';
import { describirFiltros, filtrar, filtrosAnteriores, FILTROS_INICIALES, type Filtros, type Periodo } from '../metricas';
import { fmtNum } from '../graficas/formato';
import FiltrosBarra from './FiltrosBarra';
import Reporte, { SECCIONES } from './Reporte';
import Portada from './Portada';
import { fechaArchivo } from '../descargas';

const CLAVE = 'fincaMat:profesor:filtros';

function filtrosGuardados(): { f: Filtros; p: Periodo } {
  try {
    const g = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    if (g?.f && g?.p) return { f: { ...FILTROS_INICIALES, ...g.f }, p: g.p };
  } catch {
    // sin filtros guardados
  }
  return { f: FILTROS_INICIALES, p: 'todo' };
}

const nombreArchivo = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function Informes({ alumnoId }: { alumnoId?: string }) {
  const { alumnos, eventos, imprimir, abrirDetalle, ejecutar, profesor } = useProfesor();
  const inicial = useMemo(filtrosGuardados, []);
  const [filtrosGrupo, setFiltrosGrupo] = useState(inicial.f);
  const [periodo, setPeriodo] = useState<Periodo>(alumnoId ? 'todo' : inicial.p);
  const [filtrosAlumno, setFiltrosAlumno] = useState<Filtros>(FILTROS_INICIALES);
  const [exportando, setExportando] = useState(false);
  const deUno = !!alumnoId;
  const filtros: Filtros = deUno ? { ...filtrosAlumno, alumnos: [alumnoId], grupos: [], inactivos: true } : filtrosGrupo;
  const alumno = deUno ? alumnos.find((a) => a.fila.id === alumnoId) : undefined;

  const c = useMemo(() => filtrar(alumnos, eventos, filtros), [alumnos, eventos, filtros]);
  const anterior = useMemo(() => {
    const fa = filtrosAnteriores(filtros);
    return fa ? filtrar(alumnos, eventos, fa) : null;
  }, [alumnos, eventos, filtros]);

  const cambiar = (f: Filtros, p: Periodo) => {
    setPeriodo(p);
    if (deUno) setFiltrosAlumno(f);
    else {
      setFiltrosGrupo(f);
      sessionStorage.setItem(CLAVE, JSON.stringify({ f, p }));
    }
  };

  const titulo = deUno ? `Informe de ${alumno?.fila.nombre ?? 'usuario'}` : 'Informe de desempeño';
  const lineasFiltros = describirFiltros(filtros, alumnos);
  const resumen = `${fmtNum(c.alumnos.length)} ${c.alumnos.length === 1 ? 'usuario' : 'usuarios'} · ${fmtNum(c.eventos.length)} ejercicios`;

  const pdf = () =>
    imprimir(
      titulo,
      <div className="impreso informe-pdf">
        <Portada titulo={titulo} profesor={profesor} filtros={lineasFiltros} resumen={resumen} />
        <Reporte c={c} anterior={anterior} deUnAlumno={deUno} impreso />
      </div>,
    );

  const excel = async () => {
    setExportando(true);
    await ejecutar(async () => {
      const [{ descargarLibro }, { hojasInforme }] = await Promise.all([import('../excel'), import('./libro')]);
      descargarLibro(`finca-${nombreArchivo(titulo)}-${fechaArchivo()}.xlsx`, hojasInforme(c, { titulo, filtros: lineasFiltros, profesor }), { titulo, autor: profesor });
    }, 'Excel descargado');
    setExportando(false);
  };

  return (
    <div className="columna informes-pantalla">
      <FiltrosBarra filtros={filtros} periodo={periodo} alCambiar={cambiar} alumnos={alumnos} deUnAlumno={deUno} resumen={resumen} />
      <div className="barra-informe">
        <nav className="indice-informe" aria-label="Secciones del informe">
          {SECCIONES.filter((s) => !(deUno && (s.id === 'seguimiento' || s.id === 'usuarios'))).map((s) => (
            <a key={s.id} href={`#informe-${s.id}`} className="chip" onClick={(e) => {
              e.preventDefault();
              document.getElementById(`informe-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              {s.titulo}
            </a>
          ))}
        </nav>
        <div className="fila acciones-informe">
          <button type="button" className="boton" onClick={pdf}>
            <Icono nombre="imprimir" tamano={22} /> PDF
          </button>
          <button type="button" className="boton" onClick={() => void excel()} disabled={exportando}>
            <Icono nombre="guardar" tamano={22} /> {exportando ? 'Preparando…' : 'Excel'}
          </button>
        </div>
      </div>
      <Reporte c={c} anterior={anterior} deUnAlumno={deUno} alPulsarAlumno={deUno ? undefined : abrirDetalle} />
    </div>
  );
}
