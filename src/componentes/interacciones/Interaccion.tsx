import Algoritmo from './Algoritmo';
import Arrastrar from './Arrastrar';
import Arreglo from './Arreglo';
import Bloques from './Bloques';
import Contar from './Contar';
import Numerica from './Numerica';
import Opciones from './Opciones';
import Razonable from './Razonable';
import Recta from './Recta';
import Tabla from './Tabla';
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
  }
}
