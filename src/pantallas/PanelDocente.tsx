// Panel docente: se abre con pulsación larga de 3 s sobre el logo y un PIN creado la primera vez.

import { useState } from 'react';
import { useApp } from '../estado';
import { Barra } from '../componentes/Comunes';
import Teclado from '../componentes/Teclado';
import { eliminarPerfil, guardarDocente, leerDocente, reiniciarPerfil } from '../almacenamiento/datos';
import { hashTexto } from '../juego/rng';
import { csvRegistro, csvResumen, informeTodos, jsonInvestigacion, nombresOperacion } from '../juego/informes';
import { descargar, fechaArchivo } from '../almacenamiento/copia';
import type { Operacion } from '../juego/tipos';
import Icono from '../componentes/Icono';

const hashPin = (pin: string) => String(hashTexto('finca-docente|' + pin));

function Acceso({ alEntrar }: { alEntrar: () => void }) {
  const docente = leerDocente();
  const creando = !docente.pinHash;
  const [pin, setPin] = useState('');
  const [primero, setPrimero] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titulo = creando ? (primero ? 'Repita el PIN' : 'Cree un PIN de 4 a 6 cifras') : 'Escriba el PIN docente';
  return (
    <main className="pantalla">
      <Barra titulo="Panel docente" />
      <p>{titulo}</p>
      {error && <p className="retro casi">{error}</p>}
      <div className="pantalla-numero" aria-label={`${pin.length} cifras escritas`}>
        {'•'.repeat(pin.length)}
      </div>
      <Teclado
        valor={pin}
        sinPantalla
        maxCifras={6}
        onCambio={setPin}
        onListo={() => {
          setError(null);
          if (creando) {
            if (pin.length < 4) return setError('El PIN debe tener al menos 4 cifras.');
            if (!primero) {
              setPrimero(pin);
              setPin('');
              return;
            }
            if (pin !== primero) {
              setPrimero(null);
              setPin('');
              return setError('Los PIN no coinciden. Empiece de nuevo.');
            }
            guardarDocente({ ...docente, pinHash: hashPin(pin) });
            alEntrar();
          } else if (hashPin(pin) === docente.pinHash) alEntrar();
          else {
            setPin('');
            setError('PIN incorrecto.');
          }
        }}
      />
      <p className="pequeno suave">
        Si olvida el PIN, puede restaurarlo borrando los datos del sitio en el navegador (se pierden los avances) o restaurando una copia de seguridad.
      </p>
    </main>
  );
}

export default function PanelDocente() {
  const { avisar, perfil, elegirPerfil } = useApp();
  const [dentro, setDentro] = useState(false);
  const [docente, setDocente] = useState(leerDocente());
  const [, refrescar] = useState(0);

  if (!dentro) return <Acceso alEntrar={() => setDentro(true)} />;

  const filas = informeTodos();
  const ops: Operacion[] = ['suma', 'resta', 'multiplicacion', 'division'];

  const cambiarInvestigacion = (v: boolean) => {
    if (v && !window.confirm('Active el modo investigación solo si cuenta con el consentimiento informado de las familias. ¿Confirmar?')) return;
    const d = { ...docente, modoInvestigacion: v };
    guardarDocente(d);
    setDocente(d);
  };

  return (
    <main className="pantalla">
      <Barra titulo="Panel docente" />
      <section className="tarjeta columna">
        <label className="interruptor">
          <span>
            <strong>Modo investigación</strong>
            <br />
            <span className="pequeno">Guarda el registro detallado de cada ejercicio (máx. 3.000 por perfil). Actívelo solo con consentimiento informado.</span>
          </span>
          <input type="checkbox" checked={docente.modoInvestigacion} onChange={(e) => cambiarInvestigacion(e.target.checked)} />
        </label>
        <p className="pequeno" style={{ margin: 0 }}>
          Estado: <strong>{docente.modoInvestigacion ? 'Activado' : 'Desactivado'}</strong>
        </p>
      </section>

      <section className="tarjeta columna">
        <h2>Exportar datos (solo códigos)</h2>
        <div className="fila">
          <button type="button" className="boton" onClick={() => descargar(`finca-resumen-${fechaArchivo()}.csv`, csvResumen(), 'text/csv')}>
            <Icono nombre="grafico" tamano={24} /> Resumen CSV
          </button>
          <button type="button" className="boton" onClick={() => descargar(`finca-registro-${fechaArchivo()}.csv`, csvRegistro(), 'text/csv')}>
            <Icono nombre="cuaderno" tamano={24} /> Registro CSV
          </button>
          <button type="button" className="boton" onClick={() => descargar(`finca-investigacion-${fechaArchivo()}.json`, jsonInvestigacion())}>
            <Icono nombre="carpeta" tamano={24} /> JSON
          </button>
        </div>
      </section>

      <section className="columna">
        <h2>Perfiles de este celular ({filas.length})</h2>
        <div className="tabla-scroll">
          <table className="tabla-panel">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Grado</th>
                <th scope="col">Nivel máx.</th>
                <th scope="col">★</th>
                {ops.map((o) => (
                  <th key={o} scope="col">
                    % {nombresOperacion[o].slice(0, 5)}.
                  </th>
                ))}
                <th scope="col">Errores frecuentes</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.perfil.id}>
                  <th scope="row">{f.perfil.codigo}</th>
                  <td>{f.perfil.grado ? `${f.perfil.grado}.º` : 'Familia'}</td>
                  <td>{f.nivelMaximo}</td>
                  <td>{f.estrellas}</td>
                  {ops.map((o) => (
                    <td key={o}>{f.porcentajes[o] ? `${f.porcentajes[o]!.pct} % (${f.porcentajes[o]!.total})` : '—'}</td>
                  ))}
                  <td>{f.erroresFrecuentes.map((e) => `${e.tipo} (${e.n})`).join(', ') || '—'}</td>
                  <td>
                    <div className="columna">
                      <button
                        type="button"
                        className="boton"
                        onClick={() => {
                          if (!window.confirm(`¿Reiniciar el progreso de ${f.perfil.codigo}? Se borran niveles, semillas y registro.`)) return;
                          reiniciarPerfil(f.perfil.id);
                          avisar('Perfil reiniciado');
                          refrescar((x) => x + 1);
                        }}
                      >
                        Reiniciar
                      </button>
                      <button
                        type="button"
                        className="boton peligro"
                        onClick={() => {
                          if (!window.confirm(`¿Eliminar el perfil ${f.perfil.codigo} y todos sus datos? No se puede deshacer.`)) return;
                          eliminarPerfil(f.perfil.id);
                          if (perfil?.id === f.perfil.id) elegirPerfil(null);
                          avisar('Perfil eliminado');
                          refrescar((x) => x + 1);
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pequeno suave">Los porcentajes no son notas escolares: muestran en qué operaciones conviene reforzar.</p>
      </section>
    </main>
  );
}
