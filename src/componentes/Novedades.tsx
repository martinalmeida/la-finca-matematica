// Versión instalada y sus novedades (de CHANGELOG.md), desplegables.

import { COMPILACION, novedadesActuales, VERSION } from '../contenido/novedades';

const fechaLarga = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function Novedades({ adulto = true }: { adulto?: boolean }) {
  const n = novedadesActuales();
  return (
    <details className="novedades">
      <summary>
        <span>
          Versión <strong>{VERSION}</strong>
          {n && n.version === VERSION ? ` · ${fechaLarga(n.fecha)}` : ''}
        </span>
        <span className="pequeno suave">{adulto ? 'Ver qué hay de nuevo' : 'Mira qué hay de nuevo'}</span>
      </summary>
      {n ? (
        <div className="columna" style={{ gap: 8 }}>
          {n.grupos.map((g) => (
            <div key={g.titulo}>
              {g.titulo && <strong className="pequeno">{g.titulo}</strong>}
              <ul>
                {g.puntos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      <p className="pequeno suave" style={{ margin: 0 }}>
        Compilada el {COMPILACION}.
      </p>
    </details>
  );
}
