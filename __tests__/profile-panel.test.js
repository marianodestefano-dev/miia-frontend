import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createProfilePanel = require('../assets/ludomiia-panels/profile-panel.js');

const PROFILE = {
  displayName: 'Maria Gomez',
  email: 'maria@example.com',
  totalGames: 42,
  wins: 28,
  losses: 14,
  winRate: 67,
  currentStreak: 3,
};

describe('profile-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createProfilePanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando', () => {
    const p = createProfilePanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.profile-name').textContent).toBe('Cargando...');
  });

  test('loading deshabilita editBtn', () => {
    const p = createProfilePanel({ getToken: async () => 't' });
    expect(p.element.querySelector('.btn-ghost.btn-sm').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra nombre en profile-name', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.profile-name').textContent).toBe('Maria Gomez');
  });

  test('avatar muestra iniciales', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.profile-avatar').textContent).toBe('MG');
  });

  test('email se muestra', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('maria@example.com');
  });

  test('stats se muestran', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('42');
    expect(p.element.textContent).toContain('28');
    expect(p.element.textContent).toContain('67%');
  });

  test('stat null muestra guion', async () => {
    const profile = { ...PROFILE, winRate: null };
    const p = createProfilePanel({ fetchProfile: async () => profile, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('-');
  });

  test('profile sin displayName usa name', async () => {
    const profile = { name: 'Carlos', email: 'c@c.com' };
    const p = createProfilePanel({ fetchProfile: async () => profile, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.profile-name').textContent).toBe('Carlos');
  });

  test('profile sin nombre muestra Sin nombre', async () => {
    const p = createProfilePanel({ fetchProfile: async () => ({}), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.profile-name').textContent).toBe('Sin nombre');
  });

  test('profile sin email muestra string vacio', async () => {
    const p = createProfilePanel({ fetchProfile: async () => ({ displayName: 'X' }), getToken: async () => 't' });
    await p.refresh();
    expect(p._state.profile.email).toBeUndefined();
  });

  test('refresh error muestra Error en nameEl', async () => {
    const p = createProfilePanel({
      fetchProfile: async () => { throw new Error('PROF_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('PROF_ERR');
    expect(p.element.querySelector('.profile-name').textContent).toBe('Error');
  });

  test('handleEditToggle abre editForm', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    expect(p.element.querySelector('.edit-form').style.display).toBe('block');
  });

  test('handleEditToggle cierra editForm si ya abierto', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p._handleEditToggle();
    expect(p.element.querySelector('.edit-form').style.display).toBe('none');
  });

  test('handleEditToggle limpia input al cerrar', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'test';
    p._handleEditToggle();
    expect(p.element.querySelector('input').value).toBe('');
  });

  test('click editBtn dispara handleEditToggle', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.btn-ghost.btn-sm').click();
    expect(p._state.editing).toBe(true);
  });

  test('handleSave vacio no llama updateProfile', async () => {
    const updateProfile = vi.fn();
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = '';
    await p._handleSave();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test('handleSave saving=true re-entering no llama fn', async () => {
    const updateProfile = vi.fn();
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p._setState({ saving: true });
    p.element.querySelector('input').value = 'Nuevo';
    await p._handleSave();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test('handleSave llama updateProfile con displayName', async () => {
    const updateProfile = vi.fn(async () => PROFILE);
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 'tok' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'Nuevo Nombre';
    await p._handleSave();
    expect(updateProfile).toHaveBeenCalledWith({ displayName: 'Nuevo Nombre' }, 'tok');
  });

  test('handleSave actualiza profile y cierra edicion', async () => {
    const updated = { ...PROFILE, displayName: 'Nuevo' };
    const updateProfile = vi.fn(async () => updated);
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'Nuevo';
    await p._handleSave();
    expect(p._state.editing).toBe(false);
    expect(p._state.profile.displayName).toBe('Nuevo');
  });

  test('handleSave respuesta null no rompe', async () => {
    const updateProfile = vi.fn(async () => null);
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'Nombre';
    await p._handleSave();
    expect(p._state.saveError).toBeNull();
  });

  test('handleSave error establece saveError', async () => {
    const updateProfile = vi.fn(async () => { throw new Error('SAVE_ERR'); });
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'Nombre';
    await p._handleSave();
    expect(p._state.saveError).toBe('SAVE_ERR');
    expect(p._state.saving).toBe(false);
  });

  test('click Guardar boton dispara handleSave', async () => {
    const updateProfile = vi.fn(async () => PROFILE);
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, updateProfile, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p.element.querySelector('input').value = 'Nuevo';
    p.element.querySelector('.btn-primary.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(updateProfile).toHaveBeenCalled();
  });

  test('saveError se muestra en formulario', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    p._setState({ saveError: 'Error guardado' });
    expect(p.element.textContent).toContain('Error guardado');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createProfilePanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true vuelve a Cargando', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.querySelector('.profile-name').textContent).toBe('Cargando...');
  });

  test('initials de nombre con espacio retorna 2 letras', async () => {
    const p = createProfilePanel({ fetchProfile: async () => ({ displayName: 'Jose Maria' }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.profile-avatar').textContent).toBe('JM');
  });

  test('editing + editInput vacio no pre-llena (ya tiene valor)', async () => {
    const p = createProfilePanel({ fetchProfile: async () => PROFILE, getToken: async () => 't' });
    await p.refresh();
    p._handleEditToggle();
    // input is now pre-filled with profile name; simulate user already typed something
    p.element.querySelector('input').value = 'ya tiene';
    // toggle again closes
    p._handleEditToggle();
    expect(p._state.editing).toBe(false);
  });
});
