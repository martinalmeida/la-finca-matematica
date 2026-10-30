// Invitación a instalar la aplicación: ventana nativa en Android y pasos guiados en iPhone/iPad.
// Se ofrece cada vez que se abre la app desde el navegador, hasta que quede instalada.
// Trato: tú en la entrada y para los estudiantes; usted para las familias (como el resto de la app).

/** Elige el texto según el trato: (tú, usted). */
type Trato = (tu: string, usted: string) => string;

import { useCapaConAtras } from '../servicios/atras';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { ContextoApp } from '../estado';
import {
  alCambiarInstalable,
  detectarPlataforma,
  enlaceAbrirEnChrome,
  enlaceAbrirEnSafari,
  esAppNativa,
  estaInstalada,
  instalar,
  puedeInstalar,
  seInstaloRecien,
  versionIos,
  type Plataforma,
} from '../pwa/registro';
import Icono from './Icono';
import { useTapaTeclas } from '../servicios/teclas';

const CLAVE_POSPUESTO = 'finca-instalar-pospuesto';

function pospuesta(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_POSPUESTO) === '1';
  } catch {
    return false;
  }
}

function posponer() {
  try {
    sessionStorage.setItem(CLAVE_POSPUESTO, '1');
  } catch {
    // sin almacenamiento: volverá a preguntar al recargar
  }
}

/** Estado de instalación que se actualiza solo cuando llega o se usa la ventana nativa. */
export function useInstalacion() {
  const leer = () => ({ puede: puedeInstalar(), instalada: estaInstalada(), recien: seInstaloRecien() });
  const [estado, setEstado] = useState(leer);
  useEffect(() => alCambiarInstalable(() => setEstado(leer())), []);
  return estado;
}

/** Debe mostrarse la invitación automática al abrir la app. */
export function debeInvitar(): boolean {
  return !esAppNativa() && !estaInstalada() && !pospuesta();
}

function Paso({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="paso-instalar">
      <span className="paso-numero">{n}</span>
      <span>{children}</span>
    </li>
  );
}

/** Ícono pequeño tal como aparece en el navegador, dentro del texto. */
function Marca({ nombre, texto }: { nombre?: string; texto?: string }) {
  return (
    <span className="marca-navegador">
      {nombre && <Icono nombre={nombre} tamano={18} anim="no" />}
      {texto && <span>{texto}</span>}
    </span>
  );
}

function Pasos({ plataforma, t }: { plataforma: Plataforma; t: Trato }) {
  const ios = versionIos();
  switch (plataforma) {
    case 'ios-safari':
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>
            {t('Toca', 'Toque')} el botón Compartir <Marca nombre="compartir" /> en la barra de Safari (abajo en el iPhone, arriba en el iPad). Si no {t('lo ves, toca', 'lo ve, toque')} primero <Marca texto="•••" />.
          </Paso>
          <Paso n={2}>
            {t('Baja en la lista y toca', 'Baje en la lista y toque')} <Marca nombre="agregar" texto="Agregar a inicio" />.
          </Paso>
          <Paso n={3}>
            {t('Deja activado «Abrir como app web» y toca', 'Deje activado «Abrir como app web» y toque')} <strong>Agregar</strong>. El ícono de la mazorca quedará en la pantalla del celular.
          </Paso>
        </ol>
      );
    case 'ios-otro':
      if (ios !== null && ios < 16.4) return <AbrirEn navegador="Safari" enlace={null} t={t} />;
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>
            {t('Toca', 'Toque')} el botón Compartir <Marca nombre="compartir" /> (en Chrome está arriba, junto a la dirección).
          </Paso>
          <Paso n={2}>
            {t('Toca', 'Toque')} <Marca nombre="agregar" texto="Agregar a pantalla de inicio" />. Si no aparece, {t('abre', 'abra')} esta página en Safari.
          </Paso>
          <Paso n={3}>
            {t('Toca', 'Toque')} <strong>Agregar</strong>.
          </Paso>
        </ol>
      );
    case 'ios-app':
      return <AbrirEn navegador="Safari" enlace={ios !== null && ios >= 17 ? enlaceAbrirEnSafari() : null} t={t} />;
    case 'android-app':
      return <AbrirEn navegador="Chrome" enlace={enlaceAbrirEnChrome()} t={t} />;
    case 'android-samsung':
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>
            {t('Toca', 'Toque')} el menú <strong>☰</strong> abajo a la derecha.
          </Paso>
          <Paso n={2}>
            {t('Toca', 'Toque')} <Marca nombre="agregar" texto="Agregar página a" /> y luego <strong>Pantalla de inicio</strong>.
          </Paso>
          <Paso n={3}>
            {t('Confirma', 'Confirme')} con <strong>Agregar</strong>.
          </Paso>
        </ol>
      );
    case 'android-firefox':
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>
            {t('Toca', 'Toque')} el menú <Marca nombre="puntos" /> de Firefox.
          </Paso>
          <Paso n={2}>
            {t('Toca', 'Toque')} <Marca nombre="agregar" texto="Instalar" /> o «Agregar a pantalla de inicio».
          </Paso>
          <Paso n={3}>
            {t('Confirma', 'Confirme')} con <strong>Agregar</strong>.
          </Paso>
        </ol>
      );
    case 'android-chrome':
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>
            {t('Toca', 'Toque')} el menú <Marca nombre="puntos" /> arriba a la derecha.
          </Paso>
          <Paso n={2}>
            {t('Toca', 'Toque')} <Marca nombre="celular" texto="Instalar aplicación" /> o «Agregar a la pantalla principal».
          </Paso>
          <Paso n={3}>
            {t('Confirma', 'Confirme')} con <strong>Instalar</strong>.
          </Paso>
        </ol>
      );
    case 'escritorio':
      return (
        <ol className="pasos-instalar">
          <Paso n={1}>En Chrome o Edge, {t('toca el ícono de instalar al final de la barra de direcciones, o abre', 'toque el ícono de instalar al final de la barra de direcciones, o abra')} el menú del navegador.</Paso>
          <Paso n={2}>{t('Elige', 'Elija')} «Instalar La Finca Matemática».</Paso>
        </ol>
      );
  }
}

function AbrirEn({ navegador, enlace, t }: { navegador: 'Chrome' | 'Safari'; enlace: string | null; t: Trato }) {
  return (
    <div className="columna">
      <p>
        Esta página está abierta dentro de otra aplicación (WhatsApp, Facebook…). Desde aquí no se puede instalar: {t('ábrela', 'ábrala')} en <strong>{navegador}</strong>.
      </p>
      {enlace && (
        <a className="boton principal" href={enlace}>
          Abrir en {navegador}
        </a>
      )}
      <ol className="pasos-instalar">
        <Paso n={1}>
          {t('Toca', 'Toque')} el menú {navegador === 'Safari' ? <Marca texto="•••" /> : <Marca nombre="puntos" />} o el botón Compartir <Marca nombre="compartir" />.
        </Paso>
        <Paso n={2}>
          {t('Elige', 'Elija')} «Abrir en {navegador}» o «Abrir en el navegador».
        </Paso>
        <Paso n={3}>Allá aparecerá de nuevo esta invitación para instalar.</Paso>
      </ol>
    </div>
  );
}

/** Hoja inferior con el botón de instalar o los pasos para este celular. */
export function HojaInstalar({ alCerrar, automatica = false }: { alCerrar: () => void; automatica?: boolean }) {
  // Ventana encima: las teclas no le llegan a lo que quedó debajo.
  useTapaTeclas();
  const { puede, instalada, recien } = useInstalacion();
  useCapaConAtras(true, alCerrar);
  // Sin sesión (pantalla de entrada) o estudiante: tú. Familia: usted.
  const adulto = useContext(ContextoApp)?.perfil.rol === 'familia';
  const t: Trato = (tu, usted) => (adulto ? usted : tu);
  const [plataforma] = useState(detectarPlataforma);
  const [rechazo, setRechazo] = useState(false);
  const [esperando, setEsperando] = useState(plataforma === 'android-chrome' || plataforma === 'android-samsung' || plataforma === 'escritorio');
  const ios = plataforma.startsWith('ios');

  // Chrome tarda unos segundos en ofrecer la ventana nativa: se espera antes de mostrar los pasos manuales.
  useEffect(() => {
    if (!esperando || puede) return;
    const t = window.setTimeout(() => setEsperando(false), 3500);
    return () => window.clearTimeout(t);
  }, [esperando, puede]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  });

  function cerrar() {
    if (automatica) posponer();
    alCerrar();
  }

  let cuerpo: ReactNode;
  if (recien || instalada) {
    cuerpo = (
      <>
        <p className="fila">
          <Icono nombre="check" tamano={28} /> <strong>¡Listo! La Finca Matemática quedó instalada.</strong>
        </p>
        <p>{t('Ciérrala aquí y ábrela', 'Ciérrela aquí y ábrala')} desde el ícono de la mazorca en la pantalla del celular. Funciona sin internet.</p>
        <button type="button" className="boton principal" onClick={alCerrar}>
          Entendido
        </button>
      </>
    );
  } else if (puede) {
    cuerpo = (
      <>
        <p>Queda como una aplicación más del celular: se abre con un toque, a pantalla completa y funciona sin internet.</p>
        <button
          type="button"
          className="boton principal brillo"
          onClick={async () => {
            const r = await instalar();
            if (r === 'rechazada' || r === 'sin-ventana') setRechazo(true);
          }}
        >
          <Icono nombre="celular" tamano={30} anim="siempre" /> Instalar ahora
        </button>
      </>
    );
  } else if (esperando) {
    cuerpo = (
      <p className="fila suave" aria-live="polite">
        <Icono nombre="celular" tamano={28} anim="siempre" /> Preparando la instalación…
      </p>
    );
  } else {
    cuerpo = (
      <>
        {!plataforma.endsWith('-app') && (
          <p>
            {rechazo
              ? t('Si cambiaste de opinión, puedes instalarla a mano.', 'Si cambió de opinión, puede instalarla a mano.')
              : ios
                ? 'En iPhone y iPad se instala en tres pasos.'
                : t('Sigue estos pasos.', 'Siga estos pasos.')}
          </p>
        )}
        <Pasos plataforma={plataforma} t={t} />
        {!adulto && (
          <p className="hoja-nota">
            <Icono nombre="apoyo" tamano={22} anim="no" /> Si necesitas ayuda, pídesela a un adulto.
          </p>
        )}
        {ios && (
          <p className="hoja-nota">
            <Icono nombre="dato" tamano={22} anim="no" />
            <span>
              La app instalada guarda sus datos aparte de Safari. Al abrirla, {t('vuelve', 'vuelva')} a entrar con el usuario y la contraseña: el avance que ya se subió a la nube aparece ahí.
            </span>
          </p>
        )}
      </>
    );
  }

  return (
    <div className="velo-instalar" onClick={cerrar}>
      <section className="hoja-instalar tarjeta columna" role="dialog" aria-modal="true" aria-labelledby="titulo-instalar" onClick={(e) => e.stopPropagation()}>
        <header className="hoja-cabeza">
          <img src="./iconos/icono-apple-180.png" alt="" width={56} height={56} className="hoja-logo" />
          <div className="hoja-cabeza-textos">
            <h2 id="titulo-instalar">{t('Instala', 'Instale')} La Finca Matemática</h2>
            <p className="pequeno suave">Gratis · sin anuncios</p>
          </div>
          <button type="button" className="boton icono" onClick={cerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tamano={22} />
          </button>
        </header>
        {cuerpo}
        {!(recien || instalada) && (
          <button type="button" className="boton plano" onClick={cerrar}>
            Ahora no
          </button>
        )}
      </section>
    </div>
  );
}

/** Se monta una vez en App: ofrece la instalación al abrir la app desde el navegador. */
export function InvitacionInstalar({ permitida }: { permitida: boolean }) {
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    if (!permitida || abierta || !debeInvitar()) return;
    const t = window.setTimeout(() => setAbierta(debeInvitar()), 1200);
    return () => window.clearTimeout(t);
  }, [permitida, abierta]);
  if (!abierta) return null;
  return <HojaInstalar automatica alCerrar={() => setAbierta(false)} />;
}

/** Botón "Instalar en este celular" para Bienvenida y Ajustes. */
export function BotonInstalar() {
  const { instalada } = useInstalacion();
  const [abierta, setAbierta] = useState(false);
  if (esAppNativa()) return null;
  if (instalada)
    return (
      <p className="pequeno suave fila">
        <Icono nombre="check" tamano={20} /> La aplicación ya está instalada en este celular.
      </p>
    );
  return (
    <>
      <button type="button" className="boton secundario" onClick={() => setAbierta(true)}>
        <Icono nombre="celular" tamano={28} /> Instalar en este celular
      </button>
      {abierta && <HojaInstalar alCerrar={() => setAbierta(false)} />}
    </>
  );
}
