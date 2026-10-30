// Escena de realidad aumentada con LocAR.js: la cámara muestra el entorno real y los objetos
// de la finca quedan anclados alrededor del niño; al girar el celular se encuentran y se tocan
// para contarlos o meterlos en la canasta. Si no hay cámara (o no se dio permiso), la escena
// usa un fondo dibujado y funciona igual. Nada de la cámara se graba ni se envía.
// Este archivo se carga aparte (React.lazy): three.js solo se descarga al abrir la cámara.

import { useCapaConAtras } from '../servicios/atras';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ConfigEscena } from './escenaConfig';
import { cantidadObjeto } from './Ilustraciones';
import { useApp } from '../estado';
import { MotorRA, type Conteo, type EstadoMovimiento } from '../servicios/ra';
import { sonar } from '../servicios/sonido';
import { detenerVoz, useVoz } from '../servicios/voz';
import { num } from '../contenido/contexto';
import Icono from './Icono';
import { useTapaTeclas } from '../servicios/teclas';

export type { ConfigEscena } from './escenaConfig';

type Props = {
  config: ConfigEscena;
  titulo: string;
  instruccion?: string;
  /** Texto que se dice y se muestra al aparecer los objetos (modo cantidad). */
  mensaje?: string;
  alCerrar: () => void;
};

export default function EscenaRA({ config, titulo, instruccion, mensaje, alCerrar }: Props) {
  // Ventana encima: las teclas no le llegan a lo que quedó debajo.
  useTapaTeclas();
  const { ajustes, perfil } = useApp();
  useCapaConAtras(true, alCerrar);
  const adulto = perfil?.rol === 'familia';
  const tu = (nino: string, usted: string) => (adulto ? usted : nino);
  const voz = useVoz();
  // Al cerrar la escena se calla lo que estaba leyendo.
  useEffect(() => () => detenerVoz(), []);
  const contenedor = useRef<HTMLDivElement>(null);
  const motor = useRef<MotorRA | null>(null);
  const [camara, setCamara] = useState<'pidiendo' | 'lista' | 'negada' | 'sin-camara'>('pidiendo');
  const [movimiento, setMovimiento] = useState<EstadoMovimiento>('esperando');
  const [conteo, setConteo] = useState<Conteo>({ total: 0, contados: 0, enCanasta: 0 });
  const [reintento, setReintento] = useState(0);
  const [error3d, setError3d] = useState(false);
  const sonido = useRef(ajustes.sonido);
  sonido.current = ajustes.sonido;

  useEffect(() => {
    if (!contenedor.current) return;
    let m: MotorRA;
    try {
      m = new MotorRA(contenedor.current, config, {
        ligero: ajustes.efectos === 'ligeros',
        alCambiar: setConteo,
        alCamara: setCamara,
        alMovimiento: setMovimiento,
        alToque: () => sonar('toque', sonido.current),
      });
    } catch {
      // Sin WebGL no hay escena 3D.
      setError3d(true);
      return;
    }
    motor.current = m;
    setCamara('pidiendo');
    m.iniciar();
    return () => {
      m.destruir();
      motor.current = null;
    };
    // La escena se arma una vez por apertura (o al reintentar la cámara).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reintento]);

  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const texto = mensaje ?? instruccion;
    if (texto && voz.disponible && ajustes.audioEnunciados) voz.leer(texto, 'escena-ra');
    return () => {
      document.body.style.overflow = antes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textoContador =
    config.modo === 'canasta'
      ? `En ${config.recipiente.nombre}: ${num(conteo.enCanasta)}`
      : config.modo === 'real'
        ? tu(`Contaste: ${num(conteo.total)}`, `Contó: ${num(conteo.total)}`)
        : config.modo === 'contar'
          ? tu(`Llevas: ${num(conteo.contados)} de ${num(conteo.total)}`, `Lleva: ${num(conteo.contados)} de ${num(conteo.total)}`)
          : cantidadObjeto(config.objeto, conteo.total);

  const ayudaMovimiento =
    movimiento === 'arrastrar' || movimiento === 'permiso'
      ? tu('Arrastra el dedo para mirar alrededor.', 'Arrastre el dedo para mirar alrededor.')
      : movimiento === 'sensores' && config.modo !== 'real' && conteo.total > 4
        ? tu('Gira despacio el celular para encontrarlos todos.', 'Gire despacio el celular para encontrarlos todos.')
        : null;

  const contenido = (
    <div className={`escena-ra ${camara !== 'lista' ? 'sin-camara' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
      <div ref={contenedor} className="capa-ra" />
      <header className="barra-ra">
        <button type="button" className="boton icono" onClick={alCerrar} aria-label="Cerrar la cámara">
          <Icono nombre="cerrar" tamano={24} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{titulo}</strong>
          {instruccion && <div className="pequeno">{instruccion}</div>}
        </div>
      </header>

      {camara === 'negada' && (
        <p className="aviso-ra pequeno">
          {tu('Sin permiso para la cámara: usamos un dibujo de la finca.', 'Sin permiso para la cámara: se usa un dibujo de la finca.')}{' '}
          <button type="button" className="enlace" onClick={() => setReintento((r) => r + 1)}>
            Intentar otra vez
          </button>
        </p>
      )}
      {error3d && <p className="aviso-ra pequeno">{tu('Este celular no puede mostrar la escena en 3D.', 'Este celular no puede mostrar la escena en 3D.')}</p>}

      {movimiento === 'permiso' && (
        <div className="permiso-ra">
          <p style={{ margin: 0 }}>{tu('Para que los objetos se queden en su sitio al mover el celular, permite usar el movimiento.', 'Para que los objetos se queden en su sitio al mover el celular, permita usar el movimiento.')}</p>
          <button type="button" className="boton principal" onClick={() => motor.current?.pedirPermisoMovimiento()}>
            <Icono nombre="check" tamano={22} /> Permitir el movimiento
          </button>
        </div>
      )}

      <footer className="pie-ra">
        {mensaje && <p className="mensaje-ra">{mensaje}</p>}
        {config.modo === 'real' && conteo.total === 0 && (
          <p className="mensaje-ra pequeno">{tu('Apunta la cámara a huevos, frutas o piedras y toca cada uno para contarlo.', 'Apunte la cámara a las cosas y toque cada una para contarla.')}</p>
        )}
        {ayudaMovimiento && <p className="mensaje-ra pequeno">{ayudaMovimiento}</p>}
        <div className="fila" style={{ justifyContent: 'center' }}>
          <span className="contador-ra" aria-live="polite">
            {textoContador}
          </span>
          {config.modo === 'real' && conteo.total > 0 && (
            <button type="button" className="boton" onClick={() => motor.current?.borrarMarcas()}>
              <Icono nombre="repetir" tamano={22} anim="no" /> Borrar
            </button>
          )}
        </div>
        <button type="button" className="boton principal" onClick={alCerrar}>
          Listo <Icono nombre="siguiente" tamano={22} />
        </button>
      </footer>
    </div>
  );

  return createPortal(contenido, document.body);
}
