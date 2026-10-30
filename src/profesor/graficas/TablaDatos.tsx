// Tabla de datos ordenable: clic en el encabezado para ordenar (aria-sort), cifras alineadas
// (tabular-nums), encabezado fijo, desplazamiento lateral dentro de su caja en pantallas angostas
// con la primera columna fija, y filas pulsables cuando hay `alPulsarFila`. Al imprimir se
// muestran todas las columnas, sin desplazamiento y con letra más pequeña.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fmtNum } from './formato';

export type ColumnaTabla<T> = {
  id: string;
  titulo: string;
  /** Valor para ordenar y mostrar (null = sin dato: va al final y se muestra «—»). */
  valor: (f: T) => string | number | null;
  /** Formato del valor (sintaxis de método: acepta también `(v: number) => string`). */
  formato?(v: string | number): string;
  alinear?: 'izq' | 'der';
  ancho?: string;
  ordenable?: boolean;
  /** Contenido propio de la celda (reemplaza al valor formateado). */
  render?: (f: T) => ReactNode;
};

type Props<T> = {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  clave: (f: T) => string;
  ordenInicial?: { id: string; desc?: boolean };
  alPulsarFila?: (f: T) => void;
  /** Texto cuando no hay filas. */
  vacio?: string;
  pie?: ReactNode;
};

const comparar = new Intl.Collator('es', { numeric: true, sensitivity: 'base' }).compare;

export function TablaDatos<T>({ columnas, filas, clave, ordenInicial, alPulsarFila, vacio = 'No hay datos para mostrar.', pie }: Props<T>) {
  const [orden, setOrden] = useState<{ id: string; desc: boolean } | null>(ordenInicial ? { id: ordenInicial.id, desc: !!ordenInicial.desc } : null);

  const ordenadas = useMemo(() => {
    const col = orden && columnas.find((c) => c.id === orden.id);
    if (!col) return filas;
    const signo = orden!.desc ? -1 : 1;
    return [...filas].sort((a, b) => {
      const va = col.valor(a);
      const vb = col.valor(b);
      // Sin dato siempre al final, en cualquier sentido.
      if (va === null || va === '') return vb === null || vb === '' ? 0 : 1;
      if (vb === null || vb === '') return -1;
      if (typeof va === 'number' && typeof vb === 'number') return signo * (va - vb);
      return signo * comparar(String(va), String(vb));
    });
  }, [filas, columnas, orden]);

  const alOrdenar = (id: string) => {
    setOrden((o) => {
      if (o?.id === id) return { id, desc: !o.desc };
      // Las columnas numéricas empiezan de mayor a menor; las de texto, de la A a la Z.
      const col = columnas.find((c) => c.id === id);
      const numerica = col?.alinear === 'der';
      return { id, desc: numerica };
    });
  };

  const celda = (c: ColumnaTabla<T>, f: T): ReactNode => {
    if (c.render) return c.render(f);
    const v = c.valor(f);
    if (v === null || v === '') return <span className="viz-n">—</span>;
    if (c.formato) return c.formato(v);
    return typeof v === 'number' ? fmtNum(v, Number.isInteger(v) ? 0 : 1) : v;
  };

  return (
    <div className="viz viz-tabla-datos">
      <div className="viz-tabla-desplazable">
        <table className={`viz-tabla${alPulsarFila ? ' viz-tabla-pulsable' : ''}`}>
          <colgroup>
            {columnas.map((c) => (
              <col key={c.id} style={c.ancho ? { width: c.ancho } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columnas.map((c) => {
                const activa = orden?.id === c.id;
                const clase = c.alinear === 'der' ? 'viz-num' : undefined;
                return (
                  <th key={c.id} scope="col" className={clase} aria-sort={activa ? (orden!.desc ? 'descending' : 'ascending') : c.ordenable !== false ? 'none' : undefined}>
                    {c.ordenable !== false ? (
                      <button type="button" className="viz-orden" onClick={() => alOrdenar(c.id)}>
                        {c.titulo}
                        <span className="viz-orden-icono" aria-hidden="true">
                          {activa ? (orden!.desc ? '▼' : '▲') : '↕'}
                        </span>
                      </button>
                    ) : (
                      c.titulo
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordenadas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="viz-tabla-vacia">
                  {vacio}
                </td>
              </tr>
            ) : (
              ordenadas.map((f) => (
                <tr key={clave(f)} onClick={alPulsarFila ? () => alPulsarFila(f) : undefined}>
                  {columnas.map((c, i) => {
                    const clase = c.alinear === 'der' ? 'viz-num' : undefined;
                    const contenido = celda(c, f);
                    // La primera celda es el encabezado de la fila; si la fila se puede abrir,
                    // lleva un botón para el teclado (el clic del ratón vale en toda la fila).
                    return i === 0 ? (
                      <th key={c.id} scope="row" className={clase}>
                        {alPulsarFila ? (
                          <button
                            type="button"
                            className="viz-fila-boton"
                            onClick={(e) => {
                              e.stopPropagation();
                              alPulsarFila(f);
                            }}
                          >
                            {contenido}
                          </button>
                        ) : (
                          contenido
                        )}
                      </th>
                    ) : (
                      <td key={c.id} className={clase}>
                        {contenido}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {pie && (
            <tfoot>
              <tr>
                <td colSpan={columnas.length}>{pie}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
