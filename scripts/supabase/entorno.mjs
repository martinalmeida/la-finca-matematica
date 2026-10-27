// Lee SUPABASE_DB_URL de .env.local (ignorado por git). Nunca va al front.
import { readFileSync } from 'node:fs';

export function urlBaseDeDatos() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  try {
    const linea = readFileSync('.env.local', 'utf8').split('\n').find((l) => l.startsWith('SUPABASE_DB_URL='));
    if (linea) return linea.slice('SUPABASE_DB_URL='.length).trim();
  } catch {
    // sin archivo
  }
  console.error('Falta SUPABASE_DB_URL en .env.local');
  process.exit(1);
}
