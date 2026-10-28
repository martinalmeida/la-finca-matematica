// Usuarios del profesor: lista con filtros, crear, editar, cambiar contraseña,
// desactivar, reiniciar el progreso y eliminar.

import { useMemo, useState, type FormEvent } from 'react';
import Icono from '../componentes/Icono';
import FotoPerfil from '../componentes/FotoPerfil';
import type { FilaPerfil, TipoUsuario } from '../almacenamiento/datos';
import { nivelConTotal } from '../juego/complejidad';
import { nivelMaximo } from '../juego/motor';
import * as api from './api';
import { useProfesor } from './contexto';
import { GRUPOS, nombreGrupo, sugerirClave, sugerirUsuario, type Alumno, type Grupo } from './informes';
import { HojaTarjetas, TarjetaAcceso, type Credencial } from './Tarjetas';

export function hace(iso: string | null): string {
  if (!iso) return 'nunca';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const detalleCuenta = (f: Pick<FilaPerfil, 'tipo' | 'grado'>) => (f.tipo === 'estudiante' ? `Estudiante de ${f.grado}.º grado` : f.tipo === 'familia' ? 'Familia' : 'Inclusión');

/** Hoja (ventana inferior) del panel. */
export function Hoja({ titulo, alCerrar, children }: { titulo: string; alCerrar: () => void; children: React.ReactNode }) {
  return (
    <div className="velo-instalar" role="presentation" onClick={(e) => e.target === e.currentTarget && alCerrar()}>
      <section className="hoja-instalar hoja-profesor" role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="fila hoja-profesor-cabeza">
          <h2 style={{ flex: 1, margin: 0 }}>{titulo}</h2>
          <button type="button" className="boton icono" onClick={alCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tamano={22} />
          </button>
        </header>
        <div className="columna hoja-profesor-cuerpo">{children}</div>
      </section>
    </div>
  );
}

function CampoClave({ valor, alCambiar }: { valor: string; alCambiar: (v: string) => void }) {
  return (
    <label className="columna">
      <span>Contraseña (mínimo 4)</span>
      <span className="campo-clave">
        <input className="campo" value={valor} onChange={(e) => alCambiar(e.target.value)} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={72} minLength={4} required />
        <button type="button" className="boton icono" onClick={() => alCambiar(sugerirClave())} aria-label="Sugerir otra contraseña" title="Sugerir otra">
          <Icono nombre="repetir" tamano={22} />
        </button>
      </span>
    </label>
  );
}

function CamposTipo({ tipo, grado, alTipo, alGrado }: { tipo: TipoUsuario; grado: number; alTipo: (t: TipoUsuario) => void; alGrado: (g: number) => void }) {
  return (
    <>
      <fieldset className="columna campo-grupo">
        <legend>Tipo de cuenta</legend>
        <div className="opciones-fila">
          {(
            [
              ['estudiante', 'Estudiante', 'mochila'],
              ['familia', 'Padre, madre o cuidador', 'casa'],
              ['inclusion', 'Inclusión', 'corazon'],
            ] as const
          ).map(([v, t, i]) => (
            <button key={v} type="button" className={`opcion-tipo ${tipo === v ? 'elegida' : ''}`} aria-pressed={tipo === v} onClick={() => alTipo(v)}>
              <Icono nombre={i} tamano={26} anim="no" /> {t}
            </button>
          ))}
        </div>
      </fieldset>
      {tipo === 'estudiante' && (
        <fieldset className="columna campo-grupo">
          <legend>Grado</legend>
          <div className="opciones-fila">
            {[1, 2, 3, 4, 5].map((g) => (
              <button key={g} type="button" className={`opcion-grado ${grado === g ? 'elegida' : ''}`} aria-pressed={grado === g} onClick={() => alGrado(g)}>
                {g}.º
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {tipo === 'inclusion' && <p className="pequeno suave" style={{ margin: 0 }}>Ruta tranquila de 23 niveles, sin pruebas y sin perder.</p>}
      {tipo === 'familia' && <p className="pequeno suave" style={{ margin: 0 }}>Hace una prueba de entrada y recibe el cuaderno de familias que le corresponde.</p>}
    </>
  );
}

function CrearUsuario({ alCerrar }: { alCerrar: () => void }) {
  const { ejecutar, recargar, agregarCredencial } = useProfesor();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoUsuario>('estudiante');
  const [grado, setGrado] = useState(1);
  const [usuario, setUsuario] = useState('');
  const [tocado, setTocado] = useState(false);
  const [clave, setClave] = useState(() => sugerirClave());
  const [libre, setLibre] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState<Credencial | null>(null);

  const usuarioFinal = (tocado ? usuario : sugerirUsuario(nombre)).trim().toLowerCase();
  const usuarioValido = /^[a-z0-9._]{3,30}$/.test(usuarioFinal);

  const revisar = async () => {
    if (!usuarioValido) return setLibre(null);
    try {
      setLibre(await api.usuarioLibre(usuarioFinal));
    } catch {
      setLibre(null);
    }
  };

  const proponerLibre = async () => {
    for (let n = 2; n < 60; n++) {
      const candidato = `${usuarioFinal.slice(0, 27)}${n}`;
      if (await api.usuarioLibre(candidato).catch(() => false)) {
        setTocado(true);
        setUsuario(candidato);
        setLibre(true);
        return;
      }
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) return setError('Escriba el nombre.');
    if (!usuarioValido) return setError('El usuario debe tener de 3 a 30 letras sin tilde, números, punto o guion bajo.');
    if (clave.length < 4) return setError('La contraseña debe tener al menos 4 caracteres.');
    setGuardando(true);
    const datos = { usuario: usuarioFinal, clave, nombre: nombre.trim(), tipo, grado: tipo === 'estudiante' ? grado : null };
    try {
      await api.crearUsuario(datos);
      const c: Credencial = { nombre: datos.nombre, usuario: datos.usuario, clave, detalle: detalleCuenta({ tipo, grado: datos.grado }) };
      agregarCredencial(c);
      setCreada(c);
      void ejecutar(recargar);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (creada) {
    return (
      <Hoja titulo="Usuario creado" alCerrar={alCerrar}>
        <p style={{ margin: 0 }}>Entregue esta tarjeta. La contraseña no se puede volver a ver: si se pierde, cámbiela.</p>
        <TarjetaAcceso c={creada} />
        <ImprimirTarjetas lista={[creada]} texto="Imprimir esta tarjeta" />
        <button
          type="button"
          className="boton principal"
          onClick={() => {
            setCreada(null);
            setNombre('');
            setUsuario('');
            setTocado(false);
            setLibre(null);
            setClave(sugerirClave());
          }}
        >
          <Icono nombre="agregar" tamano={24} /> Crear otro usuario
        </button>
        <button type="button" className="boton" onClick={alCerrar}>
          Listo
        </button>
      </Hoja>
    );
  }

  return (
    <Hoja titulo="Nuevo usuario" alCerrar={alCerrar}>
      <form className="columna" onSubmit={enviar} noValidate>
        <label className="columna">
          <span>Nombre completo</span>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={revisar} maxLength={80} autoComplete="off" required autoFocus />
        </label>
        <CamposTipo tipo={tipo} grado={grado} alTipo={setTipo} alGrado={setGrado} />
        <label className="columna">
          <span>Usuario para entrar</span>
          <input
            className="campo"
            value={usuarioFinal}
            onChange={(e) => {
              setTocado(true);
              setUsuario(e.target.value.toLowerCase().replace(/\s/g, ''));
              setLibre(null);
            }}
            onBlur={revisar}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            required
          />
          <span className="pequeno suave">Letras sin tilde, números, punto o guion bajo. Se sugiere a partir del nombre.</span>
          {libre === false && (
            <span className="retro casi pequeno">
              Ese usuario ya existe.{' '}
              <button type="button" className="boton enlace" onClick={proponerLibre}>
                Proponer uno libre
              </button>
            </span>
          )}
          {libre === true && <span className="pequeno" style={{ color: 'var(--ok)' }}>Disponible</span>}
        </label>
        <CampoClave valor={clave} alCambiar={setClave} />
        {error && (
          <p className="retro casi" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        <button type="submit" className="boton principal" disabled={guardando}>
          <Icono nombre="agregar" tamano={24} /> {guardando ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>
    </Hoja>
  );
}

export function EditarUsuario({ a, alCerrar }: { a: Alumno; alCerrar: () => void }) {
  const { ejecutar, recargar } = useProfesor();
  const [nombre, setNombre] = useState(a.fila.nombre);
  const [tipo, setTipo] = useState<TipoUsuario>(a.fila.tipo ?? 'estudiante');
  const [grado, setGrado] = useState(a.fila.grado ?? 1);
  const cambiaRuta = tipo !== a.fila.tipo || (tipo === 'estudiante' && grado !== a.fila.grado);
  return (
    <Hoja titulo={`Editar a ${a.fila.nombre}`} alCerrar={alCerrar}>
      <form
        className="columna"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!nombre.trim()) return;
          const ok = await ejecutar(() => api.editarUsuario(a.fila.id, { nombre: nombre.trim(), tipo, grado: tipo === 'estudiante' ? grado : null }), 'Cambios guardados');
          if (ok) {
            await recargar();
            alCerrar();
          }
        }}
      >
        <label className="columna">
          <span>Nombre completo</span>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required />
        </label>
        <CamposTipo tipo={tipo} grado={grado} alTipo={setTipo} alGrado={setGrado} />
        {cambiaRuta && (
          <p className="pequeno tarjeta" style={{ margin: 0 }}>
            Cambia su ruta. El avance de cada grado se guarda aparte: si vuelve a su grado anterior, lo encuentra como lo dejó. En la ruta nueva empieza con la prueba de entrada.
          </p>
        )}
        <p className="pequeno suave" style={{ margin: 0 }}>
          El usuario para entrar (<strong>{a.fila.usuario}</strong>) no cambia.
        </p>
        <button type="submit" className="boton principal">
          <Icono nombre="guardar" tamano={24} /> Guardar
        </button>
      </form>
    </Hoja>
  );
}

export function CambiarClave({ a, alCerrar }: { a: Alumno; alCerrar: () => void }) {
  const { ejecutar, agregarCredencial } = useProfesor();
  const [clave, setClave] = useState(() => sugerirClave());
  const [lista, setLista] = useState<Credencial | null>(null);
  if (lista) {
    return (
      <Hoja titulo="Contraseña cambiada" alCerrar={alCerrar}>
        <TarjetaAcceso c={lista} />
        <ImprimirTarjetas lista={[lista]} texto="Imprimir esta tarjeta" />
        <button type="button" className="boton" onClick={alCerrar}>
          Listo
        </button>
      </Hoja>
    );
  }
  return (
    <Hoja titulo={`Nueva contraseña para ${a.fila.nombre}`} alCerrar={alCerrar}>
      <form
        className="columna"
        onSubmit={async (e) => {
          e.preventDefault();
          if (clave.length < 4) return;
          if (await ejecutar(() => api.cambiarClave(a.fila.id, clave))) {
            const c: Credencial = { nombre: a.fila.nombre, usuario: a.fila.usuario, clave, detalle: detalleCuenta(a.fila) };
            agregarCredencial(c);
            setLista(c);
          }
        }}
      >
        <CampoClave valor={clave} alCambiar={setClave} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Si ya tiene la sesión abierta en su celular, sigue jugando; la nueva contraseña sirve para la próxima vez que entre.
        </p>
        <button type="submit" className="boton principal">
          <Icono nombre="candado" tamano={24} /> Cambiar contraseña
        </button>
      </form>
    </Hoja>
  );
}

/** Confirmación fuerte: hay que escribir el usuario. */
export function Confirmar({ a, accion, alCerrar }: { a: Alumno; accion: 'reiniciar' | 'eliminar'; alCerrar: () => void }) {
  const { ejecutar, recargar, abrirDetalle } = useProfesor();
  const [texto, setTexto] = useState('');
  const coincide = texto.trim().toLowerCase() === a.fila.usuario;
  const eliminar = accion === 'eliminar';
  return (
    <Hoja titulo={eliminar ? 'Eliminar usuario' : 'Reiniciar progreso'} alCerrar={alCerrar}>
      <p style={{ margin: 0 }}>
        {eliminar ? (
          <>
            Se borran la cuenta de <strong>{a.fila.nombre}</strong> y todos sus resultados. No se puede deshacer.
          </>
        ) : (
          <>
            Se borran los niveles, las pruebas, las semillas y el registro de <strong>{a.fila.nombre}</strong>. Su cuenta sigue igual y empieza de nuevo con la prueba de entrada. No se puede deshacer.
          </>
        )}
      </p>
      <label className="columna">
        <span>
          Para confirmar, escriba el usuario: <strong>{a.fila.usuario}</strong>
        </span>
        <input className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </label>
      <button
        type="button"
        className="boton peligro"
        disabled={!coincide}
        onClick={async () => {
          const ok = await ejecutar(() => (eliminar ? api.eliminarUsuario(a.fila.id) : api.reiniciarProgreso(a.fila.id)), eliminar ? 'Usuario eliminado' : 'Progreso reiniciado');
          if (!ok) return;
          if (eliminar) abrirDetalle(null);
          await recargar();
          alCerrar();
        }}
      >
        <Icono nombre={eliminar ? 'equis' : 'repetir'} tamano={24} /> {eliminar ? 'Eliminar para siempre' : 'Reiniciar progreso'}
      </button>
    </Hoja>
  );
}

export function ImprimirTarjetas({ lista, texto }: { lista: Credencial[]; texto: string }) {
  const { imprimir } = useProfesor();
  return (
    <button type="button" className="boton" onClick={() => imprimir('Tarjetas de acceso', <HojaTarjetas lista={lista} />)}>
      <Icono nombre="imprimir" tamano={24} /> {texto}
    </button>
  );
}

type Filtro = Grupo | 'todos';

export default function Usuarios() {
  const { alumnos, fotos, abrirDetalle, credenciales } = useProfesor();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [estado, setEstado] = useState<'activos' | 'inactivos'>('activos');
  const [buscar, setBuscar] = useState('');
  const [creando, setCreando] = useState(false);

  const lista = useMemo(() => {
    const q = buscar
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
    return alumnos.filter(
      (a) =>
        (filtro === 'todos' || a.grupo === filtro) &&
        a.fila.activo === (estado === 'activos') &&
        (!q || `${a.fila.nombre} ${a.fila.usuario}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)),
    );
  }, [alumnos, filtro, estado, buscar]);

  const cuenta = (g: Filtro) => alumnos.filter((a) => (g === 'todos' || a.grupo === g) && a.fila.activo === (estado === 'activos')).length;
  const inactivos = alumnos.filter((a) => !a.fila.activo).length;

  return (
    <main className="pantalla panel-pantalla">
      <div className="fila panel-acciones">
        <button type="button" className="boton principal" onClick={() => setCreando(true)}>
          <Icono nombre="agregar" tamano={26} /> Nuevo usuario
        </button>
        {credenciales.length > 0 && <ImprimirTarjetas lista={credenciales} texto={`Imprimir tarjetas de hoy (${credenciales.length})`} />}
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por grupo">
        {(['todos', ...GRUPOS.map((g) => g.id)] as Filtro[]).map((g) => (
          <button key={g} type="button" className={`chip filtro ${filtro === g ? 'activo' : ''}`} aria-pressed={filtro === g} onClick={() => setFiltro(g)}>
            {g === 'todos' ? 'Todos' : nombreGrupo(g)} <span className="suave">{cuenta(g)}</span>
          </button>
        ))}
      </div>
      <div className="fila panel-busqueda">
        <label className="campo-buscar">
          <Icono nombre="buscar" tamano={22} anim="no" />
          <input className="campo" type="search" placeholder="Buscar por nombre o usuario" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar por nombre o usuario" />
        </label>
        {(inactivos > 0 || estado === 'inactivos') && (
          <button type="button" className="chip filtro" aria-pressed={estado === 'inactivos'} onClick={() => setEstado(estado === 'activos' ? 'inactivos' : 'activos')}>
            {estado === 'activos' ? `Ver desactivados (${inactivos})` : 'Ver activos'}
          </button>
        )}
      </div>

      {alumnos.length === 0 && (
        <section className="tarjeta columna centro">
          <Icono nombre="personas" tamano={56} anim="siempre" />
          <p style={{ margin: 0 }}>Todavía no hay usuarios. Cree el primero con «Nuevo usuario»: elija si es estudiante (y su grado), familia o inclusión.</p>
        </section>
      )}
      {alumnos.length > 0 && lista.length === 0 && <p className="tarjeta">No hay usuarios con ese filtro.</p>}

      <ul className="lista-usuarios">
        {lista.map((a) => {
          const i = a.informe;
          const pctTotal = i.ejercicios ? Math.round((100 * i.aciertos) / i.ejercicios) : null;
          return (
            <li key={a.fila.id}>
              <button type="button" className="fila-usuario vidrio" onClick={() => abrirDetalle(a.fila.id)}>
                <span className="anillo-avatar pequeno-anillo">{fotos[a.fila.id] || a.fila.avatar ? <FotoPerfil url={fotos[a.fila.id] ?? null} avatar={a.fila.avatar ?? ''} tamano={40} etiqueta="" /> : <Icono nombre="personas" tamano={30} anim="no" />}</span>
                <span className="fu-nombre">
                  <strong>{a.fila.nombre}</strong>
                  <span className="pequeno suave">
                    {a.fila.usuario} · {nombreGrupo(a.grupo)}
                  </span>
                </span>
                <span className="fu-dato">
                  <span className="pequeno suave">Nivel</span>
                  <strong>{nivelConTotal(i.pista, Math.min(i.nivelMaximo, nivelMaximo(i.pista)))}</strong>
                </span>
                <span className="fu-dato">
                  <span className="pequeno suave">Aciertos</span>
                  <strong>{pctTotal === null ? '—' : `${pctTotal} %`}</strong>
                </span>
                <span className="fu-dato">
                  <span className="pequeno suave">Entrada → final</span>
                  <strong>{i.diagnostica === null ? '—' : `${i.diagnostica} → ${i.final ?? '…'}`}</strong>
                </span>
                <span className="fu-dato">
                  <span className="pequeno suave">Jugó</span>
                  <strong>{hace(a.ultimaActividad)}</strong>
                </span>
                <Icono nombre="siguiente" tamano={22} anim="no" />
              </button>
            </li>
          );
        })}
      </ul>
      {creando && <CrearUsuario alCerrar={() => setCreando(false)} />}
    </main>
  );
}
