import { num } from '../../contenido/contexto';
import Numerica from './Numerica';
import Opciones from './Opciones';
import type { PropsInteraccion } from './tipos';

export default function Tabla(props: PropsInteraccion) {
  const i = props.ej.interaccion;
  if (i.tipo !== 'tabla') return null;
  return (
    <div className="columna">
      <div className="tabla-scroll">
        <table className="tabla-datos">
          <thead>
            <tr>
              {i.encabezados.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {i.filas.map((f, k) => (
              <tr key={k}>
                {f.map((c, j) => (j === 0 ? <th key={j} scope="row">{typeof c === 'number' ? num(c) : c}</th> : <td key={j}>{typeof c === 'number' ? num(c) : c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {i.opciones ? (
        <Opciones opciones={i.opciones} bloqueado={props.bloqueado} fallidas={props.fallidas} correcta={props.correcta} onElegir={props.onResponder} />
      ) : (
        <Numerica {...props} />
      )}
    </div>
  );
}
