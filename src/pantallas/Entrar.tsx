// Entrada con usuario y contraseña. Las cuentas las crea el profesor: no hay registro.
// Mismo lenguaje de diseño que el resto de la app: fondo vivo, vidrio y botón de acento.

import { useState, type FormEvent } from 'react';
import { EscenaFinca, Logo } from '../componentes/Ilustraciones';
import Icono from '../componentes/Icono';
import { BotonInstalar } from '../componentes/Instalar';
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
    if (!usuario.trim() || !clave) {
      setError('Escribe tu usuario y tu contraseña.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const r = await iniciarSesion(usuario, clave);
      if (r.ok) alEntrar(r.cuenta);
      else setError(r.error);
    } catch {
      setError('No se pudo entrar. Revisa la señal e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pantalla entrar-pantalla">
      <header className="entrar-marca">
        <Logo tamano={60} />
        <div className="columna" style={{ gap: 2, minWidth: 0 }}>
          <h1 className="titulo-degradado">La Finca Matemática</h1>
          <p className="pequeno suave" style={{ margin: 0 }}>
            Matemáticas con lo que pasa en la vereda
          </p>
        </div>
      </header>

      <form className="vidrio tarjeta columna entrar" onSubmit={enviar} noValidate aria-describedby={error ? 'entrar-error' : undefined}>
        <div className="escena entrar-escena" aria-hidden="true">
          <EscenaFinca />
        </div>

        <div className="columna" style={{ gap: 4 }}>
          <h2 style={{ margin: 0 }}>Entrar</h2>
          <p className="suave" style={{ margin: 0 }}>
            Usa el usuario y la contraseña que te dio tu profesor.
          </p>
        </div>

        {motivo && (
          <p className="retro casi" role="status" style={{ margin: 0 }}>
            <Icono nombre="aviso" tamano={24} /> <span>{motivo}</span>
          </p>
        )}

        <div className="entrar-campo">
          <label htmlFor="entrar-usuario">
            <Icono nombre="personas" tamano={22} /> Usuario
          </label>
          <input
            id="entrar-usuario"
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
            aria-invalid={!!error && !usuario.trim()}
          />
        </div>

        <div className="entrar-campo">
          <label htmlFor="entrar-clave">
            <Icono nombre="candado" tamano={22} /> Contraseña
          </label>
          <span className="campo-clave">
            <input
              id="entrar-clave"
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
              aria-invalid={!!error && !clave}
            />
            <button type="button" className="boton icono" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Ver contraseña'} aria-pressed={ver} aria-controls="entrar-clave">
              <Icono nombre={ver ? 'ojo-cerrado' : 'ojo'} tamano={24} anim="no" />
            </button>
          </span>
        </div>

        {error && (
          <p id="entrar-error" className="retro casi" role="alert" style={{ margin: 0 }}>
            <Icono nombre="aviso" tamano={24} /> <span>{error}</span>
          </p>
        )}

        <button type="submit" className="boton principal brillo" disabled={cargando}>
          {cargando ? (
            <>
              <span className="entrar-giro" aria-hidden="true" /> Entrando…
            </>
          ) : (
            <>
              Entrar <Icono nombre="siguiente" tamano={26} />
            </>
          )}
        </button>

        <p className="pequeno suave centro" style={{ margin: 0 }}>
          ¿Olvidaste la contraseña? Pídele a tu profesor que te asigne una nueva.
        </p>
      </form>

      <BotonInstalar />
    </main>
  );
}
