// Barra de pestañas flotante de vidrio (como las apps del celular).

import { useApp, type Pantalla } from '../estado';
import { Avatar } from './Ilustraciones';
import Icono, { type NombreIcono } from './Icono';

type Item = { destino: Pantalla; icono: NombreIcono | ''; texto: string };

export default function Pestanas() {
  const { perfil, pantalla, ir } = useApp();
  const adulto = perfil?.rol === 'familia';
  const items: Item[] = [
    { destino: { nombre: 'inicio' }, icono: 'casa', texto: 'Inicio' },
    { destino: { nombre: 'mapa' }, icono: 'mapa', texto: 'Ruta' },
    { destino: { nombre: 'aprender' }, icono: 'libro', texto: 'Aprender' },
    adulto ? { destino: { nombre: 'familias', seccion: 'menu' }, icono: 'cuaderno', texto: 'Cuaderno' } : { destino: { nombre: 'mifinca' }, icono: '', texto: 'Perfil' },
  ];
  const activa = items.findIndex((i) => i.destino.nombre === pantalla.nombre);

  return (
    <nav className="pestanas vidrio" aria-label="Secciones" style={{ ['--activa' as string]: Math.max(activa, 0) }}>
      <span className="pestana-indicador" aria-hidden="true" />
      {items.map((i, k) => (
        <button
          key={i.texto}
          type="button"
          className={`pestana ${k === activa ? 'activa' : ''}`}
          aria-current={k === activa ? 'page' : undefined}
          onClick={() => {
            if (k === activa) window.scrollTo({ top: 0, behavior: 'smooth' });
            else ir(i.destino);
          }}
        >
          <span className="pestana-icono" aria-hidden="true">
            {/* La clave hace que el ícono vuelva a animarse al activar la pestaña. */}
            {i.icono ? <Icono key={k === activa ? 'activa' : 'inactiva'} nombre={i.icono} tamano={30} anim={k === activa ? 'una' : 'no'} /> : <Avatar id={perfil!.avatar} tamano={30} etiqueta="" />}
          </span>
          <span className="pestana-texto">{i.texto}</span>
        </button>
      ))}
    </nav>
  );
}
