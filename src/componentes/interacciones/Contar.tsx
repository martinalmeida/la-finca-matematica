import { useState } from 'react';
import { DibujoObjeto, nombreObjeto } from '../Ilustraciones';
import Opciones from './Opciones';
import { PizarraNumero } from './Escribir';
import type { PropsInteraccion } from './tipos';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';

/** Contar tocando: cada objeto se marca con su número al tocarlo. */
export default function Contar({ ej, bloqueado, onResponder, fallidas, correcta, errores }: PropsInteraccion) {
  const { ajustes } = useApp();
  const i = ej.interaccion;
  const [orden, setOrden] = useState<number[]>([]);
  if (i.tipo !== 'contar') return null;
  const tocar = (k: number) => {
    sonar('toque', ajustes.sonido);
    setOrden((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  };
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
              aria-label={pos >= 0 ? `Contado: ${pos + 1}` : `${nombreObjeto(i.objeto)} sin contar`}
            >
              <DibujoObjeto objeto={i.objeto} tamano={44} etiqueta="" />
              {pos >= 0 && <span className="marca">{pos + 1}</span>}
            </button>
          );
        })}
      </div>
      {i.escribir ? (
        <>
          <p className="instruccion" style={{ alignSelf: 'center' }}>
            Escribe cuántos hay
          </p>
          <PizarraNumero cifras={2} bloqueado={bloqueado} correcta={typeof correcta === 'number' ? correcta : null} reinicio={errores ?? fallidas.length} onListo={onResponder} />
        </>
      ) : (
        <Opciones opciones={i.opciones} bloqueado={bloqueado} fallidas={fallidas} correcta={correcta} onElegir={onResponder} etiqueta="¿Cuántos hay?" />
      )}
    </div>
  );
}
