import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import { Planta } from '../componentes/Ilustraciones';
import { leerProgreso, pistaDePerfil } from '../almacenamiento/datos';
import { catalogoInsignias, ETAPAS } from '../juego/progresion';
import { estadoSilo } from '../juego/silo';

const nombresEtapa = ['Semilla', 'Brote', 'Planta', 'Flor', 'Fruto', 'Cosecha'];

export default function MiFinca() {
  const { perfil } = useApp();
  const pista = pistaDePerfil(perfil!);
  const prog = leerProgreso(perfil!.id, pista);
  const silo = estadoSilo();
  const etapa = ETAPAS.indexOf(prog.etapaPlanta);
  return (
    <main className="pantalla">
      <Barra titulo="Mi finca" />
      <section className="tarjeta columna centro" aria-label="Mi planta">
        <Planta etapa={prog.etapaPlanta} tamano={180} />
        <p style={{ margin: 0, fontWeight: 800 }}>
          Tu planta de cacao: {nombresEtapa[etapa]} ({etapa + 1} de 6)
        </p>
        <p className="pequeno suave" style={{ margin: 0 }}>
          Crece a medida que avanzas en los niveles.
        </p>
        <span className="semillas">🌱 {prog.semillas} semillas</span>
      </section>
      <section className="tarjeta columna" aria-label="Silo de la escuela">
        <h2>🏚️ Silo de la escuela</h2>
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
      <section className="columna" aria-label="Insignias">
        <h2>Insignias</h2>
        <div className="insignias">
          {catalogoInsignias().map((i) => {
            const tiene = prog.insignias.includes(i.id);
            return (
              <div key={i.id} className={`insignia ${tiene ? '' : 'bloqueada'}`} title={i.descripcion}>
                <span className="icono-insignia" aria-hidden="true">
                  {tiene ? i.icono : '🔒'}
                </span>
                <strong>{i.nombre}</strong>
                <div className="pequeno">{tiene ? i.descripcion : 'Por ganar'}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
