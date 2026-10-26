import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContextoApp, type EstadoApp, type Pantalla } from './estado';
import {
  fijarPerfilActivo,
  guardarAjustes,
  guardarPerfil,
  leerAjustes,
  listarPerfiles,
  obtenerPerfil,
  perfilActivo,
  type Ajustes,
  type Perfil,
} from './almacenamiento/datos';
import { alCambiarDisponibilidad, almacenamientoDisponible } from './almacenamiento/almacen';
import { alListoSinInternet } from './pwa/registro';
import Bienvenida from './pantallas/Bienvenida';
import QuienJuega from './pantallas/QuienJuega';

const CrearPerfil = lazy(() => import('./pantallas/CrearPerfil'));
const Mapa = lazy(() => import('./pantallas/Mapa'));
const Nivel = lazy(() => import('./pantallas/Nivel'));
const Resultado = lazy(() => import('./pantallas/Resultado'));
const MiFinca = lazy(() => import('./pantallas/MiFinca'));
const AjustesPantalla = lazy(() => import('./pantallas/Ajustes'));
const Familias = lazy(() => import('./pantallas/Familias'));
const PanelDocente = lazy(() => import('./pantallas/PanelDocente'));
const RetoPareja = lazy(() => import('./pantallas/RetoPareja'));

function pantallaInicial(): Pantalla {
  return listarPerfiles().length ? { nombre: 'quien' } : { nombre: 'bienvenida' };
}

function aplicarTamanoLetra(perfil: Perfil | null, ajustes: Ajustes, pantalla: Pantalla) {
  // Base de 20 px en 1.º y 2.º, 18 px en los demás; ajustable en Ajustes.
  const base = perfil?.grado && perfil.grado <= 2 ? 20 : 18;
  const extra = ajustes.tamanoLetra === 'grande' ? 2 : ajustes.tamanoLetra === 'muy-grande' ? 4 : 0;
  document.documentElement.style.setProperty('--fs-base', `${base + extra}px`);
  // Estética de "cuaderno de la finca" solo en las pantallas de la sección de familias.
  const general = ['bienvenida', 'quien', 'docente', 'pareja'].includes(pantalla.nombre);
  const rol = pantalla.nombre === 'crear' ? pantalla.rol : general ? 'estudiante' : (perfil?.rol ?? 'estudiante');
  document.documentElement.dataset.rol = rol;
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

  const pantalla = pila[pila.length - 1];

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setAviso(null), 4000);
  }, []);

  useEffect(() => alListoSinInternet(() => avisar('Lista para usar sin internet')), [avisar]);
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
    setPila((pilaActual) => {
      if (opciones?.reemplazar) return [...pilaActual.slice(0, -1), p];
      // Pantallas raíz: reinician la pila.
      if (p.nombre === 'mapa' || p.nombre === 'quien' || p.nombre === 'bienvenida') return [p];
      try {
        history.pushState({ finca: true }, '');
      } catch {
        // sin historial
      }
      return [...pilaActual, p];
    });
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
          ⚠️ Este celular no deja guardar datos. Puedes jugar, pero el avance se borrará al cerrar la aplicación.
        </div>
      )}
      <Suspense fallback={<div className="cargando" aria-live="polite">Cargando…</div>}>
        <Contenido pantalla={pantalla} perfil={perfil} />
      </Suspense>
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
    case 'mapa':
      return <Mapa key={perfil!.id} />;
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
  }
}
