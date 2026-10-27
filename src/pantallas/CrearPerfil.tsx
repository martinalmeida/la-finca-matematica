import { useState } from 'react';
import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Avatar, avataresEstudiante, avataresFamilia, DibujoObjeto } from '../componentes/Ilustraciones';
import { listarPerfiles, type Perfil, type Rol } from '../almacenamiento/datos';
import { crearPerfil } from '../juego/perfil';
import type { Grado, Objeto } from '../juego/tipos';
import Icono from '../componentes/Icono';
import { Medidor } from '../componentes/Historia';
import { barrasGrado, pistaDeGrado, rangoNumeros, RESUMEN_GRADO } from '../juego/complejidad';

const dibujosGrado: Record<Exclude<Grado, 'inclusion'>, Objeto> = { 1: 'huevo', 2: 'naranja', 3: 'mazorca', 4: 'bulto', 5: 'arbol' };

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
    // Primero la prueba diagnóstica (hace de tutorial); Inclusión va directo a su ruta.
    ir(grado === 'inclusion' ? { nombre: 'mapa' } : { nombre: 'prueba', tipo: 'diagnostica' });
  };

  // Paso 1 (estudiante): grado.
  if (!adulto && !grado) {
    return (
      <main className="pantalla">
        <Barra titulo="¿En qué grado estás?" />
        <p className="suave" style={{ margin: 0 }}>
          Cada grado tiene su ruta de 10 niveles, uno por tema. Al empezar harás una prueba corta para preparar la ruta a tu medida.
        </p>
        <div className="columna">
          {([1, 2, 3, 4, 5] as const).map((g) => (
            <button key={g} type="button" className="grado-boton vidrio revelar" onClick={() => setGrado(g)} aria-label={`${g}.º grado: ${RESUMEN_GRADO[pistaDeGrado(g)].foco}`}>
              <span className="grado-numero" aria-hidden="true">
                {g}
              </span>
              <span className="columna" style={{ flex: 1, textAlign: 'left', gap: 2 }}>
                <span>{g}.º grado</span>
                <span className="pequeno suave" style={{ fontWeight: 500 }}>
                  {RESUMEN_GRADO[pistaDeGrado(g)].foco} · {rangoNumeros(pistaDeGrado(g))}
                </span>
                <span aria-hidden="true" className="fila" style={{ gap: 0 }}>
                  {Array.from({ length: g }, (_, k) => (
                    <DibujoObjeto key={k} objeto={dibujosGrado[g]} tamano={20} etiqueta="" />
                  ))}
                </span>
              </span>
              <Medidor barras={g} etiqueta={`Complejidad ${g} de 5`} />
            </button>
          ))}
          <button type="button" className="grado-boton grado-inclusion vidrio revelar" onClick={() => setGrado('inclusion')} aria-label={`Inclusión: ${RESUMEN_GRADO.inclusion.foco}`}>
            <span className="grado-numero" aria-hidden="true">
              <Icono nombre="corazon" tamano={30} anim="no" />
            </span>
            <span className="columna" style={{ flex: 1, textAlign: 'left', gap: 2 }}>
              <span>Inclusión</span>
              <span className="pequeno suave" style={{ fontWeight: 500 }}>
                {RESUMEN_GRADO.inclusion.foco}. Pensado para niños con autismo y otras formas de aprender: actividades tranquilas, paso a paso y sin perder.
              </span>
            </span>
          </button>
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
            <button key={a.id} type="button" className="perfil-boton vidrio revelar" onClick={() => elegirAvatar(a.id)}>
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

  // Paso 3: apodo y código automáticos.
  return (
    <main className="pantalla">
      <Barra titulo={adulto ? 'Su perfil' : '¡Tu perfil está listo!'} alVolver={() => setPerfil(null)} />
      <div className="tarjeta columna centro">
        <span className="anillo-avatar grande-anillo">
          <Avatar id={perfil.avatar} tamano={96} />
        </span>
        {!adulto && grado && (
          <span className="chip">
            {RESUMEN_GRADO[pistaDeGrado(grado)].nombre} <Medidor barras={barrasGrado(pistaDeGrado(grado))} />
          </span>
        )}
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
      <button type="button" className="boton principal brillo" onClick={empezar}>
        {adulto ? 'Continuar a la prueba de entrada' : grado === 'inclusion' ? '¡A jugar!' : '¡Vamos a la prueba de entrada!'}
      </button>
    </main>
  );
}
