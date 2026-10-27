import { useMemo, useState } from 'react';
import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Avatar } from '../componentes/Ilustraciones';
import Teclado from '../componentes/Teclado';
import Celebracion from '../componentes/Celebracion';
import { guardarProgreso, leerProgreso, listarPerfiles, pistaDePerfil, sumarRetoPareja, type Perfil } from '../almacenamiento/datos';
import { generarReto, gradosCercanos } from '../juego/pareja';
import { num } from '../contenido/contexto';
import type { Grado } from '../juego/tipos';
import { sonar, vibrar } from '../servicios/sonido';
import Icono from '../componentes/Icono';

function premiar(p: Perfil) {
  const pista = pistaDePerfil(p);
  const prog = leerProgreso(p.id, pista);
  if (!prog.insignias.includes('buen-vecino')) prog.insignias.push('buen-vecino');
  prog.semillas += 5;
  guardarProgreso(p.id, pista, prog);
  sumarRetoPareja(p.id);
}

export default function RetoPareja() {
  const { ir, perfil, ajustes } = useApp();
  const estudiantes = listarPerfiles().filter((p) => p.rol === 'estudiante');
  const [elegidos, setElegidos] = useState<Perfil[]>(() => (perfil?.rol === 'estudiante' ? [perfil] : []));
  const [jugando, setJugando] = useState(false);
  const [k, setK] = useState(0);
  const [paso, setPaso] = useState<0 | 1>(0);
  const [valor, setValor] = useState('');
  const [errores, setErrores] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [fin, setFin] = useState(false);

  const reto = useMemo(
    () => (elegidos.length === 2 ? generarReto(elegidos[0].grado as Grado, elegidos[1].grado as Grado, Date.now()) : []),
    [jugando],
  );

  const volver = () => (perfil ? ir({ nombre: 'inicio' }) : ir({ nombre: 'quien' }));

  if (!jugando) {
    const g0 = elegidos[0]?.grado as Grado | undefined;
    return (
      <main className="pantalla">
        <Barra titulo="Reto en pareja" alVolver={volver} />
        <p>Elijan dos jugadores de grados cercanos. Por turnos, cada uno resuelve un paso del problema. ¡Pueden ayudarse!</p>
        {estudiantes.length < 2 && <p className="tarjeta">Se necesitan al menos dos perfiles de estudiantes en este celular.</p>}
        <div className="rejilla">
          {estudiantes.map((p) => {
            const sel = elegidos.some((e) => e.id === p.id);
            const permitido = sel || !g0 || elegidos.length < 2 && gradosCercanos(g0, p.grado as Grado);
            return (
              <button
                key={p.id}
                type="button"
                className={`perfil-boton ${sel ? 'seleccionado' : ''}`}
                aria-pressed={sel}
                disabled={!permitido}
                onClick={() => setElegidos((e) => (sel ? e.filter((x) => x.id !== p.id) : e.length < 2 ? [...e, p] : e))}
              >
                <Avatar id={p.avatar} />
                <span>{p.apodo}</span>
                <span className="pequeno">{p.grado}.º grado</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="boton principal" disabled={elegidos.length !== 2} onClick={() => setJugando(true)}>
          <Icono nombre="pareja" tamano={30} /> ¡Empezar el reto!
        </button>
      </main>
    );
  }

  const problema = reto[k];
  const jugador = elegidos[(k + paso) % 2];
  const p = problema.pasos[paso];

  const avanzar = () => {
    setMensaje(null);
    setErrores(0);
    setValor('');
    if (paso === 0) setPaso(1);
    else if (k + 1 < reto.length) {
      setK(k + 1);
      setPaso(0);
    } else {
      elegidos.forEach(premiar);
      setFin(true);
    }
  };

  const responder = () => {
    if (Number(valor) === p.respuesta) {
      sonar('acierto', ajustes.sonido);
      vibrar(40, ajustes.vibracion);
      avanzar();
      return;
    }
    const n = errores + 1;
    setErrores(n);
    setValor('');
    sonar('intento', ajustes.sonido);
    setMensaje(n >= 2 ? `La respuesta era ${num(p.respuesta)}. ¡Sigan juntos!` : 'Todavía no. Pídele ayuda a tu compañero y vuelve a intentarlo.');
    if (n >= 2) setTimeout(avanzar, 2500);
  };

  return (
    <main className="pantalla">
      <Barra titulo={`Reto en pareja · ${k + 1} de ${reto.length}`} alVolver={volver} />
      <div className="tarjeta fila" aria-live="polite">
        <Avatar id={jugador.avatar} tamano={52} />
        <div>
          <strong>Turno de {jugador.apodo}</strong>
          <div className="pequeno">Paso {paso + 1} de 2</div>
        </div>
      </div>
      <p className="enunciado">{problema.contexto}</p>
      {paso === 1 && <p className="pequeno suave">Paso 1: {problema.pasos[0].pregunta} → {num(problema.pasos[0].respuesta)}</p>}
      <p className="enunciado" style={{ color: 'var(--verde-oscuro)' }}>
        {p.pregunta}
      </p>
      {mensaje && <div className="retro casi">{mensaje}</div>}
      <Teclado valor={valor} onCambio={setValor} onListo={responder} deshabilitado={errores >= 2} />
      {fin && (
        <Celebracion
          titulo="¡Buenos vecinos!"
          texto={`${elegidos[0].apodo} y ${elegidos[1].apodo} completaron el reto. Cada uno gana 5 semillas y la insignia «Buen vecino».`}
          alCerrar={volver}
        />
      )}
    </main>
  );
}
