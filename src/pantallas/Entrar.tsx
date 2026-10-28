// Entrada con usuario y contraseña. Las cuentas las crea el profesor: no hay registro.
// Diseño sobrio: franja de marca con un mapa de curvas de nivel (las montañas de la vereda)
// y un formulario limpio. Sin vidrio ni degradados: es la puerta de entrada para todos.

import { useMemo, useState, type FormEvent } from 'react';
import { Logo } from '../componentes/Ilustraciones';
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
    <main className="login">
      <section className="login-marca">
        <Topografia />
        <div className="login-marca-contenido">
          <Logo tamano={52} />
          <p className="login-lugar">
            <span className="sin-partir">San Vicente de Chucurí</span> · <span className="sin-partir">Santander</span>
          </p>
          <h1 className="login-titulo">
            La Finca
            <br />
            Matemática
          </h1>
          <p className="login-lema">Sumar, restar, multiplicar y dividir con lo que pasa en la vereda.</p>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={enviar} noValidate aria-describedby={error ? 'login-error' : undefined}>
          <header className="login-encabezado">
            <h2>Iniciar sesión</h2>
            <p>Usa el usuario y la contraseña que te dio tu profesor.</p>
          </header>

          {motivo && (
            <p className="login-aviso" role="status">
              {motivo}
            </p>
          )}

          <div className="login-campo">
            <label htmlFor="login-usuario">Usuario</label>
            <input
              id="login-usuario"
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

          <div className="login-campo">
            <label htmlFor="login-clave">Contraseña</label>
            <div className="login-clave">
              <input
                id="login-clave"
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
              <button type="button" className="login-ver" onClick={() => setVer(!ver)} aria-pressed={ver} aria-controls="login-clave">
                {ver ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <p id="login-error" className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-entrar" disabled={cargando}>
            {cargando && <span className="login-giro" aria-hidden="true" />}
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="login-ayuda">¿Olvidaste la contraseña? Pídele a tu profesor que te asigne una nueva.</p>
        </form>

        <div className="login-pie">
          <BotonInstalar discreto />
        </div>
      </section>
    </main>
  );
}

/** Relieve: tres cerros y una cuchilla, como las montañas alrededor de la vereda. */
function altura(x: number, y: number): number {
  const cerro = (cx: number, cy: number, h: number, sx: number, sy: number) => h * Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  return (
    cerro(0.22, 0.32, 1.25, 0.22, 0.18) +
    cerro(0.68, 0.62, 1.05, 0.2, 0.24) +
    cerro(0.95, 0.12, 0.8, 0.16, 0.14) +
    cerro(0.45, 0.95, 0.6, 0.3, 0.12) +
    0.06 * Math.sin(9 * x + 4 * y) +
    0.04 * Math.sin(13 * y - 5 * x)
  );
}

/**
 * Curvas de nivel calculadas con «marching squares» sobre el relieve: no es una imagen, es un mapa.
 * Cada quinta curva es más gruesa (curva maestra), como en las cartas del IGAC.
 */
function Topografia() {
  const { finas, maestras } = useMemo(() => {
    const W = 400;
    const H = 300;
    const N = 100;
    const M = 75;
    const valores: number[][] = [];
    for (let j = 0; j <= M; j++) {
      valores.push([]);
      for (let i = 0; i <= N; i++) valores[j].push(altura(i / N, (j / M) * (H / W) * 1.33));
    }
    const finas: string[] = [];
    const maestras: string[] = [];
    const px = (i: number) => ((i / N) * W).toFixed(1);
    const py = (j: number) => ((j / M) * H).toFixed(1);
    for (let k = 1; k <= 26; k++) {
      const nivel = k * 0.055;
      const destino = k % 5 === 0 ? maestras : finas;
      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          const a = valores[j][i];
          const b = valores[j][i + 1];
          const c = valores[j + 1][i + 1];
          const d = valores[j + 1][i];
          const caso = (a > nivel ? 8 : 0) | (b > nivel ? 4 : 0) | (c > nivel ? 2 : 0) | (d > nivel ? 1 : 0);
          if (caso === 0 || caso === 15) continue;
          const t = (u: number, v: number) => (nivel - u) / (v - u);
          // Puntos donde la curva cruza cada borde de la celda.
          const arriba = `${px(i + t(a, b))} ${py(j)}`;
          const derecha = `${px(i + 1)} ${py(j + t(b, c))}`;
          const abajo = `${px(i + t(d, c))} ${py(j + 1)}`;
          const izquierda = `${px(i)} ${py(j + t(a, d))}`;
          const tramos: [string, string][] = (
            {
              1: [[izquierda, abajo]],
              2: [[abajo, derecha]],
              3: [[izquierda, derecha]],
              4: [[arriba, derecha]],
              5: [[izquierda, arriba], [abajo, derecha]],
              6: [[arriba, abajo]],
              7: [[izquierda, arriba]],
              8: [[izquierda, arriba]],
              9: [[arriba, abajo]],
              10: [[izquierda, abajo], [arriba, derecha]],
              11: [[arriba, derecha]],
              12: [[izquierda, derecha]],
              13: [[abajo, derecha]],
              14: [[izquierda, abajo]],
            } as Record<number, [string, string][]>
          )[caso];
          for (const [p, q] of tramos) destino.push(`M${p}L${q}`);
        }
      }
    }
    return { finas: finas.join(''), maestras: maestras.join('') };
  }, []);

  return (
    <svg className="login-topo" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <path d={finas} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={maestras} fill="none" stroke="currentColor" strokeOpacity="0.38" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
