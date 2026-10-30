import { useState } from 'react';
import { DibujoObjeto, nombreObjeto } from '../Ilustraciones';
import Opciones from './Opciones';
import { PizarraNumero } from './Escribir';
import type { PropsInteraccion } from './tipos';
import { guiaInclusion, palabraConteo, textoHay, useDecir } from './contarEnVoz';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';

/** Contar tocando: cada objeto se marca con su número al tocarlo.
 *  En Inclusión cada toque dice el número en voz alta y, al tocarlos todos, «¡Hay tres!». */
export default function Contar({ ej, bloqueado, onResponder, fallidas, correcta, errores }: PropsInteraccion) {
  const { ajustes } = useApp();
  const decir = useDecir();
  const i = ej.interaccion;
  const [orden, setOrden] = useState<number[]>([]);
  if (i.tipo !== 'contar') return null;
  const inclusion = ej.pista === 'inclusion';
  const tocar = (k: number) => {
    sonar('toque', ajustes.sonido);
    if (inclusion) {
      // Sin desmarcar: tocar uno ya contado repite su número (contar no tiene error).
      const pos = orden.indexOf(k);
      if (pos >= 0) return decir(palabraConteo(pos + 1));
      const n = orden.length + 1;
      setOrden([...orden, k]);
      decir(n === i.cantidad ? `${palabraConteo(n)}. ${textoHay(n, i.objeto)}` : palabraConteo(n));
      return;
    }
    setOrden((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  };
  const todos = inclusion && orden.length === i.cantidad;
  return (
    <div className="columna">
      <div className="objetos" role="group" aria-label={`Toca cada ${nombreObjeto(i.objeto)} para contarlo`}>
        {Array.from({ length: i.cantidad }, (_, k) => {
          const pos = orden.indexOf(k);
          return (
            <button
              key={k}
              type="button"
              className={`objeto-tocable ${pos >= 0 ? 'marcado' : ''}`}
              onClick={() => tocar(k)}
              aria-pressed={pos >= 0}
              aria-label={pos >= 0 ? `Contado: ${palabraConteo(pos + 1)}` : `${nombreObjeto(i.objeto)} sin contar`}
            >
              <DibujoObjeto objeto={i.objeto} tamano={inclusion ? 50 : 44} etiqueta="" />
              {pos >= 0 && <span className="marca">{pos + 1}</span>}
            </button>
          );
        })}
      </div>
      {todos && (
        <p className="hay-total" role="status">
          {textoHay(i.cantidad, i.objeto)}
        </p>
      )}
      {i.escribir ? (
        <>
          <p className="instruccion" style={{ alignSelf: 'center' }}>
            Escribe cuántos hay
          </p>
          <PizarraNumero cifras={2} bloqueado={bloqueado} correcta={typeof correcta === 'number' ? correcta : null} reinicio={errores ?? fallidas.length} onListo={onResponder} />
        </>
      ) : (
        <Opciones opciones={i.opciones} bloqueado={bloqueado} fallidas={fallidas} correcta={correcta} onElegir={onResponder} etiqueta="¿Cuántos hay?" guia={guiaInclusion(ej, fallidas, bloqueado)} />
      )}
    </div>
  );
}
