// Inicio: muro tipo red social de la finca. Historias con las lecciones del grado, tarjeta para
// seguir la ruta, lección y reto del día, datos curiosos y logros de los jugadores de este celular.
// Todo se arma con datos locales; no hay red real.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../estado';
import { Avatar } from '../componentes/Ilustraciones';
import Celebracion from '../componentes/Celebracion';
import Historia, { Medidor, MiniReto } from '../componentes/Historia';
import { BarraHistorias, CabeceraVidrio, Publicacion } from '../componentes/Red';
import { LogoConPanel } from './Bienvenida';
import { haceDiagnostica, historiasVistas, leerProgreso, leerPruebas, listarPerfiles, marcarHistoriaVista, pistaDePerfil } from '../almacenamiento/datos';
import { leccionDisponible, nivelParaPracticar, RESUMEN_GRADO, unidadDe, unidadesDe, type Unidad } from '../juego/complejidad';
import { lecciones } from '../contenido/lecciones';
import { avatarDeAutor, consejosFamilia, datosCuriosos, indiceDelDia } from '../contenido/red';
import { insignia } from '../juego/progresion';
import { estadoSilo, hayCosechaNueva } from '../juego/silo';
import { NIVEL_MAXIMO } from '../juego/motor';
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
  const actual = Math.min(progreso.nivelMaximoDesbloqueado, NIVEL_MAXIMO);
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
  // Avance de la ruta: niveles superados de 10.
  const superados = Object.values(progreso.niveles).filter((n) => n.completado).length;
  const pruebas = leerPruebas(p);
  const finalPendiente = haceDiagnostica(p) && !!progreso.niveles[NIVEL_MAXIMO]?.completado && (!pruebas.final || !!pruebas.repetirFinal);
  const avanceUnidad = Math.round((superados / NIVEL_MAXIMO) * 100);

  // Reto del día: una unidad ya abierta, distinta cada día.
  const abiertas = unidades.filter((u) => u.inicio <= actual);
  const unidadReto = abiertas[indiceDelDia(abiertas.length, 3)];
  const dato = datosCuriosos[indiceDelDia(datosCuriosos.length)];
  const dato2 = datosCuriosos[indiceDelDia(datosCuriosos.length, 5)];
  const consejo = consejosFamilia[indiceDelDia(consejosFamilia.length)];

  // Logros de los jugadores de este celular (solo apodos, como en «¿Quién juega?»).
  const logros = listarPerfiles()
    .filter((x) => x.rol === 'estudiante')
    .map((x) => {
      const px = pistaDePerfil(x);
      const pr = x.id === p.id ? progreso : leerProgreso(x.id, px);
      return { perfil: x, pista: px, progreso: pr, estrellas: Object.values(pr.niveles).reduce((s, n) => s + n.estrellas, 0) };
    })
    .filter((x) => Object.keys(x.progreso.niveles).length > 0)
    .sort((a, b) => b.progreso.nivelMaximoDesbloqueado - a.progreso.nivelMaximoDesbloqueado)
    .slice(0, 4);

  const silo = estadoSilo();
  const ultimaInsignia = progreso.insignias.length ? insignia(progreso.insignias[progreso.insignias.length - 1]) : undefined;

  return (
    <>
      <CabeceraVidrio
        izquierda={<LogoConPanel tamano={38} />}
        titulo="La Finca"
        subtitulo={tu(`Hola, ${p.apodo}`, `Bienvenido(a), ${p.apodo}`)}
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
              <span>{actual}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pequeno suave">
                {RESUMEN_GRADO[pista].nombre} · Nivel {unidad.inicio} de {NIVEL_MAXIMO}
              </div>
              <strong className="titulo-tarjeta">{unidad.titulo}</strong>
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
              <Icono nombre="jugar-simple" tamano={24} /> {tu('Jugar', 'Continuar')} el nivel {actual}
            </button>
          )}
        </section>

        {/* Lección de la unidad actual */}
        {lista[unidad.indice] && (
          <Publicacion
            id={`leccion-${pista}-${unidad.indice}`}
            avatar={avatarDeAutor(lista[unidad.indice].autor)}
            autor={lista[unidad.indice].autor}
            meta={`Lección del nivel ${unidad.inicio}`}
            lectura={`${lista[unidad.indice].titulo}. ${lista[unidad.indice].idea}`}
            etiqueta={<><Icono nombre="libro" tamano={20} /> Aprende</>}
            acciones={
              <>
                <button type="button" className="boton vidrio-boton" onClick={() => abrir(unidad)}>
                  Ver la historia <Icono nombre="siguiente" tamano={20} />
                </button>
                <BotonVideo video={videoDeLeccion(pista, unidad.indice)} clase="boton vidrio-boton" texto="Video" />
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
          <Publicacion id={`insignia-${ultimaInsignia.id}`} avatar={p.avatar} autor={p.apodo} meta={tu('Tu último logro', 'Su último logro')} etiqueta={<><Icono nombre="medalla" tamano={20} /> Logro</>} reaccion={['Aplaudir', '¡Aplaudido!']} iconoReaccion="fiesta">
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

        {logros.length > 0 && (
          <section className="publicacion vidrio revelar" aria-label="Así van en este celular">
            <header className="publicacion-cabecera">
              <span className="chip">
                <Icono nombre="trofeo" tamano={20} /> Así van en este celular
              </span>
            </header>
            <ul className="lista-logros">
              {logros.map((x) => (
                <li key={x.perfil.id}>
                  <span className="anillo-avatar pequeno-anillo">
                    <Avatar id={x.perfil.avatar} tamano={40} etiqueta="" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{x.perfil.id === p.id ? `${x.perfil.apodo} (${tu('tú', 'usted')})` : x.perfil.apodo}</strong>
                    <div className="pequeno suave">
                      Nivel {Math.min(x.progreso.nivelMaximoDesbloqueado, NIVEL_MAXIMO)} · {RESUMEN_GRADO[x.pista].nombre} · ★ {x.estrellas}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="pequeno suave" style={{ margin: 0 }}>
              {tu('Cada quien avanza en la ruta de su grado. ¡Lo importante es seguir aprendiendo!', 'Cada estudiante avanza en la ruta de su grado; no es una competencia.')}
            </p>
          </section>
        )}

        <Publicacion id="silo" avatar="adulta" autor="doña Rosa" meta="Silo de la escuela" etiqueta={<><Icono nombre="silo" tamano={20} /> Entre todos</>}>
          <p style={{ marginTop: 0 }}>
            {tu('Las semillas de todos los jugadores de este celular llenan el silo. ¡Cuando se llena, hay cosecha para todos!', 'Las semillas de todos los jugadores de este celular llenan el silo de la escuela.')}
          </p>
          <div className="silo" role="progressbar" aria-valuemin={0} aria-valuemax={silo.capacidad} aria-valuenow={silo.enSilo} aria-label="Semillas en el silo">
            <div style={{ width: `${(silo.enSilo / silo.capacidad) * 100}%` }} />
          </div>
          <p className="pequeno suave" style={{ marginBottom: 0 }}>
            {silo.enSilo} de {silo.capacidad} semillas · Cosechas colectivas: {silo.cosechas}
          </p>
        </Publicacion>

        {!adulto && listarPerfiles().filter((x) => x.rol === 'estudiante').length >= 2 && (
          <Publicacion
            id="pareja"
            avatar="nina-cacaotera"
            autor="Valentina"
            meta="Invitación"
            lectura="¿Resolvemos un reto en pareja? Uno hace el primer paso y el otro el segundo. ¡Juntos es más fácil!"
            etiqueta={<><Icono nombre="pareja" tamano={20} /> Pareja</>}
            acciones={
              <button type="button" className="boton vidrio-boton" onClick={() => ir({ nombre: 'pareja' })}>
                Aceptar el reto <Icono nombre="siguiente" tamano={20} />
              </button>
            }
          >
            <p style={{ margin: 0 }}>¿Resolvemos un reto en pareja? Uno hace el primer paso y el otro el segundo. ¡Juntos es más fácil!</p>
          </Publicacion>
        )}

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
          texto="Entre todos los jugadores de este celular llenaron el silo de la escuela. ¡Gracias por trabajar juntos!"
          alCerrar={() => setCosecha(false)}
        />
      )}
    </>
  );
}
