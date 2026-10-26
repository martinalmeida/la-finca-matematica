import { useRef, useState } from 'react';
import { useApp } from '../estado';
import { Barra, BotonInstalar, PinAdulto } from '../componentes/Comunes';
import type { Ajustes as TAjustes } from '../almacenamiento/datos';
import { crearCopia, descargar, fechaArchivo, restaurarCopia } from '../almacenamiento/copia';
import { codigoConGrado } from '../juego/perfil';
import type { Grado } from '../juego/tipos';
import { useVoz } from '../servicios/voz';

export default function Ajustes() {
  const { ajustes, cambiarAjustes, perfil, actualizarPerfil, ir, avisar } = useApp();
  const voz = useVoz();
  const adulto = perfil?.rol === 'familia';
  const [pin, setPin] = useState<null | 'grado' | 'importar'>(null);
  const [eligiendoGrado, setEligiendoGrado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const cambiar = <K extends keyof TAjustes>(k: K, v: TAjustes[K]) => cambiarAjustes({ ...ajustes, [k]: v });

  if (pin) {
    return (
      <main className="pantalla">
        <PinAdulto
          texto={pin === 'grado' ? 'Para cambiar el grado, un adulto debe resolver:' : 'Para restaurar una copia, un adulto debe resolver:'}
          alCancelar={() => setPin(null)}
          alAprobar={() => {
            if (pin === 'grado') setEligiendoGrado(true);
            else archivo.current?.click();
            setPin(null);
          }}
        />
      </main>
    );
  }

  if (eligiendoGrado && perfil) {
    return (
      <main className="pantalla">
        <Barra titulo="Cambiar de grado" alVolver={() => setEligiendoGrado(false)} />
        <p>El progreso de cada grado se guarda por separado. Al volver a un grado, el avance sigue ahí.</p>
        {([1, 2, 3, 4, 5] as Grado[]).map((g) => (
          <button
            key={g}
            type="button"
            className={`grado-boton ${perfil.grado === g ? 'seleccionado' : ''}`}
            onClick={() => {
              if (!window.confirm(`¿Confirma el cambio a ${g}.º grado?`)) return;
              actualizarPerfil({ ...perfil, grado: g, codigo: codigoConGrado(perfil.codigo, g) });
              setEligiendoGrado(false);
              avisar(`Grado cambiado a ${g}.º`);
            }}
          >
            <span className="grado-numero">{g}</span> {g}.º grado
          </button>
        ))}
      </main>
    );
  }

  return (
    <main className="pantalla">
      <Barra titulo="Ajustes" />
      <section className="tarjeta columna">
        <h2>Tamaño de letra</h2>
        <div className="segmentado" role="radiogroup" aria-label="Tamaño de letra">
          {(
            [
              ['normal', 'A'],
              ['grande', 'A+'],
              ['muy-grande', 'A++'],
            ] as const
          ).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={ajustes.tamanoLetra === v} className={`boton ${ajustes.tamanoLetra === v ? 'seleccionado' : ''}`} onClick={() => cambiar('tamanoLetra', v)}>
              {t}
            </button>
          ))}
        </div>
        <label className="interruptor">
          <span>🔔 Sonido</span>
          <input type="checkbox" checked={ajustes.sonido} onChange={(e) => cambiar('sonido', e.target.checked)} />
        </label>
        <label className="interruptor">
          <span>📳 Vibración</span>
          <input type="checkbox" checked={ajustes.vibracion} onChange={(e) => cambiar('vibracion', e.target.checked)} />
        </label>
        <label className="interruptor">
          <span>
            🔊 Leer enunciados en voz alta
            {!voz.disponible && <span className="pequeno suave"> (este celular no tiene voz en español sin internet)</span>}
          </span>
          <input type="checkbox" checked={ajustes.audioEnunciados} disabled={!voz.disponible} onChange={(e) => cambiar('audioEnunciados', e.target.checked)} />
        </label>
      </section>

      {perfil && !adulto && (
        <section className="tarjeta columna">
          <h2>Grado</h2>
          <p style={{ margin: 0 }}>
            Ahora: <strong>{perfil.grado}.º grado</strong> · Código {perfil.codigo}
          </p>
          <button type="button" className="boton" onClick={() => setPin('grado')}>
            🔐 Cambiar grado (adulto)
          </button>
        </section>
      )}

      <section className="tarjeta columna">
        <h2>Copia de seguridad</h2>
        <p className="pequeno" style={{ margin: 0 }}>
          Guarda todos los perfiles y avances de este celular en un archivo. No se envía nada por internet.
        </p>
        <button type="button" className="boton" onClick={() => descargar(`finca-matematica-copia-${fechaArchivo()}.json`, JSON.stringify(crearCopia()))}>
          💾 Exportar copia
        </button>
        <button type="button" className="boton" onClick={() => setPin('importar')}>
          📂 Importar copia (adulto)
        </button>
        <input
          ref={archivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            if (!window.confirm('Importar reemplaza todos los datos actuales de este celular. ¿Continuar?')) return;
            const r = restaurarCopia(await f.text());
            if (r.ok) {
              avisar('Copia restaurada');
              ir({ nombre: 'quien' });
            } else avisar(r.error);
          }}
        />
      </section>

      <section className="tarjeta columna">
        <h2>Aplicación</h2>
        <BotonInstalar adulto={adulto} />
        <button type="button" className="boton" onClick={() => ir({ nombre: 'quien' })}>
          👥 Cambiar de jugador
        </button>
      </section>
    </main>
  );
}
