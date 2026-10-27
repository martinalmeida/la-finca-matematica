// Aplica en orden las migraciones de supabase/migraciones con psql.
// Uso: npm run db:aplicar
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { urlBaseDeDatos } from './entorno.mjs';

const url = urlBaseDeDatos();
const carpeta = 'supabase/migraciones';
for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort()) {
  console.log(`→ ${archivo}`);
  const r = spawnSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-q', '-f', `${carpeta}/${archivo}`], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('Listo.');
