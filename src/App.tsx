import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { ContextoApp, esPestana, type EstadoApp, type Pantalla } from './estado';
import {
  fijarPerfilActivo,
  guardarAjustes,
  guardarPerfil,
  leerAjustes,
  bandaDePerfil,
  listarPerfiles,
  necesitaDiagnostica,
  obtenerPerfil,
  perfilActivo,
  type Ajustes,
  type Perfil,
} from './almacenamiento/datos';
import { alCambiarDisponibilidad, almacenamientoDisponible } from './almacenamiento/almacen';
import { alListoSinInternet } from './pwa/registro';
import Bienvenida from './pantallas/Bienvenida';
import QuienJuega from './pantallas/QuienJuega';
import Fondo from './componentes/Fondo';
import Pestanas from './componentes/Pestanas';
import Icono from './componentes/Icono';
import { InvitacionInstalar } from './componentes/Instalar';
import { DERECHOS, PROGRAMA } from './contenido/autoria';

// Pantallas en archivos aparte. Se precargan en segundo plano después de abrir la app,
// así cambiar de pantalla no espera la descarga (ni muestra «Cargando…»).
const precargas: (() => Promise<unknown>)[] = [];
function perezosa<T extends ComponentType<any>>(cargar: () => Promise<{ default: T }>) {
  let promesa: Promise<{ default: T }> | undefined;
  const una = () => (promesa ??= cargar());
  precargas.push(una);
  return lazy(una);
}

const CrearPerfil = perezosa(() => import('./pantallas/CrearPerfil'));
const Inicio = perezosa(() => import('./pantallas/Inicio'));
const Mapa = perezosa(() => import('./pantallas/Mapa'));
const Aprender = perezosa(() => import('./pantallas/Aprender'));
const Nivel = perezosa(() => import('./pantallas/Nivel'));
const Resultado = perezosa(() => import('./pantallas/Resultado'));
const MiFinca = perezosa(() => import('./pantallas/MiFinca'));
const AjustesPantalla = perezosa(() => import('./pantallas/Ajustes'));
const Familias = perezosa(() => import('./pantallas/Familias'));
const PanelDocente = perezosa(() => import('./pantallas/PanelDocente'));
const RetoPareja = perezosa(() => import('./pantallas/RetoPareja'));
const Taller = perezosa(() => import('./pantallas/Taller'));
const Prueba = perezosa(() => import('./pantallas/Prueba'));

function precargarPantallas() {
  const ocioso = (window as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1200));
  ocioso(() => {
    // Una por una para no competir con lo que la persona está haciendo.
    precargas.reduce<Promise<unknown>>((cadena, f) => cadena.then(f).catch(() => undefined), Promise.resolve());
  });
}

function pantallaInicial(): Pantalla {
  return listarPerfiles().length ? { nombre: 'quien' } : { nombre: 'bienvenida' };
}

function aplicarTamanoLetra(perfil: Perfil | null, ajustes: Ajustes, pantalla: Pantalla) {
  // Base de 20 px en Inclusión, 1.º y 2.º; 18 px en los demás; ajustable en Ajustes.
  const base = perfil?.grado && (perfil.grado === 'inclusion' || perfil.grado <= 2) ? 20 : 18;
  const extra = ajustes.tamanoLetra === 'grande' ? 2 : ajustes.tamanoLetra === 'muy-grande' ? 4 : 0;
  document.documentElement.style.setProperty('--fs-base', `${base + extra}px`);
  // Paleta propia (azul) en las pantallas de la sección de familias.
  const general = ['bienvenida', 'quien', 'docente', 'pareja'].includes(pantalla.nombre);
  const rol = pantalla.nombre === 'crear' ? pantalla.rol : general ? 'estudiante' : (perfil?.rol ?? 'estudiante');
  document.documentElement.dataset.rol = rol;
  // Inclusión: pantalla calmada, siempre con efectos ligeros.
  document.documentElement.dataset.efectos = perfil?.grado === 'inclusion' && !general ? 'ligeros' : ajustes.efectos;
  document.documentElement.dataset.grado = perfil?.grado && !general ? String(perfil.grado) : '';
  // Banda Refuerzo e Inclusión: letra más espaciada y renglones más amplios.
  const espaciado = perfil && (perfil.grado === 'inclusion' || (perfil.rol === 'estudiante' && bandaDePerfil(perfil) === 'refuerzo'));
  document.documentElement.dataset.apoyo = espaciado && !general ? '1' : '';
}

export default function App() {
  const [pila, setPila] = useState<Pantalla[]>(() => [pantallaInicial()]);
  const [perfil, setPerfil] = useState<Perfil | null>(() => {
    const id = perfilActivo();
    return id ? (obtenerPerfil(id) ?? null) : null;
  });
  const [ajustes, setAjustes] = useState<Ajustes>(() => leerAjustes());
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinAlmacen, setSinAlmacen] = useState(!almacenamientoDisponible());
  const temporizador = useRef<number>(undefined);

  // Sin prueba diagnóstica no se entra a la ruta: las pestañas y los niveles llevan a ella.
  // La prueba queda en la pila, así su pantalla de resultado no desaparece al terminar.
  const pedida = pila[pila.length - 1];
  const debeDiagnostica = !!perfil && (esPestana(pedida) || pedida.nombre === 'nivel') && necesitaDiagnostica(perfil);
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
  useEffect(precargarPantallas, []);
  useEffect(() => alCambiarDisponibilidad(() => setSinAlmacen(!almacenamientoDisponible())), []);
  useEffect(() => aplicarTamanoLetra(perfil, ajustes, pantalla), [perfil, ajustes, pantalla]);

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
      // Pantallas raíz (pestañas, ¿quién juega?, bienvenida): reinician la pila.
      if (esPestana(p) || p.nombre === 'quien' || p.nombre === 'bienvenida') return [p];
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
      elegirPerfil: (p) => {
        setPerfil(p);
        fijarPerfilActivo(p?.id ?? null);
      },
      actualizarPerfil: (p) => {
        guardarPerfil(p);
        setPerfil(p);
      },
      cambiarAjustes: (a) => {
        setAjustes(a);
        guardarAjustes(a);
      },
    }),
    [pantalla, perfil, ajustes, ir, volver, avisar],
  );

  return (
    <ContextoApp.Provider value={valor}>
      {sinAlmacen && (
        <div className="aviso-memoria" role="status">
          <Icono nombre="aviso" tamano={22} /> Este celular no deja guardar datos. Puedes jugar, pero el avance se borrará al cerrar la aplicación.
        </div>
      )}
      <Fondo />
      <Suspense fallback={<div className="cargando" aria-live="polite">Cargando…</div>}>
        {/* La clave cambia con cada pantalla: dispara la animación de entrada. */}
        <div key={`${pila.length}-${pantalla.nombre}-${pantalla.nombre === 'nivel' ? pantalla.clave : ''}`} className={`escenario ${esPestana(pantalla) ? 'con-pestanas' : ''}`}>
          <Contenido pantalla={pantalla} perfil={perfil} />
          {/* Autoría: siempre al pie de cada pantalla. */}
          <footer className="pie-autor">
            {DERECHOS}
            <br />
            {PROGRAMA} · UDI, Santander, Colombia
          </footer>
        </div>
      </Suspense>
      {perfil && esPestana(pantalla) && <Pestanas />}
      {/* No interrumpe un nivel en curso: se ofrece en las pantallas de entrada y en las pestañas. */}
      <InvitacionInstalar permitida={!['nivel', 'resultado', 'pareja', 'crear', 'taller', 'prueba'].includes(pantalla.nombre)} />
      {aviso && (
        <div className="aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      )}
    </ContextoApp.Provider>
  );
}

function Contenido({ pantalla, perfil }: { pantalla: Pantalla; perfil: Perfil | null }) {
  // Pantallas que necesitan un perfil activo.
  const requiere = !['bienvenida', 'quien', 'crear', 'docente', 'pareja'].includes(pantalla.nombre);
  if (requiere && !perfil) return <QuienJuega />;
  switch (pantalla.nombre) {
    case 'bienvenida':
      return <Bienvenida />;
    case 'quien':
      return <QuienJuega />;
    case 'crear':
      return <CrearPerfil rol={pantalla.rol} />;
    case 'inicio':
      return <Inicio key={perfil!.id} />;
    case 'mapa':
      return <Mapa key={perfil!.id} />;
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
    case 'docente':
      return <PanelDocente />;
    case 'pareja':
      return <RetoPareja />;
    case 'taller':
      return <Taller />;
    case 'prueba':
      return <Prueba key={`${perfil!.id}-${pantalla.tipo}`} tipo={pantalla.tipo} />;
  }
}
