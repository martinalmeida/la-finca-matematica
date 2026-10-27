// Aprender: biblioteca de lecciones de la ruta del grado, ordenadas por complejidad.

import { useMemo, useState } from 'react';
import { useApp } from '../estado';
import Historia, { Medidor } from '../componentes/Historia';
import { CabeceraVidrio } from '../componentes/Red';
import { historiasVistas, leerProgreso, marcarHistoriaVista, pistaDePerfil } from '../almacenamiento/datos';
import { barrasGrado, leccionDisponible, nivelParaPracticar, rangoNumeros, RESUMEN_GRADO, unidadesDe, type Unidad } from '../juego/complejidad';
import { lecciones } from '../contenido/lecciones';
import { NIVEL_MAXIMO } from '../juego/motor';
import Icono, { IconoEmoji } from '../componentes/Icono';

export default function Aprender() {
  const { perfil, ir } = useApp();
  const p = perfil!;
  const adulto = p.rol === 'familia';
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const pista = pistaDePerfil(p);
  const progreso = useMemo(() => leerProgreso(p.id, pista), [p.id, pista]);
  const actual = Math.min(progreso.nivelMaximoDesbloqueado, NIVEL_MAXIMO);
  const unidades = useMemo(() => unidadesDe(pista), [pista]);
  const lista = lecciones[pista];
  const [vistas, setVistas] = useState(() => historiasVistas(p.id));
  const [abierta, setAbierta] = useState<Unidad | null>(null);
  const resumen = RESUMEN_GRADO[pista];

  const abrir = (u: Unidad) => {
    marcarHistoriaVista(p.id, `${u.indice}`);
    setVistas(historiasVistas(p.id));
    setAbierta(u);
  };

  return (
    <>
      <CabeceraVidrio titulo="Aprender" subtitulo={`${resumen.nombre} · ${lista.length} lecciones`} />
      <main className="pantalla">
        <section className="vidrio tarjeta-grado revelar" aria-label="Complejidad del grado">
          <div className="fila" style={{ flexWrap: 'nowrap' }}>
            <span className="insignia-grado" aria-hidden="true">
              {resumen.corto}
            </span>
            <div style={{ flex: 1 }}>
              <strong className="titulo-tarjeta">{resumen.foco}</strong>
              <div className="pequeno suave">{rangoNumeros(pista)}</div>
            </div>
            <Medidor barras={barrasGrado(pista)} etiqueta={`Complejidad del grado: ${barrasGrado(pista)} de 5`} />
          </div>
          <p className="pequeno" style={{ marginBottom: 0 }}>
            {adulto
              ? 'Los niveles de su cuaderno suben poco a poco: cálculo mental, compras, producción, porcentajes y planeación.'
              : `Tu ruta está hecha para ${resumen.corto} grado. Cada unidad es un poco más difícil que la anterior: Inicio → Básico → Intermedio → Avanzado → Reto.`}
          </p>
        </section>

        <ol className="lista-lecciones">
          {unidades.map((u) => {
            const l = lista[u.indice];
            const libre = leccionDisponible(u, actual, unidades);
            const completa = actual > u.fin || (u.fin === NIVEL_MAXIMO && progreso.niveles[NIVEL_MAXIMO]?.completado);
            const enCurso = !completa && actual >= u.inicio;
            const estado = completa ? 'Completada' : enCurso ? 'En curso' : libre ? 'Adelanto' : 'Más adelante';
            const iconoEstado = completa ? 'check' : enCurso ? 'jugar' : libre ? 'ojo' : 'candado';
            return (
              <li key={u.indice}>
                <button type="button" className={`leccion-item vidrio revelar ${libre ? '' : 'bloqueada'}`} disabled={!libre} onClick={() => abrir(u)}>
                  <span className={`leccion-icono ${vistas.includes(`${u.indice}`) ? 'vista' : ''}`} aria-hidden="true">
                    {libre ? <IconoEmoji emoji={l?.emoji ?? '📖'} tamano={38} anim="siempre" /> : <Icono nombre="candado" tamano={30} anim="no" />}
                  </span>
                  <span className="columna" style={{ flex: 1, gap: 2, minWidth: 0, textAlign: 'left' }}>
                    <span className="pequeno suave">
                      Unidad {u.indice + 1} · {u.inicio === u.fin ? `Nivel ${u.inicio}` : `Niveles ${u.inicio}–${u.fin}`}
                    </span>
                    <strong>{l?.titulo ?? u.titulo}</strong>
                    <span className="pequeno suave">{u.titulo}</span>
                    <span className="fila pequeno" style={{ marginTop: 4 }}>
                      <span className={`chip complejidad c-${u.complejidad.id}`}>
                        <Medidor barras={u.complejidad.barras} /> {u.complejidad.nombre}
                      </span>
                      <span className="suave fila" style={{ gap: 4 }}>
                        <Icono nombre={iconoEstado} tamano={18} /> {estado}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="pequeno suave centro">
          {tu('Las lecciones se abren a medida que avanzas. Puedes ver la siguiente como adelanto.', 'Las lecciones se abren a medida que avanza.')}
        </p>
      </main>
      {abierta && lista[abierta.indice] && (
        <Historia
          leccion={lista[abierta.indice]}
          unidad={abierta}
          adulto={adulto}
          alCerrar={() => setAbierta(null)}
          alPracticar={abierta.inicio <= actual ? () => ir({ nombre: 'nivel', nivel: nivelParaPracticar(abierta, actual) }) : undefined}
        />
      )}
    </>
  );
}
