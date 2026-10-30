import { useState } from 'react';
import { useApp } from '../estado';
import { Barra, PinAdulto } from '../componentes/Comunes';
import { BotonInstalar } from '../componentes/Instalar';
import { bandaDePerfil, haceDiagnostica, type Ajustes as TAjustes } from '../almacenamiento/datos';
import { BANDAS } from '../juego/motor';
import { nombreGrado } from '../juego/complejidad';
import EstadoNube from '../componentes/EstadoNube';
import { pendientes, sincronizarAhora } from '../servicios/sincronizacion';
import { useVoz } from '../servicios/voz';
import Icono from '../componentes/Icono';
import { AUTOR, DERECHOS, PROGRAMA, UNIVERSIDAD } from '../contenido/autoria';
import { buscarActualizacionAhora, repararCache } from '../pwa/registro';
import Novedades from '../componentes/Novedades';

export default function Ajustes() {
  const { ajustes, cambiarAjustes, perfil, avisar, salir } = useApp();
  const voz = useVoz();
  const adulto = perfil.rol === 'familia';
  const [pin, setPin] = useState<null | 'salir' | 'ra'>(null);
  const [revisando, setRevisando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const cerrarSesion = async () => {
    setSaliendo(true);
    if (pendientes() > 0) await sincronizarAhora();
    const faltan = pendientes();
    if (
      faltan > 0 &&
      !window.confirm(`Hay ${faltan} avances que no se han subido a la nube porque no hay internet. Si cierra la sesión ahora, se pierden. ¿Cerrar de todos modos?`)
    ) {
      setSaliendo(false);
      return;
    }
    await salir();
  };

  const cambiar = <K extends keyof TAjustes>(k: K, v: TAjustes[K]) => cambiarAjustes({ ...ajustes, [k]: v });

  if (pin) {
    return (
      <main className="pantalla">
        <PinAdulto
          texto={pin === 'salir' ? 'Para cerrar la sesión, un adulto debe resolver:' : 'La realidad aumentada usa la cámara. Para activarla, un adulto debe resolver:'}
          alCancelar={() => setPin(null)}
          alAprobar={() => {
            if (pin === 'ra') cambiar('realidadAumentada', true);
            else void cerrarSesion();
            setPin(null);
          }}
        />
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
        <label className="interruptor">
          <span>
            <span className="fila" style={{ flexWrap: 'nowrap' }}>
              <Icono nombre="video" tamano={28} /> Videos de ayuda de YouTube
            </span>
            <span className="pequeno suave"> Necesitan internet; el resto de la aplicación funciona sin conexión.</span>
          </span>
          <input type="checkbox" checked={ajustes.videos} onChange={(e) => cambiar('videos', e.target.checked)} />
        </label>
        <label className="interruptor">
          <span>
            <span className="fila" style={{ flexWrap: 'nowrap' }}>
              <Icono nombre="camara" tamano={28} /> Realidad aumentada (usa la cámara)
            </span>
            <span className="pequeno suave"> Los objetos de la finca quedan puestos alrededor, sobre lo que ve la cámara, y se buscan girando el celular. No usa el GPS. La imagen no se graba ni se envía. Para activarla se pide un adulto.</span>
          </span>
          <input
            type="checkbox"
            checked={ajustes.realidadAumentada}
            onChange={(e) => (e.target.checked ? setPin('ra') : cambiar('realidadAumentada', false))}
          />
        </label>
      </section>

      <section className="tarjeta columna">
        <h2>{adulto ? 'Su cuenta' : 'Mi cuenta'}</h2>
        <p style={{ margin: 0 }}>
          <strong>{perfil.nombre}</strong> · usuario <strong>{perfil.usuario}</strong>
        </p>
        <p className="pequeno" style={{ margin: 0 }}>
          {adulto ? 'Ruta de familias' : nombreGrado(perfil.grado)}
          {!adulto && haceDiagnostica(perfil) && (
            <>
              {' '}· Exigencia: <strong>{BANDAS[bandaDePerfil(perfil)].nombre}</strong>
            </>
          )}
        </p>
        <p className="pequeno suave" style={{ margin: 0 }}>
          {adulto ? 'El grado, el tipo de cuenta y la contraseña los maneja el profesor.' : 'Tu grado y tu contraseña los maneja tu profesor.'}
        </p>
        <EstadoNube adulto={adulto} />
        <button type="button" className="boton" disabled={saliendo} onClick={() => (adulto ? window.confirm('¿Cerrar la sesión en este celular?') && void cerrarSesion() : setPin('salir'))}>
          <Icono nombre="salir" tamano={26} /> {saliendo ? 'Cerrando…' : adulto ? 'Cerrar sesión' : 'Cerrar sesión (adulto)'}
        </button>
      </section>

      <section className="tarjeta columna">
        <h2>Aplicación</h2>
        <BotonInstalar />
        <Novedades adulto={adulto} />
        <p className="pequeno suave" style={{ margin: 0 }}>
          Se actualiza sola cuando hay internet.
        </p>
        <button
          type="button"
          className="boton"
          disabled={revisando}
          onClick={async () => {
            setRevisando(true);
            const r = await buscarActualizacionAhora();
            setRevisando(false);
            avisar(
              r === 'actualizando'
                ? 'Hay una versión nueva: actualizando…'
                : r === 'al-dia'
                  ? 'Ya tiene la última versión'
                  : r === 'sin-conexion'
                    ? 'Sin internet: se buscará cuando haya señal'
                    : 'Las actualizaciones automáticas no están disponibles en este navegador',
            );
          }}
        >
          <Icono nombre="repetir" tamano={26} /> {revisando ? 'Buscando…' : 'Buscar actualización'}
        </button>
        <button
          type="button"
          className="boton"
          onClick={() => {
            if (!window.confirm('Se borrará la caché de la aplicación y se volverá a descargar. El avance no se borra. Necesita internet. ¿Continuar?')) return;
            void repararCache();
          }}
        >
          <Icono nombre="engrane" tamano={26} /> Reparar la aplicación (borrar caché)
        </button>
      </section>

      <section className="tarjeta columna" aria-label="Acerca de La Finca Matemática">
        <h2>Acerca de</h2>
        <p className="pequeno" style={{ margin: 0 }}>
          <strong>La Finca Matemática</strong>. Autor: <strong>{AUTOR}</strong>, estudiante de la {PROGRAMA} de la {UNIVERSIDAD}.
        </p>
        <p className="pequeno suave" style={{ margin: 0 }}>
          {DERECHOS}
        </p>
      </section>
    </main>
  );
}
