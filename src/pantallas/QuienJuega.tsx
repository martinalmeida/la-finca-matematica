import { useApp } from '../estado';
import { Avatar } from '../componentes/Ilustraciones';
import { listarPerfiles, type Perfil } from '../almacenamiento/datos';
import { LogoConPanel } from './Bienvenida';
import { nombreGrado } from '../juego/complejidad';
import Icono from '../componentes/Icono';
import { gradoNumerico } from '../juego/pareja';

export default function QuienJuega() {
  const { ir, elegirPerfil } = useApp();
  const perfiles = listarPerfiles();
  const estudiantes = perfiles.filter((p) => p.rol === 'estudiante').sort((a, b) => gradoNumerico(a.grado ?? 1) - gradoNumerico(b.grado ?? 1));
  const familias = perfiles.filter((p) => p.rol === 'familia');

  const tarjeta = (p: Perfil) => (
    <button
      key={p.id}
      type="button"
      className="perfil-boton vidrio"
      onClick={() => {
        elegirPerfil(p);
        ir({ nombre: 'inicio' });
      }}
    >
      <span className="anillo-avatar">
        <Avatar id={p.avatar} tamano={72} />
      </span>
      <span className="perfil-apodo">{p.apodo}</span>
      <span className="chip pequeno">{p.rol === 'familia' ? 'Familia' : nombreGrado(p.grado)}</span>
    </button>
  );

  return (
    <main className="pantalla">
      <div className="logo-titulo">
        <LogoConPanel tamano={56} />
        <div>
          <h1 className="titulo-degradado">¿Quién va a jugar?</h1>
          <p className="suave" style={{ margin: 0 }}>
            Toca tu perfil para entrar
          </p>
        </div>
      </div>
      {estudiantes.length > 0 && (
        <section className="rejilla" aria-label="Estudiantes">
          {estudiantes.map(tarjeta)}
        </section>
      )}
      {familias.length > 0 && (
        <>
          <h2>Familias</h2>
          <section className="rejilla" aria-label="Familias">
            {familias.map(tarjeta)}
          </section>
        </>
      )}
      <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'bienvenida' })}>
        <Icono nombre="mas" tamano={28} /> Nuevo jugador
      </button>
      {estudiantes.length >= 2 && (
        <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'pareja' })}>
          <Icono nombre="pareja" tamano={30} /> Reto en pareja
        </button>
      )}
    </main>
  );
}
