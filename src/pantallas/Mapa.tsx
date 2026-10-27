// Ruta del grado: 101 niveles en 7 unidades de complejidad creciente, cada una con su lección.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../estado';
import Celebracion from '../componentes/Celebracion';
import Historia, { Medidor } from '../componentes/Historia';
import { CabeceraVidrio } from '../componentes/Red';
import { leerProgreso, marcarHistoriaVista, pistaDePerfil } from '../almacenamiento/datos';
import { barrasGrado, nivelParaPracticar, rangoNumeros, RESUMEN_GRADO, unidadesDe, type Unidad } from '../juego/complejidad';
import { lecciones } from '../contenido/lecciones';
import { esCosecha, NIVEL_MAXIMO } from '../juego/motor';
import { hayCosechaNueva } from '../juego/silo';
import Icono, { IconoEmoji } from '../componentes/Icono';

export default function Mapa() {
  const { perfil, ir } = useApp();
  const p = perfil!;
  const pista = pistaDePerfil(p);
  const progreso = useMemo(() => leerProgreso(p.id, pista), [p.id, pista]);
  const adulto = p.rol === 'familia';
  const actual = progreso.nivelMaximoDesbloqueado;
  const unidades = useMemo(() => unidadesDe(pista), [pista]);
  const refActual = useRef<HTMLButtonElement>(null);
  const [cosecha, setCosecha] = useState(false);
  const [abierta, setAbierta] = useState<Unidad | null>(null);
  const resumen = RESUMEN_GRADO[pista];

  useEffect(() => {
    // La ruta se desplaza sola hasta el nivel actual.
    refActual.current?.scrollIntoView({ block: 'center' });
    if (hayCosechaNueva()) setCosecha(true);
  }, []);

  const nodo = (n: number) => {
    const estado = progreso.niveles[n];
    const bloqueado = n > actual;
    const esActual = n === actual;
    const offset = Math.round(Math.sin(n * 0.9) * 30);
    const etiqueta = `Nivel ${n}${esCosecha(n) ? ', nivel de cosecha' : ''}${bloqueado ? ', bloqueado' : ''}${estado?.completado ? `, ${estado.estrellas} estrellas` : ''}${esActual ? ', nivel actual' : ''}`;
    return (
      <div key={n} className="nodo-fila" style={{ transform: `translateX(${offset}%)` }}>
        <button
          ref={esActual ? refActual : undefined}
          type="button"
          className={`nodo ${bloqueado ? 'bloqueado' : ''} ${esActual ? 'actual' : ''} ${esCosecha(n) ? 'cosecha' : ''} ${estado?.completado ? 'completado' : ''}`}
          disabled={bloqueado}
          onClick={() => ir({ nombre: 'nivel', nivel: n })}
          aria-label={etiqueta}
        >
          {bloqueado ? <Icono nombre="candado" tamano={26} anim="no" /> : <span>{n}</span>}
          {esCosecha(n) && !bloqueado && (
            <span className="nodo-cosecha">
              <Icono nombre="canasta" tamano={24} />
            </span>
          )}
          {estado?.completado && (
            <span className="estrellas-mini" aria-hidden="true">
              {'★'.repeat(estado.estrellas)}
              {'☆'.repeat(3 - estado.estrellas)}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <CabeceraVidrio
        titulo={resumen.nombre}
        subtitulo={`Nivel ${Math.min(actual, NIVEL_MAXIMO)} de 100 · ${rangoNumeros(pista)}`}
        derecha={<Medidor barras={barrasGrado(pista)} etiqueta={`Complejidad del grado: ${barrasGrado(pista)} de 5`} />}
      />
      <main className="pantalla" style={{ paddingTop: 8 }}>
        <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'nivel', nivel: Math.min(actual, NIVEL_MAXIMO) })}>
          <Icono nombre="jugar-simple" tamano={24} /> {adulto ? 'Continuar' : 'Jugar'} el nivel {Math.min(actual, NIVEL_MAXIMO)}
        </button>
        <div className="camino" aria-label="Ruta de niveles">
          {unidades.map((u) => {
            const abiertaU = u.inicio <= actual;
            const l = lecciones[pista][u.indice];
            return (
              <section key={u.indice} className={`zona vidrio revelar zona-${u.indice} ${abiertaU ? '' : 'cerrada'}`} aria-label={`Unidad ${u.indice + 1}: ${u.titulo}`}>
                <header className="zona-cabecera">
                  <span className="zona-numero" aria-hidden="true">
                    {u.indice + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{u.titulo}</h3>
                    <div className="fila pequeno">
                      <span className={`chip complejidad c-${u.complejidad.id}`}>
                        <Medidor barras={u.complejidad.barras} /> {u.complejidad.nombre}
                      </span>
                      <span className="suave">
                        {u.inicio === u.fin ? `Nivel ${u.inicio}` : `Niveles ${u.inicio}–${u.fin}`}
                      </span>
                    </div>
                  </div>
                </header>
                {l && abiertaU && (
                  <button
                    type="button"
                    className="boton vidrio-boton boton-leccion"
                    onClick={() => {
                      marcarHistoriaVista(p.id, `${u.indice}`);
                      setAbierta(u);
                    }}
                  >
                    <IconoEmoji emoji={l.emoji} tamano={28} /> {adulto ? 'Ver la lección' : 'Ver la lección antes de jugar'}
                  </button>
                )}
                <div className="nodos">{Array.from({ length: u.fin - u.inicio + 1 }, (_, j) => nodo(u.inicio + j))}</div>
              </section>
            );
          })}
        </div>
      </main>
      {abierta && lecciones[pista][abierta.indice] && (
        <Historia
          leccion={lecciones[pista][abierta.indice]}
          unidad={abierta}
          adulto={adulto}
          alCerrar={() => setAbierta(null)}
          alPracticar={() => ir({ nombre: 'nivel', nivel: nivelParaPracticar(abierta, actual) })}
        />
      )}
      {cosecha && (
        <Celebracion
          titulo="¡Cosecha colectiva!"
          texto="Entre todos los jugadores de este celular llenaron el silo de la escuela. ¡Gracias por trabajar juntos!"
          alCerrar={() => setCosecha(false)}
        />
      )}
    </>
  );
}
