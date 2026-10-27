// Entrada con usuario y contraseña. Las cuentas las crea el profesor: no hay registro.

import { useState, type FormEvent } from 'react';
import { EscenaFinca, Logo } from '../componentes/Ilustraciones';
import { BotonInstalar } from '../componentes/Instalar';
import Icono from '../componentes/Icono';
import { iniciarSesion } from '../servicios/sesion';
import type { FilaPerfil } from '../almacenamiento/datos';

export default function Entrar({ alEntrar, usuarioPrevio, motivo }: { alEntrar: (c: FilaPerfil) => void; usuarioPrevio?: string; motivo?: string }) {
  const [usuario, setUsuario] = useState(usuarioPrevio ?? '');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError(null);
    const r = await iniciarSesion(usuario, clave);
    setCargando(false);
    if (r.ok) alEntrar(r.cuenta);
    else setError(r.error);
  };

  return (
    <main className="pantalla">
      <div className="logo-titulo">
        <Logo tamano={64} />
        <h1 className="titulo-degradado">La Finca Matemática</h1>
      </div>
      <section className="vidrio tarjeta columna revelar">
        <div className="escena">
          <EscenaFinca />
        </div>
        <p className="centro" style={{ margin: 0 }}>
          Aquí aprendemos a sumar, restar, multiplicar y dividir con lo que pasa en la vereda.
        </p>
      </section>

      <form className="vidrio tarjeta columna revelar entrar" onSubmit={enviar} noValidate>
        <h2 style={{ margin: 0 }}>Entrar</h2>
        {motivo && (
          <p className="retro casi" role="status" style={{ margin: 0 }}>
            {motivo}
          </p>
        )}
        <label className="columna">
          <span>
            <Icono nombre="personas" tamano={22} /> Usuario
          </span>
          <input
            className="campo"
            name="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={30}
            required
          />
        </label>
        <label className="columna">
          <span>
            <Icono nombre="candado" tamano={22} /> Contraseña
          </span>
          <span className="campo-clave">
            <input
              className="campo"
              name="clave"
              type={ver ? 'text' : 'password'}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={72}
              required
            />
            <button type="button" className="boton icono" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Ver contraseña'} aria-pressed={ver}>
              <Icono nombre={ver ? 'ojo-cerrado' : 'ojo'} tamano={24} />
            </button>
          </span>
        </label>
        {error && (
          <p className="retro casi" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        <button type="submit" className="boton principal brillo" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'} {!cargando && <Icono nombre="siguiente" tamano={26} />}
        </button>
        <p className="pequeno suave centro" style={{ margin: 0 }}>
          Tu usuario y tu contraseña te los da tu profesor. Si olvidaste la contraseña, pídele que te la cambie.
        </p>
      </form>
      <BotonInstalar />
    </main>
  );
}
