// Ruta del grado: 10 niveles (un tema cada uno, con su lección) y, al final, la prueba final.
// En Inclusión, los niveles van agrupados en bloques: cada bloque tiene su lección.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../estado';
import Celebracion from '../componentes/Celebracion';
import Historia, { Medidor } from '../componentes/Historia';
import { CabeceraVidrio } from '../componentes/Red';
import { bandaDePerfil, haceDiagnostica, leerProgreso, leerPruebas, marcarHistoriaVista, pistaDePerfil } from '../almacenamiento/datos';
import { barrasBanda, barrasGrado, etiquetaNivel, nivelConTotal, nivelParaPracticar, rangoNumeros, RESUMEN_GRADO, unidadesDe, type Unidad } from '../juego/complejidad';
import { lecciones } from '../contenido/lecciones';
import { BANDAS, nivelMaximo, temaDe } from '../juego/motor';
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
  const banda = bandaDePerfil(p);
  const conPruebas = haceDiagnostica(p);
  const pruebas = useMemo(() => leerPruebas(p), [p.id]);
  const maximo = nivelMaximo(pista);
  const enJuego = Math.min(actual, maximo);
  const rutaTerminada = !!progreso.niveles[maximo]?.completado;
  const finalPendiente = conPruebas && rutaTerminada && (!pruebas.final || pruebas.repetirFinal);

  useEffect(() => {
    // La ruta se desplaza sola hasta el nivel actual.
    refActual.current?.scrollIntoView({ block: 'center' });
    if (hayCosechaNueva()) setCosecha(true);
  }, []);

  const nodo = (n: number) => {
    const estado = progreso.niveles[n];
    const bloqueado = n > actual;
    const esActual = n === actual && !rutaTerminada;
    const etiqueta = `Jugar el nivel ${etiquetaNivel(pista, n)}${bloqueado ? ', bloqueado' : ''}${estado?.completado ? `, ${estado.estrellas} estrellas` : ''}${esActual ? ', nivel actual' : ''}`;
    return (
      <button
        ref={esActual ? refActual : undefined}
        type="button"
        className={`nodo ${bloqueado ? 'bloqueado' : ''} ${esActual ? 'actual' : ''} ${estado?.completado ? 'completado' : ''}`}
        disabled={bloqueado}
        onClick={() => ir({ nombre: 'nivel', nivel: n })}
        aria-label={etiqueta}
      >
        {bloqueado ? <Icono nombre="candado" tamano={26} anim="no" /> : <span>{etiquetaNivel(pista, n)}</span>}
        {estado?.completado && (
          <span className="estrellas-mini" aria-hidden="true">
            {'★'.repeat(estado.estrellas)}
            {'☆'.repeat(3 - estado.estrellas)}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <CabeceraVidrio
        titulo={resumen.nombre}
        subtitulo={
          <>
            <span className="sin-partir">Nivel {nivelConTotal(pista, enJuego)}</span> · <span className="sin-partir">{rangoNumeros(pista)}</span>
          </>
        }
        derecha={
          conPruebas && !adulto ? (
            <span className="chip pequeno" title={BANDAS[banda].descripcion}>
              {BANDAS[banda].nombre} <Medidor barras={barrasBanda(banda)} max={3} etiqueta={`Exigencia: ${BANDAS[banda].nombre}`} />
            </span>
          ) : (
            <Medidor barras={barrasGrado(pista)} etiqueta={`Complejidad: ${barrasGrado(pista)} de 5`} />
          )
        }
      />
      <main className="pantalla" style={{ paddingTop: 8 }}>
        {finalPendiente ? (
          <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'prueba', tipo: 'final' })}>
            <Icono nombre="medalla" tamano={26} /> {adulto ? 'Hacer la prueba final' : '¡Haz la prueba final!'}
          </button>
        ) : (
          <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'nivel', nivel: enJuego })}>
            <Icono nombre="jugar-simple" tamano={24} /> {adulto ? 'Continuar' : 'Jugar'} el nivel {etiquetaNivel(pista, enJuego)}
          </button>
        )}
        <div className="camino" aria-label="Ruta de niveles">
          {unidades.map((u) => {
            const abiertaU = u.inicio <= actual;
            const l = lecciones[pista][u.indice];
            const bloque = u.fin > u.inicio;
            const niveles = Array.from({ length: u.fin - u.inicio + 1 }, (_, k) => u.inicio + k);
            return (
              <section
                key={u.indice}
                className={`zona tema vidrio revelar ${abiertaU ? '' : 'cerrada'}`}
                aria-label={bloque ? `Nivel ${u.indice + 1}: ${u.titulo}` : `Nivel ${u.inicio}: ${u.titulo}`}
              >
                <header className="zona-cabecera">
                  {bloque ? (
                    <span className="zona-numero" aria-hidden="true">
                      {u.indice + 1}
                    </span>
                  ) : (
                    nodo(u.inicio)
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{bloque ? `Nivel ${u.indice + 1} · ${u.titulo}` : u.titulo}</h3>
                    <div className="fila pequeno">
                      <span className={`chip complejidad c-${u.complejidad.id}`}>
                        <Medidor barras={u.complejidad.barras} /> {u.complejidad.nombre}
                      </span>
                      <span className="suave">{bloque ? `${niveles.length} niveles de 10 actividades` : '10 preguntas'}</span>
                    </div>
                  </div>
                </header>
                {bloque && (
                  <ol className="bloque-niveles">
                    {niveles.map((n) => (
                      <li key={n} className={n > actual ? 'bloqueado' : ''}>
                        {nodo(n)}
                        <span>{temaDe(pista, n).titulo}</span>
                      </li>
                    ))}
                  </ol>
                )}
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
              </section>
            );
          })}
          {conPruebas && (
            <section className={`zona vidrio revelar zona-final ${rutaTerminada ? '' : 'cerrada'}`} aria-label="Prueba final">
              <header className="zona-cabecera">
                <span className="zona-numero" aria-hidden="true">
                  <Icono nombre="medalla" tamano={26} anim={finalPendiente ? 'siempre' : 'no'} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>Prueba final</h3>
                  <div className="pequeno suave">
                    {pruebas.final && !pruebas.repetirFinal
                      ? `${adulto ? 'Hecha' : 'Hecha'}: ${pruebas.final.aciertos} de ${pruebas.final.total} (al entrar: ${pruebas.diagnostica?.aciertos ?? '–'})`
                      : rutaTerminada
                        ? adulto ? 'Compare cómo terminó con cómo empezó.' : 'Mira cuánto aprendiste desde el comienzo.'
                        : `Se abre al superar el nivel ${maximo}.`}
                  </div>
                </div>
              </header>
              {rutaTerminada && (
                <button type="button" className={`boton ${finalPendiente ? 'principal' : 'vidrio-boton'}`} onClick={() => ir({ nombre: 'prueba', tipo: 'final' })}>
                  {finalPendiente ? <><Icono nombre="jugar-simple" tamano={22} /> Empezar la prueba final</> : <><Icono nombre="grafico" tamano={24} /> Ver antes y después</>}
                </button>
              )}
            </section>
          )}
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
          texto="Entre todos los compañeros llenaron el silo de la escuela. ¡Gracias por trabajar juntos!"
          alCerrar={() => setCosecha(false)}
        />
      )}
    </>
  );
}
