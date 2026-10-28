// Perfil del estudiante (al estilo de las redes): avatar, cifras, ruta del grado, insignias,
// planta de cacao y silo de la escuela.

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../estado';
import { Planta } from '../componentes/Ilustraciones';
import FotoPerfil from '../componentes/FotoPerfil';
import { prepararFoto, useFoto } from '../servicios/foto';
import { alSincronizar } from '../servicios/sincronizacion';
import { leerCuenta } from '../almacenamiento/datos';
import { Medidor } from '../componentes/Historia';
import { CabeceraVidrio } from '../componentes/Red';
import { bandaDePerfil, haceDiagnostica, leerProgreso, leerPruebas, pistaDePerfil } from '../almacenamiento/datos';
import EstadoNube from '../componentes/EstadoNube';
import Comparacion from '../componentes/Comparacion';
import { catalogoInsignias, ETAPAS } from '../juego/progresion';
import { estadoSilo } from '../juego/silo';
import { nivelConTotal, RESUMEN_GRADO, unidadDe } from '../juego/complejidad';
import { BANDAS, nivelMaximo, temaDe } from '../juego/motor';
import Icono, { IconoEmoji } from '../componentes/Icono';

const nombresEtapa = ['Semilla', 'Brote', 'Planta', 'Flor', 'Fruto', 'Cosecha'];

export default function MiFinca() {
  const { perfil, ir, cambiarFoto, avisar } = useApp();
  const p = perfil!;
  const pista = pistaDePerfil(p);
  const prog = leerProgreso(p.id, pista);
  const silo = estadoSilo();
  const etapa = ETAPAS.indexOf(prog.etapaPlanta);
  const [pestana, setPestana] = useState<'insignias' | 'planta' | 'silo'>('insignias');
  const actual = Math.min(prog.nivelMaximoDesbloqueado, nivelMaximo(pista));
  const unidad = unidadDe(pista, actual);
  const estrellas = Object.values(prog.niveles).reduce((s, n) => s + n.estrellas, 0);
  const catalogo = catalogoInsignias();
  const pruebas = leerPruebas(p);
  const adulto = p.rol === 'familia';
  const foto = useFoto(p.id);
  const refArchivo = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  // Al subir la foto deja de decir «se guardará cuando haya internet».
  const [, refrescar] = useState(0);
  useEffect(() => alSincronizar(() => refrescar((x) => x + 1)), []);
  const fotoPendiente = !!foto && leerCuenta()?.fotoPendiente === 'subir';

  const elegirFoto = async (archivo: File | undefined) => {
    if (!archivo) return;
    setCargando(true);
    setErrorFoto(null);
    try {
      cambiarFoto(await prepararFoto(archivo));
      avisar(adulto ? 'Foto guardada' : '¡Tu foto quedó lista!');
    } catch (e) {
      setErrorFoto(e instanceof Error ? e.message : 'Esa foto no se pudo abrir. Prueba con otra.');
    } finally {
      setCargando(false);
      // Permite volver a elegir el mismo archivo.
      if (refArchivo.current) refArchivo.current.value = '';
    }
  };

  return (
    <>
      <CabeceraVidrio
        titulo={p.nombre}
        subtitulo={`@${p.usuario}`}
        derecha={
          <button type="button" className="boton icono vidrio-boton" onClick={() => ir({ nombre: 'ajustes' })} aria-label="Ajustes">
            <Icono nombre="engrane" tamano={28} />
          </button>
        }
      />
      <main className="pantalla">
        <section className="perfil-cabecera vidrio revelar" aria-label="Mi perfil">
          <div className="fila" style={{ justifyContent: 'center', gap: 16 }}>
            <button
              type="button"
              className="anillo-avatar grande-anillo boton-foto"
              onClick={() => refArchivo.current?.click()}
              disabled={cargando}
              aria-label={foto ? (adulto ? 'Cambiar su foto' : 'Cambiar mi foto') : adulto ? 'Poner su foto' : 'Poner mi foto'}
            >
              <FotoPerfil id={p.id} avatar={p.avatar} tamano={84} etiqueta="" />
              <span className="insignia-camara" aria-hidden="true">
                <Icono nombre="camara" tamano={18} anim="no" />
              </span>
            </button>
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
              {RESUMEN_GRADO[pista].foco}. {adulto ? 'Va' : 'Voy'} en el nivel {nivelConTotal(pista, actual)}: {temaDe(pista, actual).titulo}.
            </p>
            <div className="fila" style={{ marginTop: 8 }}>
              <span className={`chip complejidad c-${unidad.complejidad.id}`}>
                <Medidor barras={unidad.complejidad.barras} /> Complejidad: {unidad.complejidad.nombre}
              </span>
              {haceDiagnostica(p) && !adulto && <span className="chip">Exigencia: {BANDAS[bandaDePerfil(p)].nombre}</span>}
            </div>
          </div>
          <input ref={refArchivo} type="file" accept="image/*" hidden onChange={(e) => void elegirFoto(e.target.files?.[0])} />
          <div className="fila">
            <button type="button" className="boton vidrio-boton" style={{ flex: '1 1 auto' }} disabled={cargando} onClick={() => refArchivo.current?.click()}>
              <Icono nombre="camara" tamano={26} /> {cargando ? 'Preparando…' : foto ? (adulto ? 'Cambiar foto' : 'Cambiar mi foto') : adulto ? 'Poner su foto' : 'Poner mi foto'}
            </button>
            <button type="button" className="boton vidrio-boton" style={{ flex: '1 1 auto' }} onClick={() => ir({ nombre: 'avatar' })}>
              <Icono nombre="personas" tamano={26} /> {adulto ? 'Cambiar personaje' : 'Cambiar mi personaje'}
            </button>
          </div>
          {foto && (
            <p className="pequeno suave fila" style={{ margin: 0, gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                {fotoPendiente
                  ? adulto ? 'Su foto se guardará en la nube cuando haya internet.' : 'Tu foto se guardará en la nube cuando haya internet.'
                  : adulto ? 'Su foto la ven usted y su profesor.' : 'Tu foto la ven tú y tu profesor.'}
              </span>
              <button type="button" className="boton enlace" onClick={() => cambiarFoto(null)}>
                Quitar foto
              </button>
            </p>
          )}
          {errorFoto && (
            <p className="pequeno fila" role="alert" style={{ margin: 0, gap: 6 }}>
              <Icono nombre="aviso" tamano={20} anim="no" /> {errorFoto}
            </p>
          )}
          <EstadoNube adulto={adulto} />
        </section>

        {pruebas.diagnostica && pruebas.final && (
          <section className="columna revelar" aria-label="Antes y después">
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{adulto ? 'Cómo entró y cómo terminó' : 'Cómo entré y cómo terminé'}</h2>
            <Comparacion diagnostica={pruebas.diagnostica} final={pruebas.final} adulto={adulto} />
          </section>
        )}
        {pruebas.diagnostica && !pruebas.final && (
          <p className="tarjeta pequeno" style={{ margin: 0 }}>
            <Icono nombre="medalla" tamano={20} /> {adulto ? 'Prueba de entrada' : 'Mi prueba de entrada'}: {pruebas.diagnostica.aciertos} de {pruebas.diagnostica.total}.{' '}
            {adulto ? 'Al terminar los 10 niveles podrá comparar con la prueba final.' : 'Al terminar los 10 niveles harás la prueba final para ver cuánto aprendiste.'}
          </p>
        )}

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
              Aquí se juntan las semillas de todos los compañeros de la escuela. Cuando se llena, ¡hay cosecha para todos!
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
