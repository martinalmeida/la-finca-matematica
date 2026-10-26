// Tutorial del nivel 0: tocar, arrastrar y usar el teclado numérico.

import { useEffect, useRef, useState } from 'react';
import { DibujoObjeto } from './Ilustraciones';
import Teclado from './Teclado';
import { sonar } from '../servicios/sonido';
import { useApp } from '../estado';

export default function Tutorial({ alTerminar, adulto }: { alTerminar: () => void; adulto: boolean }) {
  const { ajustes } = useApp();
  const [paso, setPaso] = useState(0);
  const [tocadas, setTocadas] = useState<number[]>([]);
  const [enCanasta, setEnCanasta] = useState(false);
  const [arrastre, setArrastre] = useState<{ x: number; y: number } | null>(null);
  const [valor, setValor] = useState('');
  const refCanasta = useRef<HTMLDivElement>(null);
  const t = (nino: string, adultoTxt: string) => (adulto ? adultoTxt : nino);

  useEffect(() => {
    if (!arrastre) return;
    const mover = (e: PointerEvent) => setArrastre({ x: e.clientX, y: e.clientY });
    const soltar = (e: PointerEvent) => {
      const r = refCanasta.current?.getBoundingClientRect();
      if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        setEnCanasta(true);
        sonar('acierto', ajustes.sonido);
      }
      setArrastre(null);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };
  }, [arrastre, ajustes.sonido]);

  const pasos = [
    {
      titulo: t('1. Tocar', '1. Tocar'),
      texto: t('Toca las 3 gallinas, una por una.', 'Toque las 3 gallinas, una por una.'),
      listo: tocadas.length === 3,
      contenido: (
        <div className="objetos">
          {[0, 1, 2].map((k) => (
            <button
              key={k}
              type="button"
              className={`objeto-tocable ${tocadas.includes(k) ? 'marcado' : ''}`}
              style={{ width: 72, height: 72 }}
              onClick={() => {
                sonar('toque', ajustes.sonido);
                setTocadas((s) => (s.includes(k) ? s : [...s, k]));
              }}
              aria-pressed={tocadas.includes(k)}
              aria-label={`Gallina ${k + 1}`}
            >
              <DibujoObjeto objeto="gallina" tamano={60} etiqueta="" />
              {tocadas.includes(k) && <span className="marca">{tocadas.indexOf(k) + 1}</span>}
            </button>
          ))}
        </div>
      ),
    },
    {
      titulo: t('2. Arrastrar', '2. Arrastrar'),
      texto: t('Pon el dedo sobre la mazorca y llévala hasta la canasta. También puedes tocarla.', 'Ponga el dedo sobre la mazorca y llévela hasta la canasta. También puede tocarla.'),
      listo: enCanasta,
      contenido: (
        <div className="arrastre">
          <div className="deposito" style={{ justifyContent: 'center' }}>
            {!enCanasta && (
              <button
                type="button"
                className="ficha boton plano"
                style={{ width: 64, height: 64, opacity: arrastre ? 0.3 : 1 }}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                  setArrastre({ x: e.clientX, y: e.clientY });
                }}
                onClick={() => {
                  setEnCanasta(true);
                  sonar('acierto', ajustes.sonido);
                }}
                aria-label="Mazorca: llévala a la canasta"
              >
                <DibujoObjeto objeto="mazorca" tamano={56} etiqueta="" />
              </button>
            )}
          </div>
          <div ref={refCanasta} className="deposito destino" style={{ justifyContent: 'center', alignItems: 'center' }} aria-label="Canasta">
            <DibujoObjeto objeto="canasta" tamano={64} />
            {enCanasta && <DibujoObjeto objeto="mazorca" tamano={40} />}
          </div>
          {arrastre && (
            <div className="ficha arrastrando" style={{ left: arrastre.x, top: arrastre.y }} aria-hidden="true">
              <DibujoObjeto objeto="mazorca" tamano={56} etiqueta="" />
            </div>
          )}
        </div>
      ),
    },
    {
      titulo: t('3. Escribir números', '3. Escribir números'),
      texto: t('Con el teclado de la finca, escribe el número 7 y toca «Listo».', 'Con el teclado, escriba el número 7 y toque «Listo».'),
      listo: false,
      contenido: (
        <Teclado
          valor={valor}
          onCambio={setValor}
          onListo={() => {
            if (valor === '7') {
              sonar('acierto', ajustes.sonido);
              alTerminar();
            } else setValor('');
          }}
        />
      ),
    },
  ];
  const p = pasos[paso];
  return (
    <section className="columna">
      <h2>{t('Aprende a jugar', 'Cómo se usa')}</h2>
      <div className="progreso-nivel" aria-label={`Paso ${paso + 1} de 3`}>
        {pasos.map((_, k) => (
          <span key={k} className={`punto ${k < paso ? 'hecho' : k === paso ? 'actual' : ''}`} />
        ))}
      </div>
      <h3>{p.titulo}</h3>
      <p className="enunciado">{p.texto}</p>
      {p.contenido}
      {p.listo && (
        <>
          <div className="retro bien">✔ {t('¡Muy bien!', '¡Muy bien!')}</div>
          <button type="button" className="boton principal" onClick={() => setPaso(paso + 1)}>
            Siguiente ➜
          </button>
        </>
      )}
      <button type="button" className="boton plano pequeno" onClick={alTerminar}>
        {t('Saltar el tutorial', 'Omitir')}
      </button>
    </section>
  );
}
