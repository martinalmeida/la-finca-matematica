// Antes y después: la prueba final frente a la diagnóstica, tema por tema.

import type { ResultadoPrueba } from '../juego/pruebas';
import { compararPruebas } from '../juego/pruebas';
import Icono from './Icono';

function Marca({ bien, cuando }: { bien: boolean; cuando: string }) {
  return (
    <span className={`marca-prueba ${bien ? 'bien' : 'falta'}`} role="img" aria-label={`${cuando}: ${bien ? 'bien' : 'por aprender'}`}>
      {bien ? '✓' : '·'}
    </span>
  );
}

export default function Comparacion({ diagnostica, final, adulto }: { diagnostica: ResultadoPrueba; final: ResultadoPrueba; adulto: boolean }) {
  const c = compararPruebas(diagnostica, final);
  const subio = c.despues - c.antes;
  return (
    <section className="tarjeta columna comparacion" aria-label="Comparación de la prueba de entrada y la final">
      <div className="comparacion-totales">
        <div>
          <span className="pequeno suave">Al entrar</span>
          <strong>
            {c.antes} <span className="pequeno">de {c.total}</span>
          </strong>
        </div>
        <Icono nombre="siguiente" tamano={28} />
        <div>
          <span className="pequeno suave">Al terminar</span>
          <strong>
            {c.despues} <span className="pequeno">de {c.total}</span>
          </strong>
        </div>
      </div>
      <p style={{ margin: 0 }}>
        {subio > 0
          ? `${adulto ? 'Mejoró' : 'Mejoraste'} en ${subio} ${subio === 1 ? 'pregunta' : 'preguntas'}${c.mejoras > 0 ? ` y ${adulto ? 'aprendió' : 'aprendiste'} ${c.mejoras} ${c.mejoras === 1 ? 'tema nuevo' : 'temas nuevos'}` : ''}.`
          : subio === 0
            ? adulto ? 'Se mantuvo igual que al entrar. Repasar los temas marcados le ayudará.' : 'Quedaste igual que al entrar. Repasar los temas marcados te ayudará.'
            : adulto ? 'Esta vez le fue un poco más difícil. Los temas marcados son los que más conviene repasar.' : 'Esta vez fue más difícil. Los temas marcados son los que más conviene repasar.'}
      </p>
      <table className="tabla-comparacion">
        <thead>
          <tr>
            <th scope="col">Tema</th>
            <th scope="col">Antes</th>
            <th scope="col">Ahora</th>
          </tr>
        </thead>
        <tbody>
          {c.temas.map((t, k) => (
            <tr key={k} className={!t.antes && t.despues ? 'mejoro' : !t.despues ? 'repasar' : ''}>
              <th scope="row">
                {k + 1}. {t.titulo}
              </th>
              <td>
                <Marca bien={t.antes} cuando="Antes" />
              </td>
              <td>
                <Marca bien={t.despues} cuando="Ahora" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
