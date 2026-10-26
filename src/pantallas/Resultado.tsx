import { useApp } from '../estado';
import { Estrellas } from '../componentes/Comunes';
import { Planta } from '../componentes/Ilustraciones';
import type { Efecto, ResultadoNivel } from '../juego/progresion';
import { insignia } from '../juego/progresion';
import { NIVEL_MAXIMO, aciertosParaAprobar } from '../juego/motor';

const nombresEtapa = { semilla: 'semilla', brote: 'brote', planta: 'planta', flor: 'flor', fruto: 'fruto', cosecha: 'cosecha' };

export default function Resultado({ resultado: r, efecto: e }: { resultado: ResultadoNivel; efecto: Efecto }) {
  const { ir, perfil } = useApp();
  const adulto = perfil?.rol === 'familia';
  const estado = e.progreso.niveles[r.nivel];
  const fallos = estado && !estado.completado ? estado.intentos : 0;
  const ofrecerRepaso = !e.aprobado && fallos >= 2;
  const crecio = e.progreso.etapaPlanta !== e.etapaAnterior;

  return (
    <main className="pantalla centro">
      <h1>{e.aprobado ? (adulto ? '¡Nivel superado!' : '¡Nivel superado! 🎉') : adulto ? 'Casi lo logra' : '¡Buen intento!'}</h1>
      <p style={{ margin: 0 }}>Nivel {r.nivel} de 100</p>
      <Estrellas n={e.estrellas} />
      <p>
        {adulto ? 'Respondió bien' : 'Respondiste bien'} <strong>{r.aciertos}</strong> de {r.total}.
        {!e.aprobado && ` ${adulto ? 'Necesita' : 'Necesitas'} ${aciertosParaAprobar(r.pista)} para pasar.`}
      </p>
      {!e.aprobado && (
        <p className="tarjeta" style={{ margin: 0 }}>
          {adulto
            ? 'No se pierde nada de lo avanzado. Puede intentarlo otra vez con ejercicios nuevos.'
            : 'No pierdes nada de lo que has ganado. Cada intento te hace más fuerte. ¡Inténtalo otra vez con ejercicios nuevos!'}
        </p>
      )}
      <div className="semillas" style={{ fontSize: '1.2rem' }}>
        🌱 +{e.semillasGanadas} {e.semillasGanadas === 1 ? 'semilla' : 'semillas'}
      </div>
      <Planta etapa={e.progreso.etapaPlanta} tamano={130} />
      {crecio && <p className="retro bien">🌿 ¡{adulto ? 'Su' : 'Tu'} planta creció! Ahora es {nombresEtapa[e.progreso.etapaPlanta]}.</p>}
      {e.insigniasNuevas.length > 0 && (
        <div className="tarjeta columna" style={{ width: '100%' }}>
          <strong>{adulto ? 'Insignia nueva' : '¡Ganaste una insignia!'}</strong>
          <div className="insignias">
            {e.insigniasNuevas.map((id) => {
              const i = insignia(id);
              return (
                <div key={id} className="insignia">
                  <span className="icono-insignia" aria-hidden="true">
                    {i?.icono}
                  </span>
                  {i?.nombre}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="columna" style={{ width: '100%' }}>
        {e.aprobado && r.nivel < NIVEL_MAXIMO && (
          <button type="button" className="boton principal" onClick={() => ir({ nombre: 'nivel', nivel: r.nivel + 1 }, { reemplazar: true })}>
            Siguiente nivel ➜
          </button>
        )}
        {ofrecerRepaso && (
          <button type="button" className="boton principal naranja" onClick={() => ir({ nombre: 'nivel', nivel: r.nivel, repaso: true }, { reemplazar: true })}>
            📗 {adulto ? 'Hacer un repaso con pistas' : 'Hacer un repaso con pistas'}
          </button>
        )}
        <button type="button" className={`boton ${e.aprobado ? 'secundario' : 'principal'}`} onClick={() => ir({ nombre: 'nivel', nivel: r.nivel }, { reemplazar: true })}>
          🔁 Repetir
        </button>
        <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'mapa' })}>
          🗺️ Volver al mapa
        </button>
      </div>
    </main>
  );
}
