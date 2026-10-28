// Inicio: muro tipo red social de la finca. Historias con las lecciones del grado, tarjeta para
// seguir la ruta, lección y reto del día, datos curiosos y el silo de la escuela.
// Todo se arma con datos locales; no hay red real.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../estado';
import { Logo } from '../componentes/Ilustraciones';
import Celebracion from '../componentes/Celebracion';
import Historia, { Medidor, MiniReto } from '../componentes/Historia';
import { BarraHistorias, CabeceraVidrio, Publicacion } from '../componentes/Red';
import { haceDiagnostica, historiasVistas, leerProgreso, leerPruebas, marcarHistoriaVista, pistaDePerfil, primerNombre } from '../almacenamiento/datos';
import { etiquetaNivel, etiquetaUnidad, nivelConTotal, leccionDisponible, nivelParaPracticar, RESUMEN_GRADO, unidadDe, unidadesDe, type Unidad } from '../juego/complejidad';
import { lecciones } from '../contenido/lecciones';
import { avatarDeAutor, consejosFamilia, datosCuriosos, indiceDelDia } from '../contenido/red';
import { insignia } from '../juego/progresion';
import { estadoSilo, hayCosechaNueva } from '../juego/silo';
import { nivelMaximo, temaDe } from '../juego/motor';
import Icono, { IconoEmoji } from '../componentes/Icono';
import { BotonVideo } from '../componentes/Video';
import { videoDeLeccion } from '../contenido/videos';

export default function Inicio() {
  const { perfil, ir } = useApp();
  const p = perfil!;
  const adulto = p.rol === 'familia';
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const pista = pistaDePerfil(p);
  const progreso = useMemo(() => leerProgreso(p.id, pista), [p.id, pista]);
  const maximo = nivelMaximo(pista);
  const actual = Math.min(progreso.nivelMaximoDesbloqueado, maximo);
  const unidades = useMemo(() => unidadesDe(pista), [pista]);
  const unidad = unidadDe(pista, actual);
  const lista = lecciones[pista];
  const [vistas, setVistas] = useState(() => historiasVistas(p.id));
  const [abierta, setAbierta] = useState<Unidad | null>(null);
  const [cosecha, setCosecha] = useState(false);

  useEffect(() => {
    if (hayCosechaNueva()) setCosecha(true);
  }, []);

  const disponible = useCallback((u: Unidad) => leccionDisponible(u, actual), [actual]);

  const abrir = (u: Unidad) => {
    marcarHistoriaVista(p.id, `${u.indice}`);
    setVistas(historiasVistas(p.id));
    setAbierta(u);
  };

  const estrellas = Object.values(progreso.niveles).reduce((s, n) => s + n.estrellas, 0);
  // Avance de la ruta: niveles superados del total.
  const superados = Object.values(progreso.niveles).filter((n) => n.completado).length;
  const pruebas = leerPruebas(p);
  const finalPendiente = haceDiagnostica(p) && !!progreso.niveles[maximo]?.completado && (!pruebas.final || !!pruebas.repetirFinal);
  const avanceUnidad = Math.round((Math.min(superados, maximo) / maximo) * 100);

  // Reto del día: una unidad ya abierta, distinta cada día.
  const abiertas = unidades.filter((u) => u.inicio <= actual);
  const unidadReto = abiertas[indiceDelDia(abiertas.length, 3)];
  const dato = datosCuriosos[indiceDelDia(datosCuriosos.length)];
  const dato2 = datosCuriosos[indiceDelDia(datosCuriosos.length, 5)];
  const consejo = consejosFamilia[indiceDelDia(consejosFamilia.length)];

  const silo = estadoSilo();
  const ultimaInsignia = progreso.insignias.length ? insignia(progreso.insignias[progreso.insignias.length - 1]) : undefined;

  return (
    <>
      <CabeceraVidrio
        izquierda={<Logo tamano={38} />}
        titulo="La Finca"
        subtitulo={`Hola, ${primerNombre(p)}`}
        derecha={
          <>
            <span className="chip semillas" aria-label={`${progreso.semillas} semillas`}>
              <Icono nombre="brote" tamano={22} /> {progreso.semillas}
            </span>
            <button type="button" className="boton icono vidrio-boton" onClick={() => ir({ nombre: 'ajustes' })} aria-label="Ajustes">
              <Icono nombre="engrane" tamano={28} />
            </button>
          </>
        }
      />
      <main className="pantalla muro">
        <BarraHistorias unidades={unidades} lecciones={lista} vistas={vistas} disponible={disponible} actual={actual} alAbrir={abrir} />

        {/* Seguir la ruta */}
        <section className="tarjeta-ruta vidrio revelar" aria-label="Tu ruta">
          <div className="fila" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
            <div className="anillo-progreso" style={{ ['--p' as string]: `${avanceUnidad}%` }} aria-hidden="true">
              <span>{etiquetaNivel(pista, actual)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pequeno suave">
                {RESUMEN_GRADO[pista].nombre} · <span className="sin-partir">Nivel {nivelConTotal(pista, actual)}</span>
              </div>
              <strong className="titulo-tarjeta">{temaDe(pista, actual).titulo}</strong>
              <div className="fila pequeno" style={{ marginTop: 4 }}>
                <span className={`chip complejidad c-${unidad.complejidad.id}`}>
                  <Medidor barras={unidad.complejidad.barras} /> {unidad.complejidad.nombre}
                </span>
                <span className="suave fila" style={{ gap: 4 }}>
                  <Icono nombre="estrella" tamano={18} /> {estrellas}
                </span>
              </div>
            </div>
          </div>
          {finalPendiente ? (
            <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'prueba', tipo: 'final' })}>
              <Icono nombre="medalla" tamano={26} /> {tu('¡Haz la prueba final!', 'Hacer la prueba final')}
            </button>
          ) : (
            <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'nivel', nivel: actual })}>
              <Icono nombre="jugar-simple" tamano={24} /> {tu('Jugar', 'Continuar')} el nivel {etiquetaNivel(pista, actual)}
            </button>
          )}
        </section>

        {/* Lección de la unidad actual */}
        {lista[unidad.indice] && (
          <Publicacion
            id={`leccion-${pista}-${unidad.indice}`}
            avatar={avatarDeAutor(lista[unidad.indice].autor)}
            autor={lista[unidad.indice].autor}
            meta={`Lección del nivel ${etiquetaUnidad(unidad)}`}
            lectura={`${lista[unidad.indice].titulo}. ${lista[unidad.indice].idea}`}
            etiqueta={<><Icono nombre="libro" tamano={20} /> Aprende</>}
            acciones={
              <>
                <button type="button" className="boton vidrio-boton" onClick={() => abrir(unidad)}>
                  Ver la historia <Icono nombre="siguiente" tamano={20} />
                </button>
                <BotonVideo video={videoDeLeccion(pista, unidad.inicio - 1)} clase="boton vidrio-boton" texto="Video" />
              </>
            }
          >
            <div className="leccion-portada">
              <span className="leccion-emoji">
                <IconoEmoji emoji={lista[unidad.indice].emoji} tamano={44} anim="siempre" />
              </span>
              <div>
                <h2>{lista[unidad.indice].titulo}</h2>
                <p>{lista[unidad.indice].idea}</p>
              </div>
            </div>
          </Publicacion>
        )}

        {/* Reto del día */}
        {unidadReto && lista[unidadReto.indice] && (
          <Publicacion
            id={`reto-${pista}-${unidadReto.indice}-${indiceDelDia(1000)}`}
            avatar="adulto"
            autor="el profe Julián"
            meta={tu('Reto del día · resuélvelo aquí', 'Reto del día · resuélvalo aquí')}
            etiqueta={<><Icono nombre="diana" tamano={20} /> Reto</>}
          >
            <MiniReto reto={lista[unidadReto.indice].reto} adulto={adulto} />
          </Publicacion>
        )}

        {adulto && (
          <Publicacion id={`consejo-${consejo.t}`} avatar="abuela" autor="la abuela Carmen" meta="Consejo para acompañar" lectura={`${consejo.t}. ${consejo.d}`} etiqueta={<><Icono nombre="personas" tamano={20} /> Familia</>}>
            <h2>{consejo.t}</h2>
            <p>{consejo.d}</p>
          </Publicacion>
        )}

        <Publicacion id={`dato-${dato.titulo}`} avatar={avatarDeAutor(dato.autor)} autor={dato.autor} meta="¿Sabías que…?" lectura={`${dato.titulo}. ${dato.texto}`} etiqueta={<><Icono nombre="dato" tamano={20} /> Dato</>}>
          <div className="dato-curioso">
            <span>
              <IconoEmoji emoji={dato.emoji} tamano={42} anim="siempre" />
            </span>
            <div>
              <h2>{dato.titulo}</h2>
              <p>{dato.texto}</p>
            </div>
          </div>
        </Publicacion>

        {ultimaInsignia && (
          <Publicacion id={`insignia-${ultimaInsignia.id}`} avatar={p.avatar} fotoDe={p.id} autor={primerNombre(p)} meta={tu('Tu último logro', 'Su último logro')} etiqueta={<><Icono nombre="medalla" tamano={20} /> Logro</>} reaccion={['Aplaudir', '¡Aplaudido!']} iconoReaccion="fiesta">
            <div className="logro-grande">
              <span>
                <IconoEmoji emoji={ultimaInsignia.icono} tamano={42} anim="siempre" />
              </span>
              <div>
                <h2>{ultimaInsignia.nombre}</h2>
                <p>{ultimaInsignia.descripcion}</p>
              </div>
            </div>
          </Publicacion>
        )}

        <Publicacion id="silo" avatar="adulta" autor="doña Rosa" meta="Silo de la escuela" etiqueta={<><Icono nombre="silo" tamano={20} /> Entre todos</>}>
          <p style={{ marginTop: 0 }}>
            {tu('Las semillas de todos los compañeros de la escuela llenan el silo. ¡Cuando se llena, hay cosecha para todos!', 'Las semillas de todos los estudiantes y familias de la escuela llenan el silo.')}
          </p>
          <div className="silo" role="progressbar" aria-valuemin={0} aria-valuemax={silo.capacidad} aria-valuenow={silo.enSilo} aria-label="Semillas en el silo">
            <div style={{ width: `${(silo.enSilo / silo.capacidad) * 100}%` }} />
          </div>
          <p className="pequeno suave" style={{ marginBottom: 0 }}>
            {silo.enSilo} de {silo.capacidad} semillas · Cosechas colectivas: {silo.cosechas}
          </p>
        </Publicacion>

        <Publicacion id={`dato-${dato2.titulo}`} avatar={avatarDeAutor(dato2.autor)} autor={dato2.autor} meta="¿Sabías que…?" lectura={`${dato2.titulo}. ${dato2.texto}`} etiqueta={<><Icono nombre="dato" tamano={20} /> Dato</>}>
          <div className="dato-curioso">
            <span>
              <IconoEmoji emoji={dato2.emoji} tamano={42} anim="siempre" />
            </span>
            <div>
              <h2>{dato2.titulo}</h2>
              <p>{dato2.texto}</p>
            </div>
          </div>
        </Publicacion>

        <p className="centro pequeno suave fin-muro">
          <Icono nombre="brote" tamano={40} anim="siempre" />
          <br />
          {tu('¡Estás al día! Sigue en tu ruta.', 'Está al día.')}</p>
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
