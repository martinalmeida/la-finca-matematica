import { useApp } from '../estado';
import { EscenaFinca, Logo } from '../componentes/Ilustraciones';
import { useLargaPulsacion } from '../componentes/Comunes';
import { BotonInstalar } from '../componentes/Instalar';
import { listarPerfiles } from '../almacenamiento/datos';
import Icono from '../componentes/Icono';
import { DERECHOS } from '../contenido/autoria';

export function LogoConPanel({ tamano = 64 }: { tamano?: number }) {
  const { ir } = useApp();
  // Pulsación larga de 3 segundos: abre el panel docente (oculto para los niños).
  const pulsar = useLargaPulsacion(3000, () => ir({ nombre: 'docente' }));
  return (
    <button type="button" className="logo-pulsable" {...pulsar} aria-label="La Finca Matemática">
      <Logo tamano={tamano} />
    </button>
  );
}

export default function Bienvenida() {
  const { ir } = useApp();
  const hayPerfiles = listarPerfiles().length > 0;
  return (
    <main className="pantalla">
      <div className="logo-titulo">
        <LogoConPanel />
        <h1 className="titulo-degradado">La Finca Matemática</h1>
      </div>
      <section className="vidrio tarjeta columna revelar">
        <div className="escena">
          <EscenaFinca />
        </div>
        <p className="centro" style={{ fontSize: '1.12rem', margin: 0 }}>
          ¡Bienvenidos a la finca! Aquí aprendemos a sumar, restar, multiplicar y dividir con lo que pasa en la vereda.
        </p>
        <p className="centro pequeno suave" style={{ margin: 0 }}>
          <span className="fila" style={{ justifyContent: 'center', gap: 14 }}>
            <span className="fila" style={{ gap: 4 }}>
              <Icono nombre="libro" tamano={22} /> Lecciones
            </span>
            <span className="fila" style={{ gap: 4 }}>
              <Icono nombre="diana" tamano={22} /> Retos
            </span>
            <span className="fila" style={{ gap: 4 }}>
              <Icono nombre="altavoz" tamano={22} /> Con voz
            </span>
          </span>
        </p>
      </section>
      <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'crear', rol: 'estudiante' })}>
        <Icono nombre="mochila" tamano={30} /> Soy estudiante
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'crear', rol: 'familia' })}>
        <Icono nombre="casa" tamano={30} /> Soy papá, mamá o cuidador
      </button>
      {hayPerfiles && (
        <button type="button" className="boton" onClick={() => ir({ nombre: 'quien' })}>
          Ya tengo perfil en este celular
        </button>
      )}
      <BotonInstalar />
      <p className="pequeno suave centro" style={{ margin: 0 }}>
        {DERECHOS}
      </p>
    </main>
  );
}
