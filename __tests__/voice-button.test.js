import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createVoiceButton = require('../assets/ludomiia-panels/voice-button.js');

function makeMockSR() {
  return function MockSR() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.start = vi.fn();
    this.stop = vi.fn();
  };
}

describe('voice-button.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  test('sin SpeechRecognition muestra boton disabled', () => {
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb.element.disabled).toBe(true);
    expect(vb.element.classList.contains('voice-btn--unsupported')).toBe(true);
  });

  test('sin SpeechRecognition state.supported=false', () => {
    const vb = createVoiceButton({});
    expect(vb._state.supported).toBe(false);
  });

  test('con SpeechRecognition state.supported=true', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb._state.supported).toBe(true);
  });

  test('con SpeechRecognition estado inicial idle', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb._state.status).toBe('idle');
  });

  test('click en idle pasa a listening y llama rec.start', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click();
    expect(vb._state.status).toBe('listening');
    expect(vb._rec.start).toHaveBeenCalled();
  });

  test('click en listening pasa a processing y llama rec.stop', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // idle → listening
    vb.element.click(); // listening → processing
    expect(vb._state.status).toBe('processing');
    expect(vb._rec.stop).toHaveBeenCalled();
  });

  test('click en processing vuelve a listening', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // idle → listening
    vb.element.click(); // listening → processing
    vb.element.click(); // processing → listening
    expect(vb._state.status).toBe('listening');
  });

  test('onresult llama onTranscript con texto', () => {
    window.SpeechRecognition = makeMockSR();
    const onTranscript = vi.fn();
    const vb = createVoiceButton({ onTranscript });
    vb._rec.onresult({ results: [[{ transcript: 'muevo el alfil' }]] });
    expect(onTranscript).toHaveBeenCalledWith('muevo el alfil');
    expect(vb._state.status).toBe('idle');
  });

  test('onerror pone status en idle', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // → listening
    vb._rec.onerror();
    expect(vb._state.status).toBe('idle');
  });

  test('onend desde listening pone status en idle', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // → listening
    vb._rec.onend();
    expect(vb._state.status).toBe('idle');
  });

  test('onend desde processing no cambia a idle', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // → listening
    vb.element.click(); // → processing
    vb._rec.onend();
    expect(vb._state.status).toBe('processing');
  });

  test('boton tiene clase voice-btn', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb.element.className).toContain('voice-btn');
  });

  test('titulo en listening es Detener grabacion', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    vb.element.click(); // → listening
    expect(vb.element.title).toContain('Detener');
  });

  test('titulo en idle es Hablar', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb.element.title).toBe('Hablar');
  });

  test('usa webkitSpeechRecognition como fallback', () => {
    window.webkitSpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {} });
    expect(vb._state.supported).toBe(true);
  });

  test('opts null usa defaults — boton disabled sin SR', () => {
    const vb = createVoiceButton(null);
    expect(vb.element.disabled).toBe(true);
  });

  test('default onTranscript no rompe', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ lang: 'es-ES' });
    expect(() => vb._rec.onresult({ results: [[{ transcript: 'x' }]] })).not.toThrow();
  });

  test('lang personalizado se aplica al rec', () => {
    window.SpeechRecognition = makeMockSR();
    const vb = createVoiceButton({ onTranscript: () => {}, lang: 'pt-BR' });
    expect(vb._rec.lang).toBe('pt-BR');
  });
});
