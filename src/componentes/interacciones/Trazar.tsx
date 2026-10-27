// Trazar una cifra (Inclusión): primero se ve cómo se hace y luego se repasa la guía punteada.
// Reutiliza el lienzo y la revisión del Taller de números.

import { useMemo, useState } from 'react';
import Lienzo from '../Lienzo';
import CifraAnimada from '../CifraAnimada';
import Icono from '../Icono';
import { FORMAS, type Trazo } from '../../contenido/cifras';
import { cajaCifra, formaEnCaja, revisarRepaso } from '../../juego/trazos';
import type { PropsInteraccion } from './tipos';

const ANCHO = 260;
const ALTO = 320;
const MARGEN = 34;
const TOLERANCIA = 26;

export default function Trazar({ ej, bloqueado, onResponder }: PropsInteraccion) {
  const cifra = ej.interaccion.tipo === 'trazar' ? ej.interaccion.cifra : 0;
  const [vuelta, setVuelta] = useState(0);
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const [avisarGuia, setAvisarGuia] = useState(false);
  const guia = useMemo(() => formaEnCaja(FORMAS[cifra][0], cajaCifra(ANCHO, ALTO, MARGEN)), [cifra]);

  const listo = () => {
    const r = revisarRepaso(guia, trazos, TOLERANCIA);
    if (r.bien) {
      onResponder(cifra);
      return;
    }
    setAvisarGuia(true);
    window.setTimeout(() => setAvisarGuia(false), 900);
    setTrazos([]);
    onResponder(-1);
  };

  return (
    <div className="columna centro">
      <div className="fila" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 90 }}>
          <CifraAnimada cifra={cifra} vuelta={vuelta} />
        </div>
        <button type="button" className="boton" onClick={() => setVuelta((v) => v + 1)}>
          <Icono nombre="repetir" tamano={22} /> Ver otra vez
        </button>
      </div>
      <Lienzo ancho={ANCHO} alto={ALTO} trazos={trazos} onTrazos={setTrazos} guia={guia} avisarGuia={avisarGuia} deshabilitado={bloqueado} etiqueta={`Guía del número ${cifra} para repasar`} />
      <div className="fila" style={{ justifyContent: 'center' }}>
        <button type="button" className="boton" onClick={() => setTrazos([])} disabled={!trazos.length || bloqueado}>
          <Icono nombre="repetir" tamano={24} anim="no" /> Borrar
        </button>
        <button type="button" className="boton principal" disabled={!trazos.length || bloqueado} onClick={listo}>
          <Icono nombre="check" tamano={24} /> Listo
        </button>
      </div>
    </div>
  );
}
