import { useMemo, useState } from 'react';
import { useApp } from '../estado';
import Ejercicio, { type ResultadoEjercicio } from '../componentes/Ejercicio';
import Tutorial from '../componentes/Tutorial';
import { generarNivel, esCosecha, tramoDe } from '../juego/motor';
import { aplicarResultado, type ResultadoNivel } from '../juego/progresion';
import {
  guardarProgreso,
  leerProgreso,
  leerResumen,
  marcarTutorialVisto,
  pistaDePerfil,
  registrar,
  sumarAlResumen,
  tutorialVisto,
} from '../almacenamiento/datos';
import { sonar } from '../servicios/sonido';
import Icono from '../componentes/Icono';
import { unidadDe } from '../juego/complejidad';
import { videoDeLeccion } from '../contenido/videos';

export default function Nivel({ nivel, repaso }: { nivel: number; repaso: boolean }) {
  const { perfil, ir, ajustes } = useApp();
  const p = perfil!;
  const pista = pistaDePerfil(p);
  const adulto = p.rol === 'familia';
  const progreso = useMemo(() => leerProgreso(p.id, pista), [p.id, pista]);
  const intento = (progreso.niveles[nivel]?.intentos ?? 0) + 1;
  // Los ejercicios del nivel se generan al entrar a él.
  const ejercicios = useMemo(() => generarNivel({ codigo: p.codigo, pista, nivel, intento, repaso }), [p.codigo, pista, nivel, intento, repaso]);
  const video = videoDeLeccion(pista, unidadDe(pista, Math.max(nivel, 1)).indice);
  const [verTutorial, setVerTutorial] = useState(nivel === 0 && !tutorialVisto(p.id));
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoEjercicio[]>([]);

  const terminarEjercicio = (r: ResultadoEjercicio) => {
    const ej = ejercicios[indice];
    sumarAlResumen(p.id, ej.operacion, r.correcto, r.tipoError);
    registrar(p.id, {
      t: new Date().toISOString(),
      pista,
      nivel,
      plantilla: ej.plantilla,
      operacion: ej.operacion,
      correcto: r.correcto,
      intentos: r.errores + (r.correcto ? 1 : 0),
      pistasUsadas: r.pistas,
      tipoError: r.tipoError,
      ms: r.ms,
    });
    const todos = [...resultados, r];
    setResultados(todos);
    if (indice + 1 < ejercicios.length) {
      setIndice(indice + 1);
      window.scrollTo(0, 0);
      return;
    }
    const resultado: ResultadoNivel = {
      pista,
      nivel,
      aciertos: todos.filter((x) => x.correcto).length,
      total: todos.length,
      errores: todos.reduce((s, x) => s + x.errores, 0),
      pistasUsadas: todos.reduce((s, x) => s + x.pistas, 0),
      intento,
      repaso,
      semillas: todos.reduce((s, x) => s + x.semillas, 0),
    };
    const efecto = aplicarResultado(leerProgreso(p.id, pista), resultado, leerResumen(p.id).diasJugados.length);
    guardarProgreso(p.id, pista, efecto.progreso);
    sonar(efecto.aprobado ? 'nivel' : 'intento', ajustes.sonido);
    ir({ nombre: 'resultado', resultado, efecto }, { reemplazar: true });
  };

  return (
    <main className="pantalla">
      <header className="barra">
        <button type="button" className="boton icono" onClick={() => ir({ nombre: 'mapa' })} aria-label="Salir al mapa">
          <Icono nombre="cerrar" tamano={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0 }}>
            Nivel {nivel} de 100 {esCosecha(nivel) && <Icono nombre="canasta" tamano={26} etiqueta="Nivel de cosecha" />}
          </h1>
          <div className="pequeno suave">
            {repaso ? 'Repaso con pistas · ' : ''}
            {esCosecha(nivel) ? 'Nivel de cosecha' : tramoDe(pista, nivel).titulo}
          </div>
        </div>
      </header>

      {verTutorial ? (
        <Tutorial
          adulto={adulto}
          alTerminar={() => {
            marcarTutorialVisto(p.id);
            setVerTutorial(false);
          }}
        />
      ) : (
        <>
          <div className="progreso-nivel" role="progressbar" aria-valuemin={1} aria-valuemax={ejercicios.length} aria-valuenow={indice + 1} aria-label={`Ejercicio ${indice + 1} de ${ejercicios.length}`}>
            {ejercicios.map((_, k) => (
              <span key={k} className={`punto ${k < indice ? (resultados[k]?.correcto ? 'hecho' : 'fallado') : k === indice ? 'actual' : ''}`} />
            ))}
            <span className="pequeno" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {indice + 1} de {ejercicios.length}
            </span>
          </div>
          <Ejercicio key={ejercicios[indice].id} ej={ejercicios[indice]} onTerminar={terminarEjercicio} pistaVisible={repaso} video={video} />
        </>
      )}
    </main>
  );
}
