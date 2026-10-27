// Indicador discreto: ¿el avance ya está guardado en la nube o falta subir algo?

import { useEffect, useState } from 'react';
import Icono from './Icono';
import { alSincronizar, pendientes, sincronizarAhora, ultimaSincronizacion } from '../servicios/sincronizacion';

function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `el ${new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`;
}

export default function EstadoNube({ adulto }: { adulto: boolean }) {
  const [, refrescar] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  useEffect(() => alSincronizar(() => refrescar((x) => x + 1)), []);

  const n = pendientes();
  const ultima = ultimaSincronizacion();
  const texto =
    n > 0
      ? `${n} ${n === 1 ? 'avance' : 'avances'} por subir: se ${n === 1 ? 'sube' : 'suben'} solos cuando haya internet.`
      : ultima
        ? `Avance guardado en la nube ${hace(ultima)}.`
        : 'Tu avance se guardará en la nube cuando haya internet.';

  return (
    <p className="pequeno suave fila estado-nube" role="status" style={{ margin: 0, gap: 6 }}>
      <Icono nombre={n > 0 ? 'aviso' : 'check'} tamano={20} anim="no" />
      <span style={{ flex: 1, minWidth: 0 }}>{adulto ? texto.replace('Tu avance', 'Su avance') : texto}</span>
      {n > 0 && (
        <button
          type="button"
          className="boton enlace"
          disabled={subiendo}
          onClick={async () => {
            setSubiendo(true);
            await sincronizarAhora();
            setSubiendo(false);
          }}
        >
          {subiendo ? 'Subiendo…' : 'Subir ahora'}
        </button>
      )}
    </p>
  );
}
