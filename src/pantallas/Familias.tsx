import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Avatar } from '../componentes/Ilustraciones';
import { informePerfil, nombresOperacion } from '../juego/informes';
import { listarPerfiles } from '../almacenamiento/datos';
import { consejosFamilia as consejos } from '../contenido/red';
import { CabeceraVidrio } from '../componentes/Red';
import Icono from '../componentes/Icono';


export default function Familias({ seccion }: { seccion: 'menu' | 'acompanar' | 'avance' }) {
  const { ir } = useApp();

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
    const ninos = listarPerfiles().filter((p) => p.rol === 'estudiante');
    return (
      <main className="pantalla">
        <Barra titulo={<span className="cuaderno-titulo">Avance de los niños</span>} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Solo lectura. Muestra los perfiles de estudiantes de este celular. No son notas escolares: indican en qué conviene practicar.
        </p>
        {ninos.length === 0 && <p className="tarjeta">Todavía no hay perfiles de estudiantes en este celular.</p>}
        {ninos.map((p) => {
          const f = informePerfil(p);
          return (
            <article key={p.id} className="tarjeta columna">
              <div className="fila">
                <Avatar id={p.avatar} tamano={48} />
                <div>
                  <strong>{p.apodo}</strong>
                  <div className="pequeno suave">
                    {p.grado}.º grado · {p.codigo}
                  </div>
                </div>
              </div>
              <p style={{ margin: 0 }}>
                Va en el <strong>nivel {f.nivelMaximo} de 100</strong> · ★ {f.estrellas} estrellas · {f.semillas} semillas
              </p>
              <p style={{ margin: 0 }}>
                {f.masCuesta.length
                  ? `Le cuesta más: ${f.masCuesta.map((o) => nombresOperacion[o].toLowerCase()).join(' y ')}. Practiquen juntos con ejemplos de la casa.`
                  : 'Aún no hay suficientes ejercicios para saber qué le cuesta más, o le va bien en todas las operaciones.'}
              </p>
            </article>
          );
        })}
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
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'avance' })}>
        <Icono nombre="grafico" tamano={30} /> Ver el avance de los niños de este celular
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'ajustes' })}>
        <Icono nombre="engrane" tamano={30} /> Ajustes
      </button>
    </main>
    </>
  );
}
