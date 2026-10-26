import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Avatar } from '../componentes/Ilustraciones';
import { informePerfil, nombresOperacion } from '../juego/informes';
import { listarPerfiles } from '../almacenamiento/datos';

const consejos = [
  { t: 'Acompañe, no haga la tarea', d: 'Siéntese a su lado y déjelo pensar. Si usted resuelve por él o ella, se pierde la oportunidad de aprender.' },
  { t: 'Pregunte cómo lo pensó', d: '«¿Cómo lo hiciste?» vale más que «¿cuánto te dio?». Escuche su explicación aunque la respuesta no sea correcta.' },
  { t: 'Use lo que pasa en la finca', d: 'Invente problemas con lo de todos los días: cuántas mazorcas cortaron, cuántos huevos pusieron las gallinas, cuánto cuesta el mercado.' },
  { t: 'Cuenten juntos en la tienda', d: 'Pídale que calcule el total de una compra pequeña o los vueltos. El dinero es una gran forma de practicar.' },
  { t: 'Celebre el esfuerzo', d: 'Felicite cuando insiste y cuando corrige un error. Equivocarse es parte de aprender, no un motivo de regaño.' },
  { t: 'Diez minutos al día', d: 'Es mejor practicar un poco todos los días que mucho de vez en cuando. Busque un momento tranquilo, sin afán.' },
  { t: 'Use objetos', d: 'Granos de cacao, piedritas o tapas sirven para contar, juntar, quitar y repartir. Ver y tocar ayuda a entender.' },
  { t: 'No compare con otros', d: 'Cada niño y niña tiene su ritmo. Compárelo solo con lo que él o ella sabía antes y note cuánto ha avanzado.' },
];

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
                Va en el <strong>nivel {f.nivelMaximo} de 100</strong> · ⭐ {f.estrellas} estrellas · 🌱 {f.semillas} semillas
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
    <main className="pantalla">
      <Barra titulo={<span className="cuaderno-titulo">Cuaderno de la finca</span>} />
      <button type="button" className="boton principal" onClick={() => ir({ nombre: 'mapa' })}>
        ▶ Problemas de la finca y el hogar
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'acompanar' })}>
        💬 Acompañar a mi hijo o hija
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'familias', seccion: 'avance' })}>
        📈 Ver el avance de los niños de este celular
      </button>
    </main>
  );
}
