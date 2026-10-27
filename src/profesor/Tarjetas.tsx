// Tarjetas de acceso: nombre, usuario y contraseña para recortar y entregar.
// Las contraseñas solo se conocen al crearlas o cambiarlas: no se guardan en ninguna parte.

import { Logo } from '../componentes/Ilustraciones';

export type Credencial = { nombre: string; usuario: string; clave: string; detalle: string };

export function TarjetaAcceso({ c }: { c: Credencial }) {
  return (
    <article className="tarjeta-acceso">
      <header>
        <Logo tamano={36} />
        <div>
          <strong>La Finca Matemática</strong>
          <div className="pequeno">{c.detalle}</div>
        </div>
      </header>
      <p className="ta-nombre">{c.nombre}</p>
      <dl>
        <dt>Usuario</dt>
        <dd>{c.usuario}</dd>
        <dt>Contraseña</dt>
        <dd>{c.clave}</dd>
      </dl>
      <p className="pequeno">Guarda esta tarjeta. Si olvidas la contraseña, pídele al profesor una nueva.</p>
    </article>
  );
}

export function HojaTarjetas({ lista }: { lista: Credencial[] }) {
  return (
    <div className="hoja-tarjetas">
      {lista.map((c) => (
        <TarjetaAcceso key={c.usuario} c={c} />
      ))}
    </div>
  );
}
