import { useEffect, useRef, useState } from 'react';
import { useApp } from '../estado';
import { Avatar } from '../componentes/Ilustraciones';
import Celebracion from '../componentes/Celebracion';
import { leerProgreso, pistaDePerfil } from '../almacenamiento/datos';
import { ZONAS } from '../juego/progresion';
import { esCosecha, NIVEL_MAXIMO } from '../juego/motor';
import { hayCosechaNueva } from '../juego/silo';

const iconosZona = ['🐔', '🏪', '🍫', '🧺', '🏭'];

export default function Mapa() {
  const { perfil, ir } = useApp();
  const pista = pistaDePerfil(perfil!);
  const progreso = leerProgreso(perfil!.id, pista);
  const adulto = perfil!.rol === 'familia';
  const actual = progreso.nivelMaximoDesbloqueado;
  const refActual = useRef<HTMLButtonElement>(null);
  const [cosecha, setCosecha] = useState(false);

  useEffect(() => {
    // El mapa se desplaza solo hasta el nivel actual.
    refActual.current?.scrollIntoView({ block: 'center' });
    if (hayCosechaNueva()) setCosecha(true);
  }, []);

  const nodo = (n: number) => {
    const estado = progreso.niveles[n];
    const bloqueado = n > actual;
    const esActual = n === actual;
    const offset = Math.round(Math.sin(n * 0.9) * 32);
    const etiqueta = `Nivel ${n}${esCosecha(n) ? ', nivel de cosecha' : ''}${bloqueado ? ', bloqueado' : ''}${estado?.completado ? `, ${estado.estrellas} estrellas` : ''}${esActual ? ', nivel actual' : ''}`;
    return (
      <div key={n} className="nodo-fila" style={{ justifyContent: 'center', transform: `translateX(${offset}%)` }}>
        <button
          ref={esActual ? refActual : undefined}
          type="button"
          className={`nodo ${bloqueado ? 'bloqueado' : ''} ${esActual ? 'actual' : ''} ${esCosecha(n) ? 'cosecha' : ''} ${estado?.completado ? 'completado' : ''}`}
          disabled={bloqueado}
          onClick={() => ir({ nombre: 'nivel', nivel: n })}
          aria-label={etiqueta}
        >
          {bloqueado ? <span aria-hidden="true">🔒</span> : <span>{n}</span>}
          {esCosecha(n) && !bloqueado && <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>🧺</span>}
          {estado?.completado && (
            <span className="estrellas-mini" aria-hidden="true">
              {'★'.repeat(estado.estrellas)}
              {'☆'.repeat(3 - estado.estrellas)}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <header className="cabecera-mapa">
        <div className="fila" style={{ flexWrap: 'nowrap' }}>
          <button type="button" className="boton plano" onClick={() => ir({ nombre: 'quien' })} aria-label="Cambiar de jugador" style={{ padding: 2 }}>
            <Avatar id={perfil!.avatar} tamano={44} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil!.apodo}</div>
            <div className="pequeno suave">
              {adulto ? 'Cuaderno de la finca' : `${perfil!.grado}.º grado`} · Nivel {Math.min(actual, NIVEL_MAXIMO)} de 100
            </div>
          </div>
          <span className="semillas" aria-label={`${progreso.semillas} semillas`}>
            🌱 {progreso.semillas}
          </span>
        </div>
        <nav className="fila" style={{ marginTop: 8 }} aria-label="Menú">
          {adulto ? (
            <>
              <button type="button" className="boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'familias', seccion: 'acompanar' })}>
                💬 Acompañar
              </button>
              <button type="button" className="boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'familias', seccion: 'avance' })}>
                📈 Avance
              </button>
            </>
          ) : (
            <>
              <button type="button" className="boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'mifinca' })}>
                🌳 Mi finca
              </button>
              <button type="button" className="boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'pareja' })}>
                🤝 Pareja
              </button>
            </>
          )}
          <button type="button" className="boton icono" onClick={() => ir({ nombre: 'ajustes' })} aria-label="Ajustes">
            ⚙️
          </button>
        </nav>
      </header>
      <main className="pantalla" style={{ paddingTop: 0 }}>
        <button type="button" className="boton principal" onClick={() => ir({ nombre: 'nivel', nivel: Math.min(actual, NIVEL_MAXIMO) })}>
          ▶ {adulto ? 'Continuar' : 'Jugar'} el nivel {Math.min(actual, NIVEL_MAXIMO)}
        </button>
        <div className="camino" aria-label="Camino de la finca">
          {ZONAS.map((z, k) => (
            <section key={z.nombre} className={`zona zona-${k}`} aria-label={`Zona ${k + 1}: ${z.nombre}`}>
              <h3>
                <span aria-hidden="true">{iconosZona[k]} </span>
                {z.nombre} ({z.inicio}–{z.fin})
              </h3>
              {Array.from({ length: z.fin - z.inicio + 1 }, (_, j) => nodo(z.inicio + j))}
            </section>
          ))}
        </div>
      </main>
      {cosecha && (
        <Celebracion
          titulo="¡Cosecha colectiva!"
          texto="Entre todos los jugadores de este celular llenaron el silo de la escuela. ¡Gracias por trabajar juntos!"
          alCerrar={() => setCosecha(false)}
        />
      )}
    </>
  );
}
