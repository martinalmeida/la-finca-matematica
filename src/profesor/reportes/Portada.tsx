// Portada del informe en PDF: título, institución, quién lo generó, cuándo y con qué filtros.

import { Logo } from '../../componentes/Ilustraciones';

export const INSTITUCION = 'Colegio Miradores de Llana Caliente · San Vicente de Chucurí, Santander';

export default function Portada({ titulo, profesor, filtros, resumen }: { titulo: string; profesor: string; filtros: string[]; resumen: string }) {
  const hoy = new Date().toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
  return (
    <header className="portada-informe">
      <div className="fila" style={{ gap: 16, alignItems: 'center' }}>
        <Logo tamano={56} />
        <div>
          <p className="portada-app">La Finca Matemática</p>
          <h1>{titulo}</h1>
        </div>
      </div>
      <p className="portada-institucion">{INSTITUCION}</p>
      <dl className="portada-datos">
        <div>
          <dt>Generado por</dt>
          <dd>{profesor}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{hoy}</dd>
        </div>
        <div>
          <dt>Alcance</dt>
          <dd>{resumen}</dd>
        </div>
        <div>
          <dt>Filtros</dt>
          <dd>
            {filtros.map((l) => (
              <span key={l} className="portada-filtro">
                {l}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <p className="pequeno">Versión de la app {__VERSION__}. Datos sincronizados desde los celulares de los usuarios; lo que no se ha sincronizado todavía no aparece.</p>
    </header>
  );
}
