import { useState } from 'react';
import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Avatar, avataresEstudiante, avataresFamilia, DibujoObjeto } from '../componentes/Ilustraciones';
import { listarPerfiles, type Perfil, type Rol } from '../almacenamiento/datos';
import { crearPerfil } from '../juego/perfil';
import type { Grado, Objeto } from '../juego/tipos';

const dibujosGrado: Record<Grado, Objeto> = { 1: 'huevo', 2: 'naranja', 3: 'mazorca', 4: 'bulto', 5: 'arbol' };

export default function CrearPerfil({ rol }: { rol: Rol }) {
  const { ir, elegirPerfil, actualizarPerfil } = useApp();
  const adulto = rol === 'familia';
  const [grado, setGrado] = useState<Grado | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [apodo, setApodo] = useState('');

  const elegirAvatar = (avatar: string) => {
    const p = crearPerfil(rol, adulto ? null : grado, avatar, listarPerfiles());
    setPerfil(p);
    setApodo(p.apodo);
  };

  const empezar = () => {
    if (!perfil) return;
    const final = { ...perfil, apodo: apodo.trim().slice(0, 24) || perfil.apodo };
    actualizarPerfil(final);
    elegirPerfil(final);
    // El estudiante va directo al nivel 0 (tutorial).
    if (adulto) ir({ nombre: 'mapa' });
    else {
      ir({ nombre: 'mapa' });
      ir({ nombre: 'nivel', nivel: 0 });
    }
  };

  // Paso 1 (estudiante): grado.
  if (!adulto && !grado) {
    return (
      <main className="pantalla">
        <Barra titulo="¿En qué grado estás?" />
        <div className="columna">
          {([1, 2, 3, 4, 5] as Grado[]).map((g) => (
            <button key={g} type="button" className="grado-boton" onClick={() => setGrado(g)} aria-label={`${g}.º grado`}>
              <span className="grado-numero" aria-hidden="true">
                {g}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{g}.º grado</span>
              <span aria-hidden="true" className="fila" style={{ gap: 0 }}>
                {Array.from({ length: g }, (_, k) => (
                  <DibujoObjeto key={k} objeto={dibujosGrado[g]} tamano={24} etiqueta="" />
                ))}
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Paso 2: avatar.
  if (!perfil) {
    const lista = adulto ? avataresFamilia : avataresEstudiante;
    return (
      <main className="pantalla">
        <Barra titulo={adulto ? 'Elija su personaje' : 'Elige tu personaje'} alVolver={adulto ? undefined : () => setGrado(null)} />
        <div className="rejilla" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
          {lista.map((a) => (
            <button key={a.id} type="button" className="perfil-boton" onClick={() => elegirAvatar(a.id)}>
              <Avatar id={a.id} tamano={72} />
              <span>{a.nombre}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Paso 3: apodo y código automáticos.
  return (
    <main className="pantalla">
      <Barra titulo={adulto ? 'Su perfil' : '¡Tu perfil está listo!'} alVolver={() => setPerfil(null)} />
      <div className="tarjeta columna centro">
        <Avatar id={perfil.avatar} tamano={96} />
        <label className="columna" style={{ width: '100%' }}>
          <span>{adulto ? 'Su apodo (puede cambiarlo):' : 'Tu apodo (puedes cambiarlo):'}</span>
          <input className="campo" value={apodo} maxLength={24} onChange={(e) => setApodo(e.target.value)} autoComplete="off" />
        </label>
        <p className="pequeno suave">
          {adulto ? 'Le recomendamos no usar su nombre real.' : 'Mejor no uses tu nombre real: un apodo es más divertido.'}
        </p>
        <p>
          Código: <strong>{perfil.codigo}</strong>
        </p>
        <p className="pequeno suave">{adulto ? 'El código identifica el perfil sin datos personales.' : 'Tu código sirve para que el profe sepa cómo vas, sin usar tu nombre.'}</p>
      </div>
      <button type="button" className="boton principal" onClick={empezar}>
        {adulto ? 'Entrar al cuaderno de la finca' : '¡A jugar! 🌱'}
      </button>
    </main>
  );
}
