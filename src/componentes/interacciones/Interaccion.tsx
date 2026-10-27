import Algoritmo from './Algoritmo';
import Arrastrar from './Arrastrar';
import Arreglo from './Arreglo';
import Bloques from './Bloques';
import Clasificar from './Clasificar';
import Contar from './Contar';
import Emparejar from './Emparejar';
import Escribir from './Escribir';
import Figuras from './Figuras';
import Numerica from './Numerica';
import Opciones from './Opciones';
import Ordenar from './Ordenar';
import Razonable from './Razonable';
import Recta from './Recta';
import Tabla from './Tabla';
import Trazar from './Trazar';
import type { PropsInteraccion } from './tipos';

/** Elige el componente táctil según el tipo de interacción del ejercicio. */
export default function Interaccion(props: PropsInteraccion) {
  const i = props.ej.interaccion;
  switch (i.tipo) {
    case 'opciones':
      return <Opciones opciones={i.opciones} bloqueado={props.bloqueado} fallidas={props.fallidas} correcta={props.correcta} onElegir={props.onResponder} />;
    case 'numerica':
      return <Numerica {...props} />;
    case 'contar':
      return <Contar {...props} />;
    case 'arrastrar':
      return <Arrastrar {...props} />;
    case 'arreglo':
      return <Arreglo {...props} />;
    case 'recta':
      return <Recta {...props} />;
    case 'bloques':
      return <Bloques {...props} />;
    case 'algoritmo':
      return <Algoritmo {...props} />;
    case 'razonable':
      return <Razonable {...props} />;
    case 'tabla':
      return <Tabla {...props} />;
    case 'escribir':
      return <Escribir {...props} />;
    case 'trazar':
      return <Trazar {...props} />;
    case 'emparejar':
      return <Emparejar {...props} />;
    case 'figuras':
      return <Figuras {...props} />;
    case 'clasificar':
      return <Clasificar {...props} />;
    case 'ordenar':
      return <Ordenar {...props} />;
  }
}
