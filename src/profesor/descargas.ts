// Descarga de archivos generados en el navegador (CSV de los informes).

import { fechaLocal } from '../almacenamiento/datos';

export function descargar(nombre: string, contenido: string, tipo = 'text/csv'): void {
  const blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fechaArchivo(): string {
  return fechaLocal(new Date());
}
