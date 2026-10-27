// Perfil del estudiante (al estilo de las redes): avatar, cifras, ruta del grado, insignias,
// planta de cacao y silo de la escuela.

import { useState } from 'react';
import { useApp } from '../estado';
import { Avatar, Planta } from '../componentes/Ilustraciones';
import { Medidor } from '../componentes/Historia';
import { CabeceraVidrio } from '../componentes/Red';
import { leerProgreso, listarPerfiles, pistaDePerfil } from '../almacenamiento/datos';
import { catalogoInsignias, ETAPAS } from '../juego/progresion';
import { estadoSilo } from '../juego/silo';
import { RESUMEN_GRADO, unidadDe } from '../juego/complejidad';
import { NIVEL_MAXIMO } from '../juego/motor';
import Icono, { IconoEmoji } from '../componentes/Icono';

const nombresEtapa = ['Semilla', 'Brote', 'Planta', 'Flor', 'Fruto', 'Cosecha'];

export default function MiFinca() {
  const { perfil, ir } = useApp();
  const p = perfil!;
  const pista = pistaDePerfil(p);
  const prog = leerProgreso(p.id, pista);
  const silo = estadoSilo();
  const etapa = ETAPAS.indexOf(prog.etapaPlanta);
  const [pestana, setPestana] = useState<'insignias' | 'planta' | 'silo'>('insignias');
  const actual = Math.min(prog.nivelMaximoDesbloqueado, NIVEL_MAXIMO);
  const unidad = unidadDe(pista, actual);
  const estrellas = Object.values(prog.niveles).reduce((s, n) => s + n.estrellas, 0);
  const catalogo = catalogoInsignias();
  const hayPareja = listarPerfiles().filter((x) => x.rol === 'estudiante').length >= 2;

  return (
    <>
      <CabeceraVidrio
        titulo={p.apodo}
        subtitulo={p.codigo}
        derecha={
          <button type="button" className="boton icono vidrio-boton" onClick={() => ir({ nombre: 'ajustes' })} aria-label="Ajustes">
            <Icono nombre="engrane" tamano={28} />
          </button>
        }
      />
      <main className="pantalla">
        <section className="perfil-cabecera vidrio revelar" aria-label="Mi perfil">
          <div className="fila" style={{ flexWrap: 'nowrap', gap: 16 }}>
            <span className="anillo-avatar grande-anillo">
              <Avatar id={p.avatar} tamano={84} />
            </span>
            <div className="cifras">
              <div>
                <strong>{actual}</strong>
                <span>Nivel</span>
              </div>
              <div>
                <strong>{estrellas}</strong>
                <span>Estrellas</span>
              </div>
              <div>
                <strong>{prog.semillas}</strong>
                <span>Semillas</span>
              </div>
            </div>
          </div>
          <div>
            <strong>{RESUMEN_GRADO[pista].nombre}</strong>
            <p className="pequeno" style={{ margin: '2px 0 0' }}>
              {RESUMEN_GRADO[pista].foco}. Voy en la unidad {unidad.indice + 1}: {unidad.titulo}.
            </p>
            <span className={`chip complejidad c-${unidad.complejidad.id}`} style={{ marginTop: 8 }}>
              <Medidor barras={unidad.complejidad.barras} /> Complejidad: {unidad.complejidad.nombre}
            </span>
          </div>
          <div className="fila" style={{ flexWrap: 'nowrap' }}>
            <button type="button" className="boton vidrio-boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'quien' })}>
              <Icono nombre="personas" tamano={26} /> Cambiar jugador
            </button>
            {hayPareja && (
              <button type="button" className="boton vidrio-boton" style={{ flex: 1 }} onClick={() => ir({ nombre: 'pareja' })}>
                <Icono nombre="pareja" tamano={26} /> Reto en pareja
              </button>
            )}
          </div>
        </section>

        <div className="segmentos vidrio" role="tablist" aria-label="Secciones del perfil" style={{ ['--activo' as string]: ['insignias', 'planta', 'silo'].indexOf(pestana) }}>
          <span className="segmento-indicador" aria-hidden="true" />
          {(
            [
              ['insignias', 'Insignias', 'medalla'],
              ['planta', 'Mi planta', 'brote'],
              ['silo', 'Silo', 'silo'],
            ] as const
          ).map(([v, t, i]) => (
            <button key={v} type="button" role="tab" aria-selected={pestana === v} className={`segmento ${pestana === v ? 'activo' : ''}`} onClick={() => setPestana(v)}>
              <Icono key={pestana === v ? 'si' : 'no'} nombre={i} tamano={22} anim={pestana === v ? 'una' : 'no'} /> {t}
            </button>
          ))}
        </div>

        {pestana === 'insignias' && (
          <section className="rejilla-insignias" aria-label="Insignias">
            {catalogo.map((i, k) => {
              const tiene = prog.insignias.includes(i.id);
              return (
                <div key={i.id} className={`insignia vidrio ${tiene ? 'ganada' : 'bloqueada'}`} title={i.descripcion} style={{ animationDelay: `${k * 30}ms` }}>
                  <span className="icono-insignia">{tiene ? <IconoEmoji emoji={i.icono} tamano={40} anim="siempre" /> : <Icono nombre="candado" tamano={34} anim="no" />}</span>
                  <strong>{i.nombre}</strong>
                  <div className="pequeno">{tiene ? i.descripcion : 'Por ganar'}</div>
                </div>
              );
            })}
          </section>
        )}

        {pestana === 'planta' && (
          <section className="vidrio tarjeta-planta columna centro" aria-label="Mi planta">
            <Planta etapa={prog.etapaPlanta} tamano={180} />
            <p style={{ margin: 0, fontWeight: 800 }}>
              Tu planta de cacao: {nombresEtapa[etapa]} ({etapa + 1} de 6)
            </p>
            <div className="etapas" aria-hidden="true">
              {nombresEtapa.map((n, k) => (
                <span key={n} className={k <= etapa ? 'lograda' : ''} />
              ))}
            </div>
            <p className="pequeno suave" style={{ margin: 0 }}>
              Crece a medida que avanzas en los niveles.
            </p>
          </section>
        )}

        {pestana === 'silo' && (
          <section className="vidrio tarjeta-planta columna" aria-label="Silo de la escuela">
            <h2 className="fila">
              <Icono nombre="silo" tamano={34} /> Silo de la escuela
            </h2>
            <p className="pequeno" style={{ margin: 0 }}>
              Aquí se juntan las semillas de todos los jugadores de este celular. Cuando se llena, ¡hay cosecha para todos!
            </p>
            <div className="silo" role="progressbar" aria-valuemin={0} aria-valuemax={silo.capacidad} aria-valuenow={silo.enSilo} aria-label="Semillas en el silo">
              <div style={{ width: `${(silo.enSilo / silo.capacidad) * 100}%` }} />
            </div>
            <p className="pequeno" style={{ margin: 0 }}>
              {silo.enSilo} de {silo.capacidad} semillas · Cosechas colectivas: {silo.cosechas}
            </p>
          </section>
        )}
      </main>
    </>
  );
}
