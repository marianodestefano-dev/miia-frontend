import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createOnboardingPanel = require('../assets/ludomiia-panels/onboarding-panel.js');

describe('onboarding-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  test('crea element HTMLElement', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('step 1 inicial muestra Bienvenido', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Bienvenido');
  });

  test('3 barras de progreso', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    expect(p.element.querySelectorAll('.ob-progress-step').length).toBe(3);
  });

  test('boton Siguiente deshabilitado cuando nickname vacio', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.ob-next1-btn').hasAttribute('disabled')).toBe(true);
  });

  test('input nickname habilita boton Siguiente', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    const input = p.element.querySelector('.ob-nick-input');
    input.value = 'Mariano';
    input.dispatchEvent(new Event('input'));
    expect(p._state.nickname).toBe('Mariano');
    expect(p.element.querySelector('.ob-next1-btn').hasAttribute('disabled')).toBe(false);
  });

  test('input vacio mantiene boton disabled', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    const input = p.element.querySelector('.ob-nick-input');
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    expect(p.element.querySelector('.ob-next1-btn').hasAttribute('disabled')).toBe(true);
  });

  test('click Siguiente en step 1 avanza a step 2', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._state.nickname = 'Test';
    p._setState({ step: 1 });
    p.element.querySelector('.ob-next1-btn').removeAttribute('disabled');
    p.element.querySelector('.ob-next1-btn').click();
    expect(p._state.step).toBe(2);
  });

  test('step 2 muestra 3 tipos de jugador', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 2 });
    expect(p.element.querySelectorAll('.ob-type-btn').length).toBe(3);
  });

  test('step 2 boton Siguiente deshabilitado sin gameType', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 2 });
    expect(p.element.querySelector('.ob-next2-btn').hasAttribute('disabled')).toBe(true);
  });

  test('click tipo de jugador lo selecciona', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 2 });
    p.element.querySelector('[data-gt="cooperativo"]').click();
    expect(p._state.gameType).toBe('cooperativo');
  });

  test('gameType seleccionado habilita Siguiente step 2', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._state.gameType = 'competitivo';
    p._setState({ step: 2 });
    expect(p.element.querySelector('.ob-next2-btn').hasAttribute('disabled')).toBe(false);
  });

  test('click Atras en step 2 vuelve a step 1', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 2 });
    p.element.querySelector('.ob-back2-btn').click();
    expect(p._state.step).toBe(1);
  });

  test('click Siguiente en step 2 avanza a step 3', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._state.gameType = 'solitario';
    p._setState({ step: 2 });
    p.element.querySelector('.ob-next2-btn').click();
    expect(p._state.step).toBe(3);
  });

  test('step 3 muestra nombre del jugador', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._state.nickname = 'Carlos';
    p._setState({ step: 3 });
    expect(p.element.textContent).toContain('Carlos');
  });

  test('step 3 muestra jugador por defecto sin nickname', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 3 });
    expect(p.element.textContent).toContain('jugador');
  });

  test('step 3 boton Ir a la biblioteca habilitado', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._setState({ step: 3 });
    expect(p.element.querySelector('.ob-finish-btn').hasAttribute('disabled')).toBe(false);
    expect(p.element.querySelector('.ob-finish-btn').textContent).toContain('biblioteca');
  });

  test('saving=true en step 3 muestra Guardando y disabled', () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    p._state.saving = true;
    p._setState({ step: 3 });
    const btn = p.element.querySelector('.ob-finish-btn');
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.textContent).toBe('Guardando...');
  });

  test('handleFinish llama saveProfileFn y onComplete', async () => {
    const saveProfile = vi.fn(async () => null);
    const onComplete = vi.fn();
    const p = createOnboardingPanel({ saveProfile, onComplete, getToken: async () => 'tok' });
    p._state.nickname = 'Ana';
    p._state.gameType = 'competitivo';
    await p._handleFinish();
    expect(saveProfile).toHaveBeenCalledWith({ nickname: 'Ana', preferredGameType: 'competitivo' }, 'tok');
    expect(onComplete).toHaveBeenCalled();
  });

  test('handleFinish re-entering (saving=true) no llama fn', async () => {
    const saveProfile = vi.fn();
    const p = createOnboardingPanel({ saveProfile, getToken: async () => 't' });
    p._state.saving = true;
    await p._handleFinish();
    expect(saveProfile).not.toHaveBeenCalled();
  });

  test('handleFinish error no interrumpe — llama onComplete igual', async () => {
    const saveProfile = vi.fn(async () => { throw new Error('ERR'); });
    const onComplete = vi.fn();
    const p = createOnboardingPanel({ saveProfile, onComplete, getToken: async () => 't' });
    await p._handleFinish();
    expect(onComplete).toHaveBeenCalled();
  });

  test('click boton finish dispara handleFinish', async () => {
    const saveProfile = vi.fn(async () => null);
    const p = createOnboardingPanel({ saveProfile, getToken: async () => 't' });
    p._setState({ step: 3 });
    p.element.querySelector('.ob-finish-btn').click();
    await new Promise(r => setTimeout(r, 20));
    expect(saveProfile).toHaveBeenCalled();
  });

  test('opts null usa defaults', async () => {
    const p = createOnboardingPanel(null);
    await p._handleFinish();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('default saveProfile no rompe al llamar', async () => {
    const p = createOnboardingPanel({ getToken: async () => 't' });
    await expect(p._handleFinish()).resolves.not.toThrow();
  });

  test('default getToken no rompe en handleFinish', async () => {
    const p = createOnboardingPanel({ saveProfile: async () => null });
    await expect(p._handleFinish()).resolves.not.toThrow();
  });

  test('default onComplete no rompe al llamar', async () => {
    const p = createOnboardingPanel({ saveProfile: async () => null, getToken: async () => 't' });
    await expect(p._handleFinish()).resolves.not.toThrow();
  });
});
