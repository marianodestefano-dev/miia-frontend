import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createAudioNarrator = require('../assets/ludomiia-panels/audio-narrator.js');

describe('audio-narrator.js', () => {
  let playStub;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
    playStub = vi.spyOn(HTMLAudioElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLAudioElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sin audioUrl muestra fallback', () => {
    const an = createAudioNarrator({ fallbackText: 'Sin audio' });
    expect(an.element.classList.contains('audio-narrator--fallback')).toBe(true);
  });

  test('sin audioUrl con fallbackText muestra texto', () => {
    const an = createAudioNarrator({ fallbackText: 'El rey avanza' });
    expect(an.element.querySelector('.audio-fallback-text').textContent).toBe('El rey avanza');
  });

  test('sin audioUrl ni fallbackText muestra Audio no disponible', () => {
    const an = createAudioNarrator({});
    expect(an.element.querySelector('.audio-fallback-empty').textContent).toBe('Audio no disponible');
  });

  test('con audioUrl muestra audio-narrator', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    expect(an.element.classList.contains('audio-narrator')).toBe(true);
    expect(an.element.classList.contains('audio-narrator--fallback')).toBe(false);
  });

  test('con audioUrl muestra boton play', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    expect(an.element.querySelector('.audio-btn-play')).not.toBeNull();
  });

  test('con audioUrl muestra boton replay', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    expect(an.element.querySelector('.audio-btn-replay')).not.toBeNull();
  });

  test('con audioUrl muestra 3 botones de velocidad', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    expect(an.element.querySelectorAll('.speed-btn').length).toBe(3);
  });

  test('velocidad 1x activa por defecto', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    const active = an.element.querySelector('.speed-btn.active');
    expect(active.textContent).toBe('1x');
  });

  test('click speed-btn 1.25x cambia velocidad activa', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    const btns = an.element.querySelectorAll('.speed-btn');
    btns[2].click(); // 1.25x
    expect(an._state.speed).toBe(1.25);
    expect(an.element.querySelector('.speed-btn.active').textContent).toBe('1.25x');
  });

  test('click speed-btn 0.75x cambia velocidad', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    const btns = an.element.querySelectorAll('.speed-btn');
    btns[0].click(); // 0.75x
    expect(an._state.speed).toBe(0.75);
  });

  test('click play cambia estado a playing=true', async () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-play').click();
    await new Promise(r => setTimeout(r, 10));
    expect(an._state.playing).toBe(true);
  });

  test('click play cuando playing=true pausa', async () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an._state.playing = true;
    an.element.querySelector('.audio-btn-play').click();
    expect(an._state.playing).toBe(false);
  });

  test('play cambia texto del boton a pausa', async () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-play').click();
    await new Promise(r => setTimeout(r, 10));
    expect(an.element.querySelector('.audio-btn-play').textContent).toBe('⏸');
  });

  test('click replay llama play', async () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-replay').click();
    await new Promise(r => setTimeout(r, 10));
    expect(playStub).toHaveBeenCalled();
  });

  test('evento ended pone playing=false', async () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    const audioEl = an.element.querySelector('audio');
    an._state.playing = true;
    audioEl.dispatchEvent(new Event('ended'));
    expect(an._state.playing).toBe(false);
  });

  test('update con nuevo audioUrl re-renderiza', () => {
    const an = createAudioNarrator({ fallbackText: 'texto' });
    an.update({ audioUrl: 'blob:new' });
    expect(an.element.classList.contains('audio-narrator--fallback')).toBe(false);
  });

  test('update sin audioUrl vuelve a fallback', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.update({ audioUrl: null, fallbackText: 'sin audio' });
    expect(an.element.classList.contains('audio-narrator--fallback')).toBe(true);
  });

  test('update preserva estado de audio si no se cambia audioUrl', () => {
    const an = createAudioNarrator({ audioUrl: 'blob:test', fallbackText: null });
    an.update({ fallbackText: 'nuevo texto' });
    expect(an._state.audioUrl).toBe('blob:test');
  });

  test('opts null usa defaults — fallback vacio', () => {
    const an = createAudioNarrator(null);
    expect(an.element.querySelector('.audio-fallback-empty')).not.toBeNull();
  });

  test('play con Promise.reject pone playing=false', async () => {
    playStub.mockRejectedValue(new Error('autoplay blocked'));
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-play').click();
    await new Promise(r => setTimeout(r, 20));
    expect(an._state.playing).toBe(false);
  });

  test('replay con Promise.reject pone playing=false', async () => {
    playStub.mockRejectedValue(new Error('blocked'));
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-replay').click();
    await new Promise(r => setTimeout(r, 20));
    expect(an._state.playing).toBe(false);
  });

  test('play sincrono (play retorna undefined) pone playing=true', () => {
    playStub.mockReturnValue(undefined);
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-play').click();
    expect(an._state.playing).toBe(true);
  });

  test('replay sincrono (play retorna undefined) pone playing=true', () => {
    playStub.mockReturnValue(undefined);
    const an = createAudioNarrator({ audioUrl: 'blob:test' });
    an.element.querySelector('.audio-btn-replay').click();
    expect(an._state.playing).toBe(true);
  });
});
