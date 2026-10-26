import { useApp } from '../estado';
import { Avatar } from '../componentes/Ilustraciones';
import { listarPerfiles } from '../almacenamiento/datos';
import { LogoConPanel } from './Bienvenida';

export default function QuienJuega() {
  const { ir, elegirPerfil } = useApp();
  const perfiles = listarPerfiles();
  const estudiantes = perfiles.filter((p) => p.rol === 'estudiante');
  const familias = perfiles.filter((p) => p.rol === 'familia');
  return (
    <main className="pantalla">
      <div className="logo-titulo">
        <LogoConPanel tamano={56} />
        <h1>¿Quién va a jugar?</h1>
      </div>
      {estudiantes.length > 0 && (
        <section className="rejilla" aria-label="Estudiantes">
          {estudiantes.map((p) => (
            <button
              key={p.id}
              type="button"
              className="perfil-boton"
              onClick={() => {
                elegirPerfil(p);
                ir({ nombre: 'mapa' });
              }}
            >
              <Avatar id={p.avatar} />
              <span>{p.apodo}</span>
              <span className="pequeno">{p.grado}.º grado</span>
            </button>
          ))}
        </section>
      )}
      {familias.length > 0 && (
        <>
          <h2>Familias</h2>
          <section className="rejilla" aria-label="Familias">
            {familias.map((p) => (
              <button
                key={p.id}
                type="button"
                className="perfil-boton"
                onClick={() => {
                  elegirPerfil(p);
                  ir({ nombre: 'mapa' });
                }}
              >
                <Avatar id={p.avatar} />
                <span>{p.apodo}</span>
                <span className="pequeno">Familia</span>
              </button>
            ))}
          </section>
        </>
      )}
      <button type="button" className="boton principal" onClick={() => ir({ nombre: 'bienvenida' })}>
        ➕ Nuevo jugador
      </button>
      {estudiantes.length >= 2 && (
        <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'pareja' })}>
          🤝 Reto en pareja
        </button>
      )}
    </main>
  );
}
