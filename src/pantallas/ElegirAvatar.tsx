// La primera vez que el usuario entra elige su personaje (el nombre lo puso el profesor).

import { Avatar, avataresEstudiante, avataresFamilia } from '../componentes/Ilustraciones';
import { Barra } from '../componentes/Comunes';
import { primerNombre, type Perfil } from '../almacenamiento/datos';

export default function ElegirAvatar({ perfil, alElegir, alVolver }: { perfil: Perfil; alElegir: (avatar: string) => void; alVolver?: () => void }) {
  const adulto = perfil.rol === 'familia';
  const lista = adulto ? avataresFamilia : avataresEstudiante;
  return (
    <main className="pantalla">
      {alVolver ? (
        <Barra titulo={adulto ? 'Elija su personaje' : 'Elige tu personaje'} alVolver={alVolver} />
      ) : (
        <header className="barra">
          <h1>{adulto ? `Hola, ${primerNombre(perfil)}. Elija su personaje` : `¡Hola, ${primerNombre(perfil)}! Elige tu personaje`}</h1>
        </header>
      )}
      <div className="rejilla" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
        {lista.map((a) => (
          <button key={a.id} type="button" className={`perfil-boton vidrio revelar ${perfil.avatar === a.id ? 'elegido' : ''}`} onClick={() => alElegir(a.id)} aria-pressed={perfil.avatar === a.id}>
            <span className="anillo-avatar">
              <Avatar id={a.id} tamano={72} />
            </span>
            <span>{a.nombre}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
