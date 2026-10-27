// Taller de números (grado Inclusión): aprender a escribir las cifras 0–9.
// 1) Mira: la cifra se dibuja sola y la voz dice cómo se hace.
// 2) Repasa: trazar encima de la guía punteada, empezando en el punto verde.
// 3) Escribe solo: la app reconoce la cifra y aparecen esos objetos (en la cámara, si está activada).

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useApp } from '../estado';
import { Barra, Estrellas } from '../componentes/Comunes';
import Lienzo from '../componentes/Lienzo';
import type { ConfigEscena } from '../componentes/escenaConfig';
import { cantidadObjeto, DibujoObjeto, esFemenino } from '../componentes/Ilustraciones';
import Icono from '../componentes/Icono';
import { COMO_SE_ESCRIBE, FORMAS, NOMBRES_CIFRA, type Trazo } from '../contenido/cifras';
import CifraAnimada from '../componentes/CifraAnimada';
import { cajaCifra, formaEnCaja, reconocerCifra, revisarRepaso, CONFIANZA_MINIMA } from '../juego/trazos';
import { guardarCifraTaller, leerTaller } from '../almacenamiento/datos';
import { retroError, sonar } from '../servicios/sonido';
import { useVoz } from '../servicios/voz';
import type { Objeto } from '../juego/tipos';

// three.js y LocAR.js solo se descargan al abrir la cámara.
const EscenaRA = lazy(() => import('../componentes/EscenaRA'));

const ANCHO = 260;
const ALTO = 320;
const MARGEN = 34;
const TOLERANCIA = 26;
const OBJETOS: Objeto[] = ['gallina', 'huevo', 'naranja', 'mazorca', 'aguacate', 'mandarina', 'limon', 'platano', 'arepa', 'moneda'];

type Paso = 'mira' | 'repasa' | 'escribe' | 'logrado';

function Practica({ cifra, alVolver }: { cifra: number; alVolver: () => void }) {
  const { ajustes, perfil } = useApp();
  const voz = useVoz();
  const puedeHablar = voz.disponible && ajustes.audioEnunciados;
  const decir = (t: string, k: string) => puedeHablar && voz.leer(t, `taller-${cifra}-${k}`);
  const [paso, setPaso] = useState<Paso>('mira');
  const [vuelta, setVuelta] = useState(0);
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const [mensaje, setMensaje] = useState<{ texto: string; bien: boolean } | null>(null);
  const [avisarGuia, setAvisarGuia] = useState(false);
  const [fallosEscribir, setFallosEscribir] = useState(0);
  const [verEscena, setVerEscena] = useState(false);
  const caja = useMemo(() => cajaCifra(ANCHO, ALTO, MARGEN), []);
  const guia = useMemo(() => formaEnCaja(FORMAS[cifra][0], caja), [cifra, caja]);
  const objeto = OBJETOS[cifra];

  useEffect(() => {
    setTrazos([]);
    // El mensaje de logro se queda: es el que se muestra en la pantalla final.
    if (paso !== 'logrado') setMensaje(null);
    if (paso === 'mira') decir(COMO_SE_ESCRIBE[cifra], 'mira');
    if (paso === 'repasa') decir('Ahora repasa los puntitos con el dedo. Empieza en el punto verde.', 'repasa');
    if (paso === 'escribe') decir(`Ahora escribe el ${NOMBRES_CIFRA[cifra]} tú solo.`, 'escribe');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, cifra, vuelta]);

  const fallar = (texto: string) => {
    retroError(ajustes);
    setMensaje({ texto, bien: false });
    decir(texto, 'error');
  };

  const revisarRepasoActual = () => {
    const r = revisarRepaso(guia, trazos, TOLERANCIA);
    if (r.bien) {
      sonar('acierto', ajustes.sonido);
      if (perfil) guardarCifraTaller(perfil.id, cifra, 1);
      setPaso('escribe');
      return;
    }
    setAvisarGuia(true);
    window.setTimeout(() => setAvisarGuia(false), 900);
    setTrazos([]);
    if (!r.buenInicio) fallar('Empieza en el punto verde.');
    else if (r.dentro < 0.75) fallar('Sigue los puntitos sin salirte.');
    else fallar('Te faltó un pedacito. Repasa todo el número.');
  };

  const revisarEscritura = () => {
    const r = reconocerCifra(trazos);
    const acepta = r && (r.cifra === cifra || (r.confianza < CONFIANZA_MINIMA && r.segunda === cifra));
    if (acepta) {
      sonar('cosecha', ajustes.sonido);
      if (perfil) guardarCifraTaller(perfil.id, cifra, fallosEscribir === 0 ? 3 : 2);
      const texto = cifra === 0 ? '¡Muy bien, un cero! Cero gallinas: el corral está vacío.' : `¡Muy bien, un ${NOMBRES_CIFRA[cifra]}! Mira: ${cantidadObjeto(objeto, cifra)}.`;
      setMensaje({ texto, bien: true });
      decir(texto, 'logrado');
      setPaso('logrado');
      return;
    }
    const n = fallosEscribir + 1;
    setFallosEscribir(n);
    setTrazos([]);
    if (!r) return fallar('Escríbelo más grande, usando todo el cuadro.');
    if (n >= 2) {
      fallar(`Parece un ${r.cifra}. Miremos otra vez cómo se hace el ${cifra}.`);
      window.setTimeout(() => setPaso('mira'), 1600);
    } else fallar(`Parece un ${r.cifra}. Inténtalo otra vez.`);
  };

  const escena: ConfigEscena = { modo: 'cantidad', objeto, cantidad: cifra };

  return (
    <main className="pantalla taller">
      <Barra titulo={`El número ${cifra}`} alVolver={alVolver} />
      <ol className="pasos-taller" aria-label="Pasos">
        {(['mira', 'repasa', 'escribe'] as const).map((p, k) => (
          <li key={p} className={paso === p ? 'actual' : (['mira', 'repasa', 'escribe', 'logrado'].indexOf(paso) > k ? 'hecho' : '')}>
            <span className="numero-paso">{k + 1}</span> {p === 'mira' ? 'Mira' : p === 'repasa' ? 'Repasa' : 'Escribe solo'}
          </li>
        ))}
      </ol>

      {paso === 'mira' && (
        <section className="vidrio tarjeta columna centro">
          <CifraAnimada cifra={cifra} vuelta={vuelta} />
          <p style={{ margin: 0 }}>{COMO_SE_ESCRIBE[cifra]}</p>
          <div className="fila" style={{ justifyContent: 'center' }}>
            <button type="button" className="boton" onClick={() => setVuelta((v) => v + 1)}>
              <Icono nombre="repetir" tamano={24} /> Otra vez
            </button>
            <button type="button" className="boton principal" onClick={() => setPaso('repasa')}>
              <Icono nombre="lapiz" tamano={24} /> Ahora repaso
            </button>
          </div>
        </section>
      )}

      {(paso === 'repasa' || paso === 'escribe') && (
        <section className="vidrio tarjeta columna centro">
          <p className="instruccion" style={{ alignSelf: 'center' }}>
            {paso === 'repasa' ? 'Repasa los puntitos. Empieza en el punto verde.' : `Escribe el ${cifra} tú solo`}
          </p>
          <Lienzo
            ancho={ANCHO}
            alto={ALTO}
            trazos={trazos}
            onTrazos={(t) => {
              setTrazos(t);
              setMensaje(null);
            }}
            guia={paso === 'repasa' ? guia : undefined}
            avisarGuia={avisarGuia}
            etiqueta={paso === 'repasa' ? `Guía del número ${cifra} para repasar` : `Cuadro para escribir el ${cifra}`}
          />
          {mensaje && (
            <p className={`retro ${mensaje.bien ? 'bien' : 'casi'}`} role="status" style={{ margin: 0 }}>
              {mensaje.texto}
            </p>
          )}
          <div className="fila" style={{ justifyContent: 'center' }}>
            <button type="button" className="boton" onClick={() => setTrazos([])} disabled={!trazos.length}>
              <Icono nombre="repetir" tamano={24} anim="no" /> Borrar
            </button>
            <button type="button" className="boton principal" disabled={!trazos.length} onClick={paso === 'repasa' ? revisarRepasoActual : revisarEscritura}>
              <Icono nombre="check" tamano={24} /> Listo
            </button>
          </div>
          {paso === 'escribe' && (
            <button type="button" className="boton secundario" onClick={() => setPaso('mira')}>
              <Icono nombre="ojo" tamano={24} /> Ver otra vez cómo se hace
            </button>
          )}
        </section>
      )}

      {paso === 'logrado' && mensaje && (
        <section className="vidrio tarjeta columna centro">
          <Estrellas n={fallosEscribir === 0 ? 3 : 2} />
          <p className="retro bien" role="status" style={{ margin: 0 }}>
            {mensaje.texto}
          </p>
          {cifra > 0 && (
            <div className="objetos-logrados" aria-hidden="true">
              {Array.from({ length: cifra }, (_, k) => (
                <span key={k} style={{ animationDelay: `${k * 120}ms` }}>
                  <DibujoObjeto objeto={objeto} tamano={44} etiqueta="" />
                </span>
              ))}
            </div>
          )}
          {ajustes.realidadAumentada && cifra > 0 && (
            <button type="button" className="boton boton-camara" onClick={() => setVerEscena(true)}>
              <Icono nombre="camara" tamano={26} /> Verlos en mi finca
            </button>
          )}
          <div className="fila" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="boton"
              onClick={() => {
                setFallosEscribir(0);
                setPaso('escribe');
              }}
            >
              <Icono nombre="repetir" tamano={24} /> Escribirlo otra vez
            </button>
            <button type="button" className="boton principal" onClick={alVolver}>
              Otro número <Icono nombre="siguiente" tamano={24} />
            </button>
          </div>
        </section>
      )}

      {verEscena && (
        <Suspense fallback={null}>
          <EscenaRA
            config={escena}
            titulo={`El ${cifra} en mi finca`}
            mensaje={`¡${cantidadObjeto(objeto, cifra)}! ${esFemenino(objeto) ? 'Tócalas para contarlas' : 'Tócalos para contarlos'}.`}
            alCerrar={() => setVerEscena(false)}
          />
        </Suspense>
      )}
    </main>
  );
}

export default function Taller() {
  const { perfil, ajustes } = useApp();
  const [cifra, setCifra] = useState<number | null>(null);
  const [verReal, setVerReal] = useState(false);
  const [estrellas, setEstrellas] = useState(() => (perfil ? leerTaller(perfil.id) : {}));

  if (cifra !== null) {
    return (
      <Practica
        key={cifra}
        cifra={cifra}
        alVolver={() => {
          setCifra(null);
          if (perfil) setEstrellas(leerTaller(perfil.id));
        }}
      />
    );
  }

  return (
    <main className="pantalla taller">
      <Barra titulo="Taller de números" />
      <p style={{ margin: 0 }}>Aprende a escribir los números con el dedo. Elige uno:</p>
      <div className="rejilla-cifras" role="list">
        {Array.from({ length: 10 }, (_, c) => (
          <button key={c} type="button" role="listitem" className="boton-cifra vidrio" onClick={() => setCifra(c)} aria-label={`Número ${c}, ${estrellas[c] ?? 0} de 3 estrellas`}>
            <span className="cifra-grande">{c}</span>
            <span className="estrellitas" aria-hidden="true">
              {[1, 2, 3].map((k) => (
                <span key={k} className={(estrellas[c] ?? 0) >= k ? 'llena' : ''}>
                  ★
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      {ajustes.realidadAumentada && (
        <section className="vidrio tarjeta columna">
          <h2 className="fila" style={{ margin: 0 }}>
            <Icono nombre="camara" tamano={30} /> Mi finca en la cámara
          </h2>
          <p className="pequeno" style={{ margin: 0 }}>
            Apunta la cámara a huevos, frutas o piedras de verdad y toca cada uno para contarlo.
          </p>
          <button type="button" className="boton principal" onClick={() => setVerReal(true)}>
            <Icono nombre="camara" tamano={24} /> Contar cosas de verdad
          </button>
        </section>
      )}

      {verReal && (
        <Suspense fallback={null}>
          <EscenaRA config={{ modo: 'real' }} titulo="Contar cosas de verdad" instruccion="Toca cada cosa para contarla." alCerrar={() => setVerReal(false)} />
        </Suspense>
      )}
    </main>
  );
}
