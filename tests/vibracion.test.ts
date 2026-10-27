// La vibración es solo para los errores: un pulso corto, y nada si está apagada en Ajustes.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PULSO_ERROR, retroError, sonar } from '../src/servicios/sonido';

function simularCelular() {
  const vibrate = vi.fn(() => true);
  vi.stubGlobal('navigator', { vibrate, userAgent: 'Android' });
  return vibrate;
}

afterEach(() => vi.unstubAllGlobals());

describe('vibración', () => {
  it('un error vibra una sola vez y corto', () => {
    const vibrate = simularCelular();
    retroError({ sonido: false, vibracion: true });
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(PULSO_ERROR);
    expect(PULSO_ERROR).toBeLessThanOrEqual(50);
  });

  it('no vibra si la vibración está apagada', () => {
    const vibrate = simularCelular();
    retroError({ sonido: false, vibracion: false });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('un acierto solo suena: no vibra', () => {
    const vibrate = simularCelular();
    sonar('acierto', false);
    expect(vibrate).not.toHaveBeenCalled();
  });
});
