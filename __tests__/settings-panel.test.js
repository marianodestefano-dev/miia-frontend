import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createSettingsPanel = require('../assets/ludomiia-panels/settings-panel.js');

const SETTINGS = {
  gameNotifications: true,
  friendInvites: false,
  showInLeaderboard: true,
  language: 'es',
};

describe('settings-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createSettingsPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando configuracion', () => {
    const p = createSettingsPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando');
  });

  test('loading deshabilita saveBtn', () => {
    const p = createSettingsPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.btn-primary').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra 3 toggles y 1 select', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.setting-row').length).toBe(4);
  });

  test('toggle ON tiene clase toggle-on', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.toggle-on').length).toBe(2);
  });

  test('toggle OFF tiene clase toggle-off', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.toggle-off').length).toBe(1);
  });

  test('select muestra idiomas disponibles', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    const opts = p.element.querySelectorAll('.setting-select option');
    expect(opts.length).toBe(3);
  });

  test('handleChange actualiza settings en estado', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    p._handleChange('friendInvites', true);
    expect(p._state.settings.friendInvites).toBe(true);
  });

  test('click toggle cambia valor', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    const toggleOff = p.element.querySelector('.toggle-off');
    toggleOff.click();
    expect(p._state.settings.friendInvites).toBe(true);
  });

  test('select onChange actualiza language', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    const select = p.element.querySelector('.setting-select');
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    expect(p._state.settings.language).toBe('en');
  });

  test('handleSave llama saveSettingsFn', async () => {
    const saveSettings = vi.fn(async () => null);
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, saveSettings, getToken: async () => 'tok' });
    await p.refresh();
    await p._handleSave();
    expect(saveSettings).toHaveBeenCalledWith(p._state.settings, 'tok');
  });

  test('handleSave exitoso muestra mensaje Guardado', async () => {
    const saveSettings = vi.fn(async () => null);
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, saveSettings, getToken: async () => 't' });
    await p.refresh();
    await p._handleSave();
    expect(p._state.saveMsg).toContain('Guardado');
  });

  test('handleSave re-entering (saving=true) no llama fn', async () => {
    const saveSettings = vi.fn();
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, saveSettings, getToken: async () => 't' });
    await p.refresh();
    p._setState({ saving: true });
    await p._handleSave();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  test('handleSave error establece saveMsg con error', async () => {
    const saveSettings = vi.fn(async () => { throw new Error('SAVE_ERR'); });
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, saveSettings, getToken: async () => 't' });
    await p.refresh();
    await p._handleSave();
    expect(p._state.saveMsg).toBe('SAVE_ERR');
    expect(p._state.saving).toBe(false);
  });

  test('click Guardar botón dispara handleSave', async () => {
    const saveSettings = vi.fn(async () => null);
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, saveSettings, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.btn-primary').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(saveSettings).toHaveBeenCalled();
  });

  test('saving=true deshabilita btn y muestra Guardando', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ saving: true });
    expect(p.element.querySelector('.btn-primary').hasAttribute('disabled')).toBe(true);
    expect(p.element.querySelector('.btn-primary').textContent).toBe('Guardando...');
  });

  test('saveMsg se muestra en msgEl', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ saveMsg: 'Listo!' });
    expect(p.element.textContent).toContain('Listo!');
  });

  test('saveMsg null muestra string vacio', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ saveMsg: null });
    // just verify no crash
    expect(p._state.saveMsg).toBeNull();
  });

  test('refresh error muestra mensaje', async () => {
    const p = createSettingsPanel({
      fetchSettings: async () => { throw new Error('CFG_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('CFG_ERR');
    expect(p.element.textContent).toContain('CFG_ERR');
  });

  test('fetchSettings null retorna {} sin crash', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.settings).toEqual({});
  });

  test('language vacia default es', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => ({ gameNotifications: false }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Español');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createSettingsPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createSettingsPanel({ fetchSettings: async () => SETTINGS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando');
  });
});
