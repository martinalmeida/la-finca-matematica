import { useApp } from '../estado';
import { EscenaFinca, Logo } from '../componentes/Ilustraciones';
import { BotonInstalar, useLargaPulsacion } from '../componentes/Comunes';
import { listarPerfiles } from '../almacenamiento/datos';

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
        <h1>La Finca Matemática</h1>
      </div>
      <div className="escena">
        <EscenaFinca />
      </div>
      <p className="centro" style={{ fontSize: '1.15rem' }}>
        ¡Bienvenidos a la finca! Aquí aprendemos a sumar, restar, multiplicar y dividir con lo que pasa en la vereda.
      </p>
      <button type="button" className="boton principal" onClick={() => ir({ nombre: 'crear', rol: 'estudiante' })}>
        🎒 Soy estudiante
      </button>
      <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'crear', rol: 'familia' })}>
        🏡 Soy papá, mamá o cuidador
      </button>
      {hayPerfiles && (
        <button type="button" className="boton" onClick={() => ir({ nombre: 'quien' })}>
          Ya tengo perfil en este celular
        </button>
      )}
      <BotonInstalar adulto />
    </main>
  );
}
