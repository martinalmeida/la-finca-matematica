// Representación visual de la pista 2: objetos, arreglo, recta, bloques o reparto.

import type { Visual } from '../juego/tipos';
import { DibujoObjeto, DibujoRecipiente } from './Ilustraciones';
import { RectaDibujo } from './interacciones/Recta';
import { BloquesDibujo, descomponer } from './interacciones/Bloques';

const MAX_DIBUJOS = 40;
/** Un arreglo más ancho o más alto que esto ya no cabe en un celular de 320 px: se describe con palabras. */
const MAX_LADO = 10;

/** «4 grupos de 5»; «3 grupos de 4 y 1 de 2» si solo el último es distinto; si no, «3 y 5». */
function describirGrupos(grupos: number[]): string {
  const [primero] = grupos;
  const grupo = (n: number, g: number) => `${n} ${n === 1 ? 'grupo' : 'grupos'} de ${g}`;
  if (grupos.length > 1 && grupos.every((g) => g === primero)) return grupo(grupos.length, primero);
  const resto = grupos.slice(0, -1);
  if (resto.length > 1 && resto.every((g) => g === primero)) return `${grupo(resto.length, primero)} y 1 de ${grupos[grupos.length - 1]}`;
  return grupos.join(' y ');
}

export default function VisualPista({ visual }: { visual: Visual }) {
  switch (visual.tipo) {
    case 'texto':
      // pre-line: las pistas usan saltos de línea (una operación por renglón).
      return <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{visual.texto}</p>;
    case 'dinero':
      return (
        <div className="visual-dinero" role="img" aria-label={visual.valores.map((v) => `$${v.toLocaleString('es-CO')}`).join(', ')}>
          {visual.valores.map((v, k) => (
            <span key={k} className="pieza-dinero">
              {/* En Colombia, de $1.000 para arriba también hay billetes; aquí $1.000 o más se dibuja como billete. */}
              <DibujoObjeto objeto={v >= 1000 ? 'billete' : 'moneda'} tamano={34} etiqueta="" />
              <span>${v.toLocaleString('es-CO')}</span>
            </span>
          ))}
        </div>
      );
    case 'objetos': {
      const vacios = visual.vacios ?? 0;
      const total = visual.grupos.reduce((s, g) => s + g, 0) + vacios;
      if (total > MAX_DIBUJOS) return <p style={{ margin: 0 }}>{vacios ? `Hay ${total - vacios} y faltan ${vacios}` : describirGrupos(visual.grupos)}</p>;
      let restantesTachar = visual.tachados ?? 0;
      return (
        <div className="visual-grupos" role="img" aria-label={`Grupos de ${visual.grupos.join(' y ')}${visual.tachados ? `, ${visual.tachados} tachados` : ''}${vacios ? `, ${vacios} espacios vacíos` : ''}`}>
          {visual.grupos.map((g, k) => (
            <div key={k} className="visual-grupo">
              {visual.grupo?.dibujo && (
                <span className="visual-grupo-dueno">
                  <DibujoRecipiente dibujo={visual.grupo.dibujo} indice={k} tamano={24} />
                </span>
              )}
              {Array.from({ length: g }, (_, j) => {
                // Se tachan los últimos del primer grupo.
                const tachar = k === 0 && j >= g - (visual.tachados ?? 0) && restantesTachar-- > 0;
                return (
                  <span key={j} className={tachar ? 'tachado' : ''}>
                    <DibujoObjeto objeto={visual.objeto} tamano={26} etiqueta="" />
                  </span>
                );
              })}
              {k === visual.grupos.length - 1 &&
                Array.from({ length: vacios }, (_, j) => (
                  <span key={`v${j}`} className="hueco" style={{ width: 26, height: 26 }} />
                ))}
            </div>
          ))}
        </div>
      );
    }
    case 'arreglo': {
      const f = visual.filas;
      const c = visual.columnas;
      // Nunca se recorta: un arreglo incompleto mostraría otra cantidad.
      if (f > MAX_LADO || c > MAX_LADO) return <p style={{ margin: 0 }}>{`${f} filas de ${c}`}</p>;
      return (
        <div className="arreglo" style={{ gridTemplateColumns: `repeat(${c}, 22px)` }} role="img" aria-label={`Arreglo de ${visual.filas} filas por ${visual.columnas} columnas`}>
          {Array.from({ length: f * c }, (_, k) => (
            <span key={k} className="celda activa" style={{ width: 22, height: 22 }}>
              {visual.objeto && <DibujoObjeto objeto={visual.objeto} tamano={18} etiqueta="" />}
            </span>
          ))}
        </div>
      );
    }
    case 'recta': {
      const paso = Math.max(1, Math.round((visual.max - visual.min) / 20));
      return <RectaDibujo min={visual.min} max={visual.max} paso={paso} inicio={visual.desde} elegido={null} saltos={visual.saltos.map((s) => s / paso)} />;
    }
    case 'bloques': {
      const { c, d, u } = descomponer(visual.valor);
      return <BloquesDibujo c={c} d={d} u={u} unidad={visual.unidad} decena={visual.decena} centena={visual.centena} />;
    }
    case 'reparto': {
      const cada = Math.floor(visual.total / visual.grupos);
      const resto = visual.total % visual.grupos;
      const texto = `${visual.total} en ${visual.grupos} grupos: ${cada} en cada uno${resto ? ` y ${resto === 1 ? 'sobra 1' : `sobran ${resto}`}` : ''}.`;
      // Sin dibujo propio (kilos, pesos…) o con demasiados objetos, se dice con palabras.
      if (!visual.objeto || visual.total > MAX_DIBUJOS || visual.grupos > 10) return <p style={{ margin: 0 }}>{texto}</p>;
      const objeto = visual.objeto;
      return (
        <div className="visual-grupos" role="img" aria-label={texto}>
          {Array.from({ length: visual.grupos }, (_, k) => (
            <div key={k} className="visual-grupo">
              {visual.grupo?.dibujo && (
                <span className="visual-grupo-dueno">
                  <DibujoRecipiente dibujo={visual.grupo.dibujo} indice={k} tamano={24} />
                </span>
              )}
              {Array.from({ length: cada }, (_, j) => (
                <DibujoObjeto key={j} objeto={objeto} tamano={24} etiqueta="" />
              ))}
            </div>
          ))}
          {resto > 0 && (
            <div className="visual-grupo visual-sobran">
              <span className="pequeno">{resto === 1 ? 'Sobra' : 'Sobran'}</span>
              {Array.from({ length: resto }, (_, j) => (
                <DibujoObjeto key={j} objeto={objeto} tamano={24} etiqueta="" />
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}
