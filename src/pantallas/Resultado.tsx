import { useApp } from '../estado';
import { Estrellas } from '../componentes/Comunes';
import { Planta } from '../componentes/Ilustraciones';
import type { Efecto, ResultadoNivel } from '../juego/progresion';
import { insignia } from '../juego/progresion';
import { aciertosParaAprobar, nivelMaximo } from '../juego/motor';
import { nivelConTotal } from '../juego/complejidad';
import { haceDiagnostica, leerPruebas } from '../almacenamiento/datos';
import Icono, { IconoEmoji } from '../componentes/Icono';

const nombresEtapa = { semilla: 'semilla', brote: 'brote', planta: 'planta', flor: 'flor', fruto: 'fruto', cosecha: 'cosecha' };

export default function Resultado({ resultado: r, efecto: e }: { resultado: ResultadoNivel; efecto: Efecto }) {
  const { ir, perfil } = useApp();
  const adulto = perfil?.rol === 'familia';
  const estado = e.progreso.niveles[r.nivel];
  const fallos = estado && !estado.completado ? estado.intentos : 0;
  const ofrecerRepaso = !e.aprobado && fallos >= 2;
  const crecio = e.progreso.etapaPlanta !== e.etapaAnterior;
  const inclusion = r.pista === 'inclusion';
  // Al superar el último nivel se ofrece la prueba final (si aún no la hizo).
  const maximo = nivelMaximo(r.pista);
  const ofrecerFinal = e.aprobado && r.nivel === maximo && !!perfil && haceDiagnostica(perfil) && (!leerPruebas(perfil).final || !!leerPruebas(perfil).repetirFinal);

  return (
    <main className="pantalla centro">
      <section className="vidrio tarjeta-resultado">
      <h1 className="titulo-degradado">{e.aprobado ? (inclusion ? '¡Lo lograste!' : '¡Nivel superado!') : adulto ? 'Casi lo logra' : '¡Buen intento!'}</h1>
      <p style={{ margin: 0 }}>
        Nivel {nivelConTotal(r.pista, r.nivel)}
      </p>
      <Estrellas n={e.estrellas} />
      {inclusion ? (
        <p>Terminaste las {r.total} actividades. ¡Qué buen trabajo!</p>
      ) : (
        <p>
          {adulto ? 'Respondió bien' : 'Respondiste bien'} <strong>{r.aciertos}</strong> de {r.total}.
          {!e.aprobado && ` ${adulto ? 'Necesita' : 'Necesitas'} ${aciertosParaAprobar(r.pista, r.banda)} para pasar.`}
        </p>
      )}
      {!e.aprobado && (
        <p style={{ margin: 0 }}>
          {adulto
            ? 'No se pierde nada de lo avanzado. Puede intentarlo otra vez con ejercicios nuevos.'
            : 'No pierdes nada de lo que has ganado. Cada intento te hace más fuerte. ¡Inténtalo otra vez con ejercicios nuevos!'}
        </p>
      )}
      <div className="semillas" style={{ fontSize: '1.2rem' }}>
        <Icono nombre="brote" tamano={26} /> +{e.semillasGanadas} {e.semillasGanadas === 1 ? 'semilla' : 'semillas'}
      </div>
      <Planta etapa={e.progreso.etapaPlanta} tamano={130} />
      </section>
      {crecio && <p className="retro bien">
          <Icono nombre="brote" tamano={26} /> ¡{adulto ? 'Su' : 'Tu'} planta creció! Ahora es {nombresEtapa[e.progreso.etapaPlanta]}.</p>}
      {e.insigniasNuevas.length > 0 && (
        <div className="tarjeta columna" style={{ width: '100%' }}>
          <strong>{adulto ? 'Insignia nueva' : '¡Ganaste una insignia!'}</strong>
          <div className="insignias">
            {e.insigniasNuevas.map((id) => {
              const i = insignia(id);
              return (
                <div key={id} className="insignia">
                  <span className="icono-insignia">{i && <IconoEmoji emoji={i.icono} tamano={40} anim="siempre" />}</span>
                  {i?.nombre}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="columna" style={{ width: '100%' }}>
        {ofrecerFinal && (
          <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'prueba', tipo: 'final' }, { reemplazar: true })}>
            <Icono nombre="medalla" tamano={26} /> {adulto ? 'Hacer la prueba final' : '¡Haz la prueba final!'}
          </button>
        )}
        {e.aprobado && r.nivel < maximo && (
          <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: 'nivel', nivel: r.nivel + 1 }, { reemplazar: true })}>
            Siguiente nivel <Icono nombre="siguiente" tamano={24} />
          </button>
        )}
        {ofrecerRepaso && (
          <button type="button" className="boton principal naranja" onClick={() => ir({ nombre: 'nivel', nivel: r.nivel, repaso: true }, { reemplazar: true })}>
            <Icono nombre="libro" tamano={28} /> Hacer un repaso con pistas
          </button>
        )}
        <button type="button" className={`boton ${e.aprobado ? 'secundario' : 'principal'}`} onClick={() => ir({ nombre: 'nivel', nivel: r.nivel }, { reemplazar: true })}>
          <Icono nombre="repetir" tamano={26} /> {inclusion ? 'Hacerlo otra vez' : 'Repetir'}
        </button>
        <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'mapa' })}>
          <Icono nombre="mapa" tamano={26} /> Volver a la ruta
        </button>
      </div>
    </main>
  );
}
