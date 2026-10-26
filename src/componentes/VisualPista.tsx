// Representación visual de la pista 2: objetos, arreglo, recta, bloques o reparto.

import type { Visual } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';
import { RectaDibujo } from './interacciones/Recta';
import { BloquesDibujo, descomponer } from './interacciones/Bloques';

const MAX_DIBUJOS = 40;

export default function VisualPista({ visual }: { visual: Visual }) {
  switch (visual.tipo) {
    case 'texto':
      return <p style={{ margin: 0 }}>{visual.texto}</p>;
    case 'objetos': {
      const total = visual.grupos.reduce((s, g) => s + g, 0);
      if (total > MAX_DIBUJOS) return <p style={{ margin: 0 }}>{visual.grupos.join(' y ')}</p>;
      let restantesTachar = visual.tachados ?? 0;
      return (
        <div className="visual-grupos" role="img" aria-label={`Grupos de ${visual.grupos.join(' y ')}${visual.tachados ? `, ${visual.tachados} tachados` : ''}`}>
          {visual.grupos.map((g, k) => (
            <div key={k} className="visual-grupo">
              {Array.from({ length: g }, (_, j) => {
                // Se tachan los últimos del primer grupo.
                const tachar = k === 0 && j >= g - (visual.tachados ?? 0) && restantesTachar-- > 0;
                return (
                  <span key={j} className={tachar ? 'tachado' : ''}>
                    <DibujoObjeto objeto={visual.objeto} tamano={26} etiqueta="" />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    case 'arreglo': {
      const f = Math.min(visual.filas, 12);
      const c = Math.min(visual.columnas, 12);
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
      return <BloquesDibujo c={c} d={d} u={u} />;
    }
    case 'reparto': {
      const cada = Math.floor(visual.total / visual.grupos);
      const resto = visual.total % visual.grupos;
      if (visual.total > MAX_DIBUJOS) return <p style={{ margin: 0 }}>{`${visual.total} en ${visual.grupos} grupos: ${cada} en cada uno${resto ? ` y sobran ${resto}` : ''}.`}</p>;
      return (
        <div className="visual-grupos" role="img" aria-label={`${visual.total} repartidos en ${visual.grupos} grupos`}>
          {Array.from({ length: visual.grupos }, (_, k) => (
            <div key={k} className="visual-grupo">
              {Array.from({ length: cada }, (_, j) => (
                <DibujoObjeto key={j} objeto={visual.objeto ?? 'naranja'} tamano={24} etiqueta="" />
              ))}
            </div>
          ))}
        </div>
      );
    }
  }
}
