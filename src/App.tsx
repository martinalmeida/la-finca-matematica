import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { ContextoApp, esPestana, useApp, type EstadoApp, type Pantalla } from './estado';
import {
  guardarAjustes,
  guardarCuenta,
  leerAjustes,
  bandaDePerfil,
  leerCuenta,
  necesitaDiagnostica,
  perfilDeFila,
  type Ajustes,
  type FilaPerfil,
  type Perfil,
} from './almacenamiento/datos';
import { alCambiarDisponibilidad, almacenamientoDisponible } from './almacenamiento/almacen';
import { activarCola } from './almacenamiento/cola';
import { alListoSinInternet, marcarOcupada, seActualizo } from './pwa/registro';
import { cerrarSesion } from './servicios/sesion';
import { alSincronizar, iniciarSincronizacion, sincronizarAhora } from './servicios/sincronizacion';
import Entrar from './pantallas/Entrar';
import ElegirAvatar from './pantallas/ElegirAvatar';
import Fondo from './componentes/Fondo';
import Pestanas from './componentes/Pestanas';
import Icono from './componentes/Icono';
import { InvitacionInstalar } from './componentes/Instalar';
import PieAutor from './componentes/PieAutor';

// Pantallas en archivos aparte. Se precargan en segundo plano después de abrir la app,
// así cambiar de pantalla no espera la descarga (ni muestra «Cargando…»).
const precargas: (() => Promise<unknown>)[] = [];
function perezosa<T extends ComponentType<any>>(cargar: () => Promise<{ default: T }>) {
  let promesa: Promise<{ default: T }> | undefined;
  const una = () => (promesa ??= cargar());
  precargas.push(una);
  return lazy(una);
}

const Inicio = perezosa(() => import('./pantallas/Inicio'));
const Mapa = perezosa(() => import('./pantallas/Mapa'));
const Aprender = perezosa(() => import('./pantallas/Aprender'));
const Nivel = perezosa(() => import('./pantallas/Nivel'));
const Resultado = perezosa(() => import('./pantallas/Resultado'));
const MiFinca = perezosa(() => import('./pantallas/MiFinca'));
const AjustesPantalla = perezosa(() => import('./pantallas/Ajustes'));
const Familias = perezosa(() => import('./pantallas/Familias'));
const Taller = perezosa(() => import('./pantallas/Taller'));
const Prueba = perezosa(() => import('./pantallas/Prueba'));
// El panel del profesor no se precarga: los usuarios que juegan nunca lo abren.
const AppProfesor = lazy(() => import('./profesor/AppProfesor'));

function precargarPantallas() {
  const ocioso = (window as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1200));
  ocioso(() => {
    // Una por una para no competir con lo que la persona está haciendo.
    precargas.reduce<Promise<unknown>>((cadena, f) => cadena.then(f).catch(() => undefined), Promise.resolve());
  });
}

function aplicarTamanoLetra(perfil: Perfil | null, ajustes: Ajustes, pantalla: Pantalla | null) {
  // Base de 20 px en Inclusión, 1.º y 2.º; 18 px en los demás; ajustable en Ajustes.
  const base = perfil?.grado && (perfil.grado === 'inclusion' || perfil.grado <= 2) ? 20 : 18;
  const extra = ajustes.tamanoLetra === 'grande' ? 2 : ajustes.tamanoLetra === 'muy-grande' ? 4 : 0;
  document.documentElement.style.setProperty('--fs-base', `${base + extra}px`);
  // Paleta propia (azul) para familias (el panel del profesor la fija por su cuenta).
  const general = !perfil || !pantalla;
  document.documentElement.dataset.rol = perfil ? perfil.rol : 'estudiante';
  // Inclusión: pantalla calmada, siempre con efectos ligeros.
  document.documentElement.dataset.efectos = perfil?.grado === 'inclusion' && !general ? 'ligeros' : ajustes.efectos;
  document.documentElement.dataset.grado = perfil?.grado && !general ? String(perfil.grado) : '';
  // Banda Refuerzo e Inclusión: letra más espaciada y renglones más amplios.
  const espaciado = perfil && (perfil.grado === 'inclusion' || (perfil.rol === 'estudiante' && bandaDePerfil(perfil) === 'refuerzo'));
  document.documentElement.dataset.apoyo = espaciado && !general ? '1' : '';
}

/** Raíz: sin sesión muestra «Entrar»; con sesión, la app del profesor o la del usuario. */
export default function App() {
  const [cuenta, setCuenta] = useState<FilaPerfil | null>(() => leerCuenta());
  // La sesión venció o la cerró el servidor: se vuelve a pedir la contraseña sin borrar el avance.
  const [motivo, setMotivo] = useState<string | null>(null);
  const [sinAlmacen, setSinAlmacen] = useState(!almacenamientoDisponible());

  useEffect(() => alCambiarDisponibilidad(() => setSinAlmacen(!almacenamientoDisponible())), []);

  const salir = useCallback(async (porque?: string) => {
    await cerrarSesion();
    setMotivo(porque ?? null);
    setCuenta(null);
  }, []);

  const pedirClave = useCallback((porque: string) => setMotivo(porque), []);

  let contenido;
  if (!cuenta || motivo) {
    contenido = (
      <Entrar
        usuarioPrevio={cuenta?.usuario}
        motivo={motivo ?? undefined}
        alEntrar={(c) => {
          setMotivo(null);
          setCuenta(c);
        }}
      />
    );
  } else if (cuenta.rol === 'profesor') {
    contenido = (
      <Suspense fallback={<div className="cargando" aria-live="polite">Cargando…</div>}>
        <AppProfesor cuenta={cuenta} alSalir={() => salir()} alVencer={() => pedirClave('Su sesión terminó. Escriba otra vez su contraseña.')} />
      </Suspense>
    );
  } else {
    contenido = <AppUsuario key={cuenta.id} cuenta={cuenta} alCambiarCuenta={setCuenta} salir={salir} pedirClave={pedirClave} />;
  }

  return (
    <>
      {sinAlmacen && (
        <div className="aviso-memoria" role="status">
          <Icono nombre="aviso" tamano={22} /> Este celular no deja guardar datos. Puedes jugar, pero el avance se borrará al cerrar la aplicación.
        </div>
      )}
      {/* El usuario que juega lleva su propio fondo (sigue sus ajustes de efectos). */}
      {(!cuenta || motivo || cuenta.rol === 'profesor') && <Fondo />}
      {(!cuenta || motivo) && <SinSesion />}
      {contenido}
      <PieAutor />
    </>
  );
}

/** Ajustes visuales de la pantalla de entrada y aviso de instalación. */
function SinSesion() {
  useEffect(() => aplicarTamanoLetra(null, leerAjustes(), null), []);
  return <InvitacionInstalar permitida />;
}

type PropsUsuario = {
  cuenta: FilaPerfil;
  alCambiarCuenta: (c: FilaPerfil) => void;
  salir: (porque?: string) => Promise<void>;
  pedirClave: (porque: string) => void;
};

function AppUsuario({ cuenta, alCambiarCuenta, salir, pedirClave }: PropsUsuario) {
  const perfil = useMemo(() => perfilDeFila(cuenta), [cuenta]);
  const [pila, setPila] = useState<Pantalla[]>(() => [{ nombre: 'inicio' }]);
  const [ajustes, setAjustes] = useState<Ajustes>(() => leerAjustes());
  const [aviso, setAviso] = useState<string | null>(null);
  const temporizador = useRef<number>(undefined);

  // Sin prueba diagnóstica no se entra a la ruta: las pestañas y los niveles llevan a ella.
  // La prueba queda en la pila, así su pantalla de resultado no desaparece al terminar.
  const pedida = pila[pila.length - 1];
  const debeDiagnostica = (esPestana(pedida) || pedida.nombre === 'nivel') && necesitaDiagnostica(perfil);
  const pantalla: Pantalla = debeDiagnostica ? { nombre: 'prueba', tipo: 'diagnostica' } : pedida;
  useEffect(() => {
    if (debeDiagnostica) setPila([{ nombre: 'prueba', tipo: 'diagnostica' }]);
  }, [debeDiagnostica]);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setAviso(null), 4000);
  }, []);

  useEffect(() => alListoSinInternet(() => avisar('Lista para usar sin internet')), [avisar]);
  useEffect(() => {
    if (seActualizo()) avisar('La aplicación se actualizó a la última versión');
  }, [avisar]);
  // En un nivel, una prueba, el reto en pareja o el taller no se recarga por una actualización:
  // se aplica al salir.
  useEffect(() => marcarOcupada(['nivel', 'prueba', 'taller'].includes(pantalla.nombre)), [pantalla.nombre]);
  useEffect(precargarPantallas, []);
  useEffect(() => aplicarTamanoLetra(perfil, ajustes, pantalla), [perfil, ajustes, pantalla]);

  // Lo que se juega se guarda en la cola y sube a la nube cuando hay señal.
  useEffect(() => {
    activarCola(cuenta.id);
    return iniciarSincronizacion();
  }, [cuenta.id]);
  useEffect(
    () =>
      alSincronizar(({ estado, cuentaCambio }) => {
        if (estado === 'inactivo') void salir('Tu cuenta fue desactivada. Habla con tu profesor.');
        else if (estado === 'sin-sesion') pedirClave('Escribe otra vez tu contraseña para seguir guardando tu avance.');
        else if (estado === 'reiniciado') {
          setPila([{ nombre: 'inicio' }]);
          avisar('Tu profesor reinició tu progreso: empiezas de nuevo');
        }
        if (cuentaCambio) {
          const c = leerCuenta();
          if (c) alCambiarCuenta(c);
        }
      }),
    [salir, pedirClave, alCambiarCuenta, avisar],
  );

  const elegirAvatar = useCallback(
    (avatar: string) => {
      const c = { ...(leerCuenta() ?? cuenta), avatar, avatarPendiente: true };
      guardarCuenta(c);
      alCambiarCuenta(c);
      void sincronizarAhora();
    },
    [cuenta, alCambiarCuenta],
  );

  // Botón "atrás" de Android: vuelve a la pantalla anterior dentro de la app.
  useEffect(() => {
    const alVolver = () => {
      setPila((p) => (p.length > 1 ? p.slice(0, -1) : p));
    };
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  const ir = useCallback<EstadoApp['ir']>((destino, opciones) => {
    // Cada entrada a un nivel tiene su clave: "Repetir" monta el nivel desde cero.
    const p: Pantalla = destino.nombre === 'nivel' ? { ...destino, clave: destino.clave ?? Date.now() } : destino;
    startTransition(() => setPila((pilaActual) => {
      if (opciones?.reemplazar) return [...pilaActual.slice(0, -1), p];
      // Pantallas raíz (pestañas): reinician la pila.
      if (esPestana(p)) return [p];
      try {
        history.pushState({ finca: true }, '');
      } catch {
        // sin historial
      }
      return [...pilaActual, p];
    }));
    window.scrollTo(0, 0);
  }, []);

  const volver = useCallback(() => {
    setPila((p) => (p.length > 1 ? p.slice(0, -1) : p));
  }, []);

  const valor = useMemo<EstadoApp>(
    () => ({
      pantalla,
      perfil,
      ajustes,
      ir,
      volver,
      avisar,
      salir: () => salir(),
      cambiarAvatar: elegirAvatar,
      cambiarAjustes: (a) => {
        setAjustes(a);
        guardarAjustes(a);
      },
    }),
    [pantalla, perfil, ajustes, ir, volver, avisar, salir, elegirAvatar],
  );

  // La primera vez: elegir personaje (antes de la prueba de entrada).
  const sinAvatar = !perfil.avatar;

  return (
    <ContextoApp.Provider value={valor}>
      <Fondo />
      <Suspense fallback={<div className="cargando" aria-live="polite">Cargando…</div>}>
        {/* La clave cambia con cada pantalla: dispara la animación de entrada. */}
        <div key={sinAvatar ? 'avatar' : `${pila.length}-${pantalla.nombre}-${pantalla.nombre === 'nivel' ? pantalla.clave : ''}`} className={`escenario ${esPestana(pantalla) && !sinAvatar ? 'con-pestanas' : ''}`}>
          {sinAvatar ? <ElegirAvatar perfil={perfil} alElegir={elegirAvatar} /> : <Contenido pantalla={pantalla} perfil={perfil} />}
        </div>
      </Suspense>
      {esPestana(pantalla) && !sinAvatar && <Pestanas />}
      {/* No interrumpe un nivel en curso: se ofrece en las pestañas. */}
      <InvitacionInstalar permitida={!sinAvatar && !['nivel', 'resultado', 'taller', 'prueba'].includes(pantalla.nombre)} />
      {aviso && (
        <div className="aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      )}
    </ContextoApp.Provider>
  );
}

function Contenido({ pantalla, perfil }: { pantalla: Pantalla; perfil: Perfil }) {
  switch (pantalla.nombre) {
    case 'inicio':
      return <Inicio key={perfil.id} />;
    case 'mapa':
      return <Mapa key={perfil.id} />;
    case 'aprender':
      return <Aprender />;
    case 'nivel':
      return <Nivel key={pantalla.clave} nivel={pantalla.nivel} repaso={!!pantalla.repaso} />;
    case 'resultado':
      return <Resultado resultado={pantalla.resultado} efecto={pantalla.efecto} />;
    case 'mifinca':
      return <MiFinca />;
    case 'ajustes':
      return <AjustesPantalla />;
    case 'familias':
      return <Familias seccion={pantalla.seccion ?? 'menu'} />;
    case 'taller':
      return <Taller />;
    case 'prueba':
      return <Prueba key={`${perfil.id}-${pantalla.tipo}`} tipo={pantalla.tipo} />;
    case 'avatar':
      return <CambiarAvatar perfil={perfil} />;
  }
}

function CambiarAvatar({ perfil }: { perfil: Perfil }) {
  const { cambiarAvatar, volver } = useApp();
  return (
    <ElegirAvatar
      perfil={perfil}
      alVolver={volver}
      alElegir={(a) => {
        cambiarAvatar(a);
        volver();
      }}
    />
  );
}
