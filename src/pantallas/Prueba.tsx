// Prueba diagnóstica (al entrar) y prueba final (al terminar los 10 niveles).
// La diagnóstica hace de tutorial: antes de cada forma nueva de responder sale «Así se responde».
// Con el puntaje se asigna la exigencia (estudiantes) o la ruta (familias).
// La final es una forma paralela de la diagnóstica y se compara con ella tema por tema.

import { useMemo, useRef, useState } from 'react';
import { useApp } from '../estado';
import Ejercicio, { type ResultadoEjercicio } from '../componentes/Ejercicio';
import AsiSeResponde, { tieneTarjeta } from '../componentes/AsiSeResponde';
import Comparacion from '../componentes/Comparacion';
import Icono from '../componentes/Icono';
import { Medidor } from '../componentes/Historia';
import {
  bandaDePerfil,
  guardarPartida,
  guardarProgreso,
  guardarResultadoPrueba,
  leerProgreso,
  leerPruebas,
  pistaDePerfil,
  pistaDePrueba,
  registrar,
  type Perfil,
} from '../almacenamiento/datos';
import { sincronizarPronto } from '../servicios/sincronizacion';
import { BANDAS, generarPrueba, type TipoPrueba } from '../juego/motor';
import { rutaFamiliaPorPuntaje, type ResultadoPrueba } from '../juego/pruebas';
import { darInsignia } from '../juego/progresion';
import { barrasBanda, RESUMEN_GRADO } from '../juego/complejidad';
import { sonar } from '../servicios/sonido';
import { useLecturaAutomatica } from '../servicios/voz';
import type { Interaccion, Pista } from '../juego/tipos';

const MENSAJE_BANDA = {
  refuerzo: 'Vamos a ir paso a paso: números más pequeños, dos opciones para elegir y ayudas a la vista. ¡Cada nivel te hará más fuerte!',
  basico: 'Tu ruta tiene números de la medida justa para tu grado. ¡Vamos a practicar!',
  avanzado: '¡Llegaste con mucha fuerza! Tu ruta trae números más grandes y retos más exigentes.',
};

/** Guarda la insignia en el progreso de la ruta del perfil. */
function insigniaEnRuta(p: Perfil, pista: Pista, id: string) {
  const prog = leerProgreso(p.id, pista);
  if (darInsignia(prog, id)) guardarProgreso(p.id, pista, prog);
}

export default function Prueba({ tipo }: { tipo: TipoPrueba }) {
  const { perfil, ir, ajustes } = useApp();
  const p = perfil!;
  const adulto = p.rol === 'familia';
  const t = (nino: string, adultoTxt: string) => (adulto ? adultoTxt : nino);
  const pistaPrueba = pistaDePrueba(p);
  const haceBanda = !adulto;
  const pruebasGuardadas = useMemo(() => leerPruebas(p), [p.id]);
  const yaHecha = tipo === 'diagnostica' ? pruebasGuardadas.diagnostica : pruebasGuardadas.repetirFinal ? undefined : pruebasGuardadas.final;
  // Cada repetición de la final trae preguntas nuevas (la 3.ª no repite la 2.ª).
  const intento = tipo === 'final' && pruebasGuardadas.final ? (pruebasGuardadas.finalesUsados ?? 0) + 2 : 1;
  const ejercicios = useMemo(() => generarPrueba({ codigo: p.usuario, pista: pistaPrueba, tipo, intento }), [p.usuario, pistaPrueba, tipo, intento]);

  const [fase, setFase] = useState<'intro' | 'jugando' | 'fin'>(yaHecha ? 'fin' : 'intro');
  const [indice, setIndice] = useState(0);
  const [porTema, setPorTema] = useState<boolean[]>([]);
  const [resultado, setResultado] = useState<ResultadoPrueba | null>(yaHecha ?? null);
  // Formas de responder ya explicadas (solo en la diagnóstica, que hace de tutorial).
  const [vistas, setVistas] = useState<Set<Interaccion['tipo']>>(() => new Set());
  const inicio = useRef(Date.now());

  const textoIntro =
    tipo === 'diagnostica'
      ? t(
          'Antes de empezar, vamos a conocernos. Son 10 preguntas, una de cada tema de tu ruta. No es una nota: sirve para preparar tu ruta a tu medida. Si no sabes una, responde lo que creas y sigue.',
          'Antes de empezar, conozcamos qué tanto domina. Son 10 preguntas de la vida diaria. No es un examen: sirve para elegir el cuaderno que más le conviene.',
        )
      : t(
          '¡Terminaste los 10 niveles! Ahora vamos a ver cuánto aprendiste. Son 10 preguntas parecidas a las del comienzo.',
          '¡Terminó los 10 niveles! Ahora veamos cuánto avanzó. Son 10 preguntas parecidas a las del comienzo.',
        );
  useLecturaAutomatica(`prueba-${tipo}-intro`, textoIntro, fase === 'intro');

  // Cada pregunta se cuenta una sola vez (un doble toque al final no guarda la prueba dos veces).
  const contado = useRef(-1);
  const terminarEjercicio = (r: ResultadoEjercicio) => {
    if (contado.current >= indice) return;
    contado.current = indice;
    const ej = ejercicios[indice];
    registrar(tipo === 'diagnostica' ? 'prueba-diagnostica' : 'prueba-final', {
      pista: pistaPrueba,
      nivel: indice + 1,
      plantilla: ej.plantilla,
      operacion: ej.operacion,
      correcto: r.correcto,
      intentos: 1,
      pistasUsadas: 0,
      tipoError: r.tipoError,
      ms: r.ms,
    });
    const lista = [...porTema, r.correcto];
    setPorTema(lista);
    if (indice + 1 < ejercicios.length) {
      setIndice(indice + 1);
      window.scrollTo(0, 0);
      return;
    }
    const res: ResultadoPrueba = {
      fecha: new Date().toISOString(),
      pista: pistaPrueba,
      porTema: lista,
      aciertos: lista.filter(Boolean).length,
      total: lista.length,
      ms: Date.now() - inicio.current,
    };
    guardarResultadoPrueba(p, tipo, res);
    guardarPartida({
      tipo: tipo === 'diagnostica' ? 'prueba-diagnostica' : 'prueba-final',
      pista: pistaPrueba,
      nivel: null,
      aciertos: res.aciertos,
      total: res.total,
      estrellas: null,
      ms_total: res.ms,
      repaso: false,
      banda: haceBanda ? bandaDePerfil(p) : null,
    });
    sincronizarPronto();
    if (tipo === 'diagnostica') {
      // Estudiantes: la banda sale de la diagnóstica guardada. Familias: la ruta (pistaDePerfil la deduce).
      insigniaEnRuta(p, pistaDePerfil(p), 'primer-surco');
    } else {
      insigniaEnRuta(p, pistaDePerfil(p), 'gran-cosecha');
    }
    sonar('nivel', ajustes.sonido);
    setResultado(res);
    setFase('fin');
    window.scrollTo(0, 0);
  };

  if (fase === 'intro') {
    return (
      <main className="pantalla">
        <section className="vidrio tarjeta columna centro tarjeta-prueba">
          <span className="icono-prueba" aria-hidden="true">
            <Icono nombre={tipo === 'diagnostica' ? 'brote' : 'medalla'} tamano={56} anim="siempre" />
          </span>
          <h1 className="titulo-degradado" style={{ margin: 0 }}>
            {tipo === 'diagnostica' ? t('¡Bienvenido a tu finca!', 'Prueba de entrada') : 'Prueba final'}
          </h1>
          <p style={{ margin: 0 }}>{textoIntro}</p>
          <ul className="lista-prueba">
            <li>
              <Icono nombre="check" tamano={20} /> {t('Una sola respuesta por pregunta.', 'Una sola respuesta por pregunta.')}
            </li>
            <li>
              <Icono nombre="check" tamano={20} /> {t('Sin pistas: muéstranos lo que ya sabes.', 'Sin pistas: muestre lo que ya sabe.')}
            </li>
            {tipo === 'diagnostica' && (
              <li>
                <Icono nombre="check" tamano={20} /> {t('Te enseñamos cada forma de responder antes de usarla.', 'Antes de cada forma nueva de responder le mostramos cómo se hace.')}
              </li>
            )}
          </ul>
        </section>
        <button
          type="button"
          className="boton principal brillo"
          onClick={() => {
            // El tiempo de la prueba empieza al empezar a responder, no en la pantalla de presentación.
            inicio.current = Date.now();
            setFase('jugando');
          }}
        >
          <Icono nombre="jugar-simple" tamano={24} /> {t('¡Empezar!', 'Empezar')}
        </button>
        {tipo === 'final' && (
          <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'mapa' })}>
            {t('Más tarde', 'Más tarde')}
          </button>
        )}
      </main>
    );
  }

  if (fase === 'fin' && resultado) {
    const pr = leerPruebas(p);
    const banda = bandaDePerfil(p);
    const ruta = tipo === 'diagnostica' ? rutaFamiliaPorPuntaje(resultado.aciertos, resultado.total) : pistaDePerfil(p);
    return (
      <main className="pantalla">
        <section className="vidrio tarjeta-resultado columna centro">
          <h1 className="titulo-degradado" style={{ margin: 0 }}>
            {tipo === 'diagnostica' ? t('¡Listo! Tu ruta está preparada', 'Su cuaderno está listo') : t('¡Terminaste la prueba final!', 'Terminó la prueba final')}
          </h1>
          <p style={{ margin: 0 }}>
            {t('Respondiste bien', 'Respondió bien')} <strong>{resultado.aciertos}</strong> de {resultado.total}.
          </p>
          {tipo === 'diagnostica' && !adulto && (
            <>
              <span className="chip">
                {t('Tu ruta:', 'Ruta:')} {BANDAS[banda].nombre} <Medidor barras={barrasBanda(banda)} max={3} etiqueta={`Exigencia ${BANDAS[banda].nombre}`} />
              </span>
              <p style={{ margin: 0 }}>{MENSAJE_BANDA[banda]}</p>
            </>
          )}
          {tipo === 'diagnostica' && adulto && (
            <>
              <span className="chip">{RESUMEN_GRADO[ruta].nombre}</span>
              <p style={{ margin: 0 }}>Temas: {RESUMEN_GRADO[ruta].foco.toLowerCase()}.</p>
            </>
          )}
        </section>
        {tipo === 'final' && pr.diagnostica && <Comparacion diagnostica={pr.diagnostica} final={resultado} adulto={adulto} />}
        <button type="button" className="boton principal brillo" onClick={() => ir({ nombre: tipo === 'diagnostica' ? 'mapa' : 'mifinca' })}>
          {tipo === 'diagnostica' ? t('Ver mi ruta', 'Ver mi cuaderno') : t('Ir a mi finca', 'Ir a mi perfil')} <Icono nombre="siguiente" tamano={24} />
        </button>
        {tipo === 'final' && (
          <button type="button" className="boton secundario" onClick={() => ir({ nombre: 'mapa' })}>
            <Icono nombre="mapa" tamano={24} /> {t('Volver a la ruta para repasar', 'Volver a la ruta para repasar')}
          </button>
        )}
      </main>
    );
  }

  const ej = ejercicios[indice];
  const tipoInteraccion = ej.interaccion.tipo;
  const explicar = tipo === 'diagnostica' && !vistas.has(tipoInteraccion) && tieneTarjeta(tipoInteraccion);

  return (
    <main className="pantalla">
      <header className="barra">
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0 }}>{tipo === 'diagnostica' ? t('Prueba de entrada', 'Prueba de entrada') : 'Prueba final'}</h1>
          <div className="pequeno suave">{RESUMEN_GRADO[pistaPrueba].foco}</div>
        </div>
      </header>
      <div className="progreso-nivel" role="progressbar" aria-valuemin={1} aria-valuemax={ejercicios.length} aria-valuenow={indice + 1} aria-label={`Pregunta ${indice + 1} de ${ejercicios.length}`}>
        {ejercicios.map((_, k) => (
          // Sin verde ni rojo: la prueba no muestra si cada respuesta estuvo bien.
          <span key={k} className={`punto ${k < indice ? 'hecho' : k === indice ? 'actual' : ''}`} />
        ))}
        <span className="pequeno" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {indice + 1} de {ejercicios.length}
        </span>
      </div>
      {explicar ? (
        <AsiSeResponde key={tipoInteraccion} tipo={tipoInteraccion} adulto={adulto} alContinuar={() => setVistas((v) => new Set(v).add(tipoInteraccion))} />
      ) : (
        <Ejercicio key={ej.id} ej={ej} modo="prueba" onTerminar={terminarEjercicio} />
      )}
    </main>
  );
}
