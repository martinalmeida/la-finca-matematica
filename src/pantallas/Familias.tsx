import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { informePerfil, nombresOperacion } from '../juego/informes';
import { leerPruebas, pistaDePerfil } from '../almacenamiento/datos';
import Comparacion from '../componentes/Comparacion';
import { temaDe } from '../juego/motor';
import { consejosFamilia as consejos } from '../contenido/red';
import { CabeceraVidrio } from '../componentes/Red';
import { nivelConTotal, RESUMEN_GRADO } from '../juego/complejidad';
import Icono from '../componentes/Icono';
import { BotonVideo } from '../componentes/Video';
import { guiaFamilias, videosLecciones } from '../contenido/videos';
import type { Pista } from '../juego/tipos';

const GRADOS: { pista: Pista; nombre: string }[] = [
  { pista: 'inclusion', nombre: 'Inclusión' },
  { pista: 'g1', nombre: '1.º grado' },
  { pista: 'g2', nombre: '2.º grado' },
  { pista: 'g3', nombre: '3.º grado' },
  { pista: 'g4', nombre: '4.º grado' },
  { pista: 'g5', nombre: '5.º grado' },
  { pista: 'fam-basica', nombre: 'Para usted: cuaderno básico' },
  { pista: 'fam-intermedia', nombre: 'Para usted: cuaderno intermedio' },
  { pista: 'fam-avanzada', nombre: 'Para usted: cuaderno avanzado' },
];

export default function Familias({ seccion }: { seccion: 'menu' | 'acompanar' | 'avance' | 'videos' }) {
  const { ir, ajustes, perfil } = useApp();

  if (seccion === 'videos') {
    const propia = pistaDePerfil(perfil);
    return (
      <main className="pantalla">
        <Barra titulo={<span className="cuaderno-titulo">Videos para acompañar</span>} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Videos cortos de YouTube en español. Necesitan internet: véalos cuando haya señal, solo o con su hijo o hija.
        </p>
        {!ajustes.videos && (
          <p className="tarjeta">
            Los videos están apagados. Puede encenderlos en <strong>Ajustes → Videos de ayuda de YouTube</strong>.
          </p>
        )}
        <section className="tarjeta columna">
          <h2 style={{ fontSize: '1.1rem' }}>Cómo acompañar las matemáticas en casa</h2>
          {guiaFamilias.map((g) => (
            <div key={g.video.id} className="columna" style={{ gap: 4 }}>
              <strong className="pequeno">{g.tema}</strong>
              <BotonVideo video={g.video} adulto clase="boton" texto={g.video.titulo} />
            </div>
          ))}
        </section>
        {GRADOS.map(({ pista, nombre }) => (
          <details key={pista} className="tarjeta grado-videos" open={pista === propia}>
            <summary>
              <strong>{nombre}</strong>
              {pista === propia && <span className="chip pequeno">Su cuaderno</span>}
            </summary>
            <div className="columna" style={{ marginTop: 10 }}>
              {videosLecciones[pista].map(
                (v, k) =>
                  v && (
                    <div key={v.id + k} className="columna" style={{ gap: 4 }}>
                      <span className="pequeno suave">
                        Nivel {k + 1}: {temaDe(pista, k + 1).titulo}
                      </span>
                      <BotonVideo video={v} adulto clase="boton" texto={v.titulo} />
                    </div>
                  ),
              )}
            </div>
          </details>
        ))}
      </main>
    );
  }

  if (seccion === 'acompanar') {
    return (
      <main className="pantalla">
        <Barra titulo={<span className="cuaderno-titulo">Acompañar a mi hijo o hija</span>} />
        {consejos.map((c, k) => (
          <article key={c.t} className="tarjeta consejo">
            <h2 style={{ fontSize: '1.05rem' }}>
              {k + 1}. {c.t}
            </h2>
            <p style={{ margin: 0 }}>{c.d}</p>
          </article>
        ))}
      </main>
    );
  }

  if (seccion === 'avance') {
    const f = informePerfil(perfil);
    const pr = leerPruebas(perfil);
    const pista = pistaDePerfil(perfil);
    return (
      <main className="pantalla">
        <Barra titulo={<span className="cuaderno-titulo">Mi avance</span>} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          No es una nota: muestra en qué le conviene practicar. Su profesor ve este mismo avance.
        </p>
        <article className="tarjeta columna">
          <p style={{ margin: 0 }}>
            {RESUMEN_GRADO[pista].nombre} · <strong>nivel {nivelConTotal(pista, f.nivelMaximo)}</strong> · ★ {f.estrellas} estrellas · {f.semillas} semillas
          </p>
          {pr.diagnostica && !pr.final && (
            <p className="pequeno" style={{ margin: 0 }}>
              Prueba de entrada: {pr.diagnostica.aciertos} de {pr.diagnostica.total}. Al terminar los 10 niveles hará la prueba final y podrá comparar.
            </p>
          )}
          {pr.diagnostica && pr.final && <Comparacion diagnostica={pr.diagnostica} final={pr.final} adulto />}
          <p style={{ margin: 0 }}>
            {f.masCuesta.length
              ? `Le cuesta más: ${f.masCuesta.map((o) => nombresOperacion[o].toLowerCase()).join(' y ')}. Practique con ejemplos de la casa.`
              : 'Aún no hay suficientes ejercicios para saber qué le cuesta más, o le va bien en todas las operaciones.'}
          </p>
        </article>
      </main>
    );
  }

  return (
    <>
    <CabeceraVidrio titulo="Cuaderno de la finca" subtitulo="Para mamás, papás y cuidadores" />
    <main className="pantalla">
      <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'mapa' })}>
        <Icono nombre="jugar-simple" tamano={24} /> Problemas de la finca y el hogar
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'acompanar' })}>
        <Icono nombre="personas" tamano={30} /> Acompañar a mi hijo o hija
      </button>
      {ajustes.videos && (
        <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'videos' })}>
          <Icono nombre="video" tamano={30} /> Videos para acompañar en casa
        </button>
      )}
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'avance' })}>
        <Icono nombre="grafico" tamano={30} /> Ver mi avance
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'ajustes' })}>
        <Icono nombre="engrane" tamano={30} /> Ajustes
      </button>
    </main>
    </>
  );
}
