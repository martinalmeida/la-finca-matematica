import { useState } from 'react';
import Teclado from '../Teclado';
import type { PropsInteraccion } from './tipos';

/** Respuesta con el teclado propio. Se reutiliza en otras interacciones. */
export default function Numerica({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const [valor, setValor] = useState('');
  const mostrado = correcta !== null && typeof correcta === 'number' ? String(correcta) : valor;
  return (
    <Teclado
      valor={mostrado}
      onCambio={setValor}
      deshabilitado={bloqueado}
      unidad={ej.unidad}
      decimal={ej.decimales}
      maxCifras={Math.max(3, String(ej.respuesta).length + 2)}
      onListo={() => {
        if (!valor || valor.endsWith('.')) return;
        onResponder(Number(valor));
        setValor('');
      }}
    />
  );
}
