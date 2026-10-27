import { useRef, useState } from 'react';
import { useApp } from '../estado';
import { Barra, PinAdulto } from '../componentes/Comunes';
import { BotonInstalar } from '../componentes/Instalar';
import type { Ajustes as TAjustes } from '../almacenamiento/datos';
import { crearCopia, descargar, fechaArchivo, restaurarCopia } from '../almacenamiento/copia';
import { codigoConGrado } from '../juego/perfil';
import type { Grado, Pista } from '../juego/tipos';
import { Medidor } from '../componentes/Historia';
import { RESUMEN_GRADO } from '../juego/complejidad';
import { useVoz } from '../servicios/voz';
import Icono from '../componentes/Icono';

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
        <p>Cada grado tiene su propia ruta y su propia complejidad. El progreso de cada grado se guarda por separado: al volver a un grado, el avance sigue ahí.</p>
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
            <span className="grado-numero">{g}</span>
            <span className="columna" style={{ flex: 1, textAlign: 'left', gap: 2 }}>
              <span>{g}.º grado</span>
              <span className="pequeno suave" style={{ fontWeight: 500 }}>
                {RESUMEN_GRADO[`g${g}` as Pista].foco}
              </span>
            </span>
            <Medidor barras={g} />
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
        <h2>Efectos visuales</h2>
        <div className="segmentado" role="radiogroup" aria-label="Efectos visuales">
          {(
            [
              ['completos', 'Vidrio y movimiento', 'chispas'],
              ['ligeros', 'Ligeros', 'bateria'],
            ] as const
          ).map(([v, t, i]) => (
            <button key={v} type="button" role="radio" aria-checked={ajustes.efectos === v} className={`boton ${ajustes.efectos === v ? 'seleccionado' : ''}`} onClick={() => cambiar('efectos', v)}>
              <Icono nombre={i} tamano={24} /> {t}
            </button>
          ))}
        </div>
        <p className="pequeno suave" style={{ margin: 0 }}>
          Si el celular se pone lento, elija «Ligeros»: quita las transparencias y las animaciones del fondo.
        </p>
        <label className="interruptor">
          <span className="fila"><Icono nombre="campana" tamano={28} /> Sonido</span>
          <input type="checkbox" checked={ajustes.sonido} onChange={(e) => cambiar('sonido', e.target.checked)} />
        </label>
        <label className="interruptor">
          <span className="fila"><Icono nombre="vibrar" tamano={28} /> Vibración</span>
          <input type="checkbox" checked={ajustes.vibracion} onChange={(e) => cambiar('vibracion', e.target.checked)} />
        </label>
        <label className="interruptor">
          <span>
            <span className="fila" style={{ flexWrap: 'nowrap' }}>
              <Icono nombre="altavoz" tamano={28} /> Leer las preguntas en voz alta automáticamente
            </span>
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
            <Icono nombre="candado" tamano={26} /> Cambiar grado (adulto)
          </button>
        </section>
      )}

      <section className="tarjeta columna">
        <h2>Copia de seguridad</h2>
        <p className="pequeno" style={{ margin: 0 }}>
          Guarda todos los perfiles y avances de este celular en un archivo. No se envía nada por internet.
        </p>
        <button type="button" className="boton" onClick={() => descargar(`finca-matematica-copia-${fechaArchivo()}.json`, JSON.stringify(crearCopia()))}>
          <Icono nombre="guardar" tamano={26} /> Exportar copia
        </button>
        <button type="button" className="boton" onClick={() => setPin('importar')}>
          <Icono nombre="carpeta" tamano={26} /> Importar copia (adulto)
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
        <BotonInstalar />
        <button type="button" className="boton" onClick={() => ir({ nombre: 'quien' })}>
          <Icono nombre="personas" tamano={26} /> Cambiar de jugador
        </button>
      </section>
    </main>
  );
}
