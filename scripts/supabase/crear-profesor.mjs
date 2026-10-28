// Crea la única cuenta de profesor. Pide los datos por la terminal para que
// la contraseña no quede escrita en ningún archivo ni en el historial.
// Uso: npm run crear-profesor
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { urlBaseDeDatos } from './entorno.mjs';

const url = urlBaseDeDatos();
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

const nombre = (await rl.question('Nombre del profesor: ')).trim();
const usuario = (await rl.question('Usuario (3 a 30: letras sin tilde, números, punto o guion bajo): ')).trim().toLowerCase();

// Contraseña sin eco en pantalla.
const preguntarOculto = async (texto) => {
  const escribir = rl._writeToOutput;
  rl._writeToOutput = (s) => (s.startsWith(texto) ? escribir.call(rl, s) : escribir.call(rl, ''));
  const valor = await rl.question(texto);
  rl._writeToOutput = escribir;
  process.stdout.write('\n');
  return valor;
};
const clave = await preguntarOculto('Contraseña (mínimo 4): ');
const repetida = await preguntarOculto('Repita la contraseña: ');
rl.close();

if (clave !== repetida) {
  console.error('Las contraseñas no coinciden.');
  process.exit(1);
}

// La contraseña va por la entrada estándar (con \set), no en los argumentos: así no aparece en «ps».
// Dentro de comillas simples de psql: la comilla se dobla y la barra invertida se escapa.
const citar = (t) => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const r = spawnSync(
  'psql',
  // Las variables :'u' solo se reemplazan en lo que psql lee (no con -c): la consulta va por la entrada.
  [url, '-v', 'ON_ERROR_STOP=1', '-qAt', '-v', `u=${usuario}`, '-v', `n=${nombre}`],
  { encoding: 'utf8', input: `\\set c ${citar(clave)}\nselect public.crear_profesor(:'u', :'c', :'n');\n` },
);
if (r.status !== 0) {
  console.error((r.stderr || '').replace(/^.*ERROR:\s*/m, 'Error: ').trim());
  process.exit(1);
}
console.log(`Cuenta de profesor creada. Entre a la app con el usuario «${usuario}».`);
