// Ficha de un usuario: las acciones de gestión de su cuenta y su informe completo (el mismo de la
// pestaña Informes, filtrado a esta persona y con su ruta nivel por nivel).

import { useState } from 'react';
import Icono from '../componentes/Icono';
import FotoPerfil from '../componentes/FotoPerfil';
import { pruebasDe } from '../almacenamiento/datos';
import { BANDAS } from '../juego/motor';
import type { Banda } from '../juego/tipos';
import { descargar, fechaArchivo } from './descargas';
import * as api from './api';
import { useProfesor } from './contexto';
import { csvEventos, csvPartidas, pistaPruebasDe, type Alumno } from './informes';
import Informes from './reportes/Informes';
import { CambiarClave, Confirmar, detalleCuenta, EditarUsuario, hace } from './Usuarios';

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Detalle({ a }: { a: Alumno }) {
  const { abrirDetalle, ejecutar, recargar, alumnos, fotos } = useProfesor();
  const [hoja, setHoja] = useState<null | 'editar' | 'clave' | 'reiniciar' | 'eliminar'>(null);
  const [exportando, setExportando] = useState(false);
  const pistaPruebas = pistaPruebasDe(a);
  const pruebas = pruebasDe(a.perfil, a.fuente);
  const bandaFijada = a.fila.bandas?.[pistaPruebas] ?? null;
  const esEstudiante = a.fila.tipo === 'estudiante';

  const cambiarBanda = async (valor: string) => {
    const banda = valor === 'auto' ? null : (valor as Banda);
    if (await ejecutar(() => api.fijarBanda(a.fila.id, pistaPruebas, banda), banda ? `Exigencia: ${BANDAS[banda].nombre}` : 'Exigencia según la prueba de entrada')) await recargar();
  };

  const exportar = async () => {
    setExportando(true);
    try {
      const eventos = await api.cargarEventos(a.fila.id);
      descargar(`finca-${a.fila.usuario}-ejercicios-${fechaArchivo()}.csv`, csvEventos(eventos, alumnos), 'text/csv');
      descargar(`finca-${a.fila.usuario}-partidas-${fechaArchivo()}.csv`, csvPartidas([a]), 'text/csv');
    } catch (e) {
      void ejecutar(() => Promise.reject(e));
    } finally {
      setExportando(false);
    }
  };

  return (
    <main className="pantalla panel-pantalla">
      <header className="detalle-cabeza vidrio">
        <button type="button" className="boton icono" onClick={() => abrirDetalle(null)} aria-label="Volver a la lista">
          <Icono nombre="atras" tamano={24} />
        </button>
        <span className="anillo-avatar">{fotos[a.fila.id] || a.fila.avatar ? <FotoPerfil url={fotos[a.fila.id] ?? null} avatar={a.fila.avatar ?? ''} tamano={56} etiqueta="" /> : <Icono nombre="personas" tamano={40} anim="no" />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{a.fila.nombre}</h2>
          <div className="pequeno suave">
            {a.fila.usuario} · {detalleCuenta(a.fila)}
            {!a.fila.activo && <span className="chip chip-alerta">Desactivado</span>}
          </div>
          <div className="pequeno suave">
            Creado {fechaCorta(a.fila.creado)} · última sincronización {a.fila.ultima_sync ? hace(a.fila.ultima_sync) : 'nunca'}
          </div>
        </div>
      </header>

      <section className="fila panel-acciones" aria-label="Acciones">
        <button type="button" className="boton" onClick={() => setHoja('editar')}>
          <Icono nombre="lapiz" tamano={22} /> Editar tipo y grado
        </button>
        <button type="button" className="boton" onClick={() => setHoja('clave')}>
          <Icono nombre="candado" tamano={22} /> Cambiar contraseña
        </button>
        <button type="button" className="boton" onClick={exportar} disabled={exportando}>
          <Icono nombre="guardar" tamano={22} /> {exportando ? 'Preparando…' : 'Datos CSV'}
        </button>
        {a.fila.foto && (
          <button
            type="button"
            className="boton"
            onClick={async () => {
              if (window.confirm(`¿Quitar la foto de ${a.fila.nombre}? Volverá a verse su personaje.`) && (await ejecutar(() => api.quitarFoto(a.fila.id), 'Foto quitada'))) await recargar();
            }}
          >
            <Icono nombre="camara" tamano={22} /> Quitar foto
          </button>
        )}
      </section>

      {esEstudiante && (
        <section className="tarjeta columna">
          <h3>Exigencia y prueba final</h3>
          <label className="fila" style={{ gap: 10 }}>
            <span style={{ flex: '1 1 180px' }}>Exigencia en {a.fila.grado}.º</span>
            <select className="campo" style={{ flex: '1 1 200px' }} value={bandaFijada ?? 'auto'} onChange={(e) => void cambiarBanda(e.target.value)}>
              <option value="auto">Según la prueba de entrada{a.informe.banda && !bandaFijada ? ` (${BANDAS[a.informe.banda].nombre})` : ''}</option>
              {(Object.keys(BANDAS) as Banda[]).map((b) => (
                <option key={b} value={b}>
                  {BANDAS[b].nombre}: pasa con {BANDAS[b].aprobar} de 10
                </option>
              ))}
            </select>
          </label>
          <p className="pequeno suave" style={{ margin: 0 }}>
            Refuerzo: números más pequeños, dos opciones, el dibujo de ayuda visible y voz más lenta. Avanzado: números más grandes. El cambio llega al celular la próxima vez que tenga señal.
          </p>
          {pruebas.final && (
            <button
              type="button"
              className="boton"
              disabled={pruebas.repetirFinal}
              onClick={async () => {
                if (await ejecutar(() => api.permitirFinal(a.fila.id, pistaPruebas), 'Podrá repetir la prueba final')) await recargar();
              }}
            >
              <Icono nombre="repetir" tamano={22} /> {pruebas.repetirFinal ? 'Ya puede repetir la prueba final' : 'Permitir repetir la prueba final'}
            </button>
          )}
        </section>
      )}

      <Informes alumnoId={a.fila.id} />

      <section className="tarjeta columna zona-peligro" aria-label="Cuenta">
        <h3>Cuenta</h3>
        <div className="fila">
          <button
            type="button"
            className="boton"
            onClick={async () => {
              const activar = !a.fila.activo;
              if (!activar && !window.confirm(`¿Desactivar a ${a.fila.nombre}? No podrá entrar hasta que la active de nuevo. Sus resultados se conservan.`)) return;
              if (await ejecutar(() => api.fijarActivo(a.fila.id, activar), activar ? 'Cuenta activada' : 'Cuenta desactivada')) await recargar();
            }}
          >
            <Icono nombre={a.fila.activo ? 'pausa' : 'jugar-simple'} tamano={22} /> {a.fila.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" className="boton" onClick={() => setHoja('reiniciar')}>
            <Icono nombre="repetir" tamano={22} /> Reiniciar progreso
          </button>
          <button type="button" className="boton peligro" onClick={() => setHoja('eliminar')}>
            <Icono nombre="equis" tamano={22} /> Eliminar
          </button>
        </div>
      </section>

      {hoja === 'editar' && <EditarUsuario a={a} alCerrar={() => setHoja(null)} />}
      {hoja === 'clave' && <CambiarClave a={a} alCerrar={() => setHoja(null)} />}
      {(hoja === 'reiniciar' || hoja === 'eliminar') && <Confirmar a={a} accion={hoja} alCerrar={() => setHoja(null)} />}
    </main>
  );
}
