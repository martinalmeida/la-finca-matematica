// Gráficas sencillas para los informes (HTML, sin librerías): barras con su valor
// escrito al lado, leyenda cuando hay dos series y descripción para lectores de pantalla.
// Colores: un solo tono (azul) para magnitudes; naranja = prueba de entrada, azul = final.

import type { ReactNode } from 'react';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)} %`);

/** Barra horizontal de 0 a 100 con su etiqueta y su valor. */
export function BarraPct({ etiqueta, valor, detalle }: { etiqueta: ReactNode; valor: number | null; detalle?: string }) {
  const texto = `${pct(valor)}${detalle ? ` · ${detalle}` : ''}`;
  return (
    <div className="g-fila" title={typeof etiqueta === 'string' ? `${etiqueta}: ${texto}` : texto}>
      <span className="g-etiqueta">{etiqueta}</span>
      <span className="g-pista" role="img" aria-label={`${typeof etiqueta === 'string' ? etiqueta : ''} ${texto}`}>
        {valor !== null && <span className="g-barra" style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />}
      </span>
      <span className="g-valor">{texto}</span>
    </div>
  );
}

/** Barra de conteo (escala propia: el máximo del grupo ocupa todo el ancho). */
export function BarraConteo({ etiqueta, valor, maximo }: { etiqueta: ReactNode; valor: number; maximo: number }) {
  return (
    <div className="g-fila" title={`${typeof etiqueta === 'string' ? etiqueta + ': ' : ''}${valor}`}>
      <span className="g-etiqueta">{etiqueta}</span>
      <span className="g-pista" role="img" aria-label={`${typeof etiqueta === 'string' ? etiqueta : ''} ${valor}`}>
        {valor > 0 && <span className="g-barra" style={{ width: `${maximo > 0 ? (100 * valor) / maximo : 0}%` }} />}
      </span>
      <span className="g-valor">{valor}</span>
    </div>
  );
}

export function LeyendaPruebas() {
  return (
    <div className="g-leyenda" aria-hidden="true">
      <span>
        <i className="g-muestra entrada" /> Prueba de entrada
      </span>
      <span>
        <i className="g-muestra final" /> Prueba final
      </span>
    </div>
  );
}

/** Entrada y final de un tema: dos barras finas, cada una con su valor. */
export function ParPruebas({ etiqueta, antes, despues, nAntes, nDespues }: { etiqueta: string; antes: number | null; despues: number | null; nAntes: number; nDespues: number }) {
  const t = `${etiqueta}. Entrada: ${pct(antes)} (${nAntes}). Final: ${pct(despues)} (${nDespues}).`;
  return (
    <div className="g-par" title={t} role="img" aria-label={t}>
      <span className="g-etiqueta">{etiqueta}</span>
      <span className="g-dobles">
        <span className="g-fila-mini">
          <span className="g-pista">{antes !== null && <span className="g-barra entrada" style={{ width: `${antes}%` }} />}</span>
          <span className="g-valor">{pct(antes)}</span>
        </span>
        <span className="g-fila-mini">
          <span className="g-pista">{despues !== null && <span className="g-barra final" style={{ width: `${despues}%` }} />}</span>
          <span className="g-valor">{pct(despues)}</span>
        </span>
      </span>
    </div>
  );
}

/** Días con actividad de las últimas semanas (más oscuro = más niveles jugados ese día). */
export function Actividad({ dias, semanas = 10, hoy = new Date() }: { dias: Map<string, number>; semanas?: number; hoy?: Date }) {
  const fin = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  // Columnas por semana, de lunes a domingo; la última columna es la semana actual.
  const diaSemana = (fin.getUTCDay() + 6) % 7;
  const inicio = new Date(fin.getTime() - ((semanas - 1) * 7 + diaSemana) * 86_400_000);
  const celdas: { fecha: string; n: number; futuro: boolean }[] = [];
  for (let k = 0; k < semanas * 7; k++) {
    const d = new Date(inicio.getTime() + k * 86_400_000);
    const fecha = d.toISOString().slice(0, 10);
    celdas.push({ fecha, n: dias.get(fecha) ?? 0, futuro: d > fin });
  }
  const total = celdas.filter((c) => c.n > 0).length;
  const nivel = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
  return (
    <figure className="g-actividad" aria-label={`${total} días con actividad en las últimas ${semanas} semanas`}>
      <div className="g-actividad-rejilla" style={{ gridTemplateColumns: `repeat(${semanas}, 1fr)` }}>
        {celdas.map((c) => (
          <span
            key={c.fecha}
            className={`g-dia n${nivel(c.n)} ${c.futuro ? 'futuro' : ''}`}
            title={c.futuro ? '' : `${new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}: ${c.n === 0 ? 'sin actividad' : `${c.n} ${c.n === 1 ? 'partida' : 'partidas'}`}`}
          />
        ))}
      </div>
      <figcaption className="pequeno suave">
        {total} {total === 1 ? 'día' : 'días'} con actividad en las últimas {semanas} semanas · <span className="g-dia n0 muestra" /> ninguna <span className="g-dia n1 muestra" /> 1{' '}
        <span className="g-dia n2 muestra" /> 2–3 <span className="g-dia n3 muestra" /> 4 o más partidas
      </figcaption>
    </figure>
  );
}
