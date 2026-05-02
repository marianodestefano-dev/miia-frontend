import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createFriendsPanel = require('../assets/ludomiia-panels/friends-panel.js');

const FRIENDS = [
  { uid: 'f1', displayName: 'Maria', online: true },
  { uid: 'f2', displayName: 'Carlos', online: false },
  { uid: 'f3', displayName: 'Ana', online: true },
];

describe('friends-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createFriendsPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra Cargando amigos', () => {
    const p = createFriendsPanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('Cargando amigos');
  });

  test('refresh muestra friend-rows', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.friend-row').length).toBe(3);
  });

  test('count online se muestra', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('2 en línea');
  });

  test('count cero online no muestra contador', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => [{ uid: 'f1', displayName: 'X', online: false }], getToken: async () => 't' });
    await p.refresh();
    const count = p.element.querySelector('span[style*="4ade80"]');
    expect(count.textContent).toBe('');
  });

  test('amigo online tiene punto verde .online-dot', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.online-dot').length).toBe(2);
  });

  test('amigo offline tiene punto gris .offline-dot', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.offline-dot').length).toBe(1);
  });

  test('amigo online muestra boton Invitar', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.invite-btn').length).toBe(2);
  });

  test('amigo offline no tiene boton Invitar', async () => {
    const offlineOnly = [{ uid: 'f2', displayName: 'Carlos', online: false }];
    const p = createFriendsPanel({ fetchFriends: async () => offlineOnly, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.invite-btn').length).toBe(0);
  });

  test('handleInvite llama inviteFriendFn', async () => {
    const inviteFriend = vi.fn(async () => null);
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 'tok' });
    await p.refresh();
    await p._handleInvite('f1');
    expect(inviteFriend).toHaveBeenCalledWith('f1', 'tok');
  });

  test('handleInvite limpia invitingId tras exito', async () => {
    const inviteFriend = vi.fn(async () => null);
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 't' });
    await p.refresh();
    await p._handleInvite('f1');
    expect(p._state.invitingId).toBeNull();
  });

  test('handleInvite re-entering (invitingId set) no llama fn', async () => {
    const inviteFriend = vi.fn();
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 't' });
    await p.refresh();
    p._setState({ invitingId: 'f1' });
    await p._handleInvite('f2');
    expect(inviteFriend).not.toHaveBeenCalled();
  });

  test('handleInvite error establece inviteError', async () => {
    const inviteFriend = vi.fn(async () => { throw new Error('INV_ERR'); });
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 't' });
    await p.refresh();
    await p._handleInvite('f1');
    expect(p._state.inviteError).toBe('INV_ERR');
    expect(p._state.invitingId).toBeNull();
  });

  test('inviteError se muestra en panel', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ inviteError: 'Error inv' });
    expect(p.element.textContent).toContain('Error inv');
  });

  test('inviteError null — state es null despues de refresh', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ inviteError: null });
    expect(p._state.inviteError).toBeNull();
    // texto de error no aparece en pantalla
    expect(p.element.textContent).not.toContain('Error inv');
  });

  test('click invite-btn dispara handleInvite', async () => {
    const inviteFriend = vi.fn(async () => null);
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.invite-btn').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(inviteFriend).toHaveBeenCalled();
  });

  test('amigo invitando muestra Invitando... y disabled', async () => {
    const inviteFriend = vi.fn(() => new Promise(() => {}));
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, inviteFriend, getToken: async () => 't' });
    await p.refresh();
    p._setState({ invitingId: 'f1' });
    const firstInviteBtn = p.element.querySelector('.invite-btn');
    expect(firstInviteBtn.textContent).toBe('Invitando...');
    expect(firstInviteBtn.hasAttribute('disabled')).toBe(true);
  });

  test('amigo sin displayName usa uid', async () => {
    const f = [{ uid: 'abc', online: true }];
    const p = createFriendsPanel({ fetchFriends: async () => f, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('abc');
  });

  test('amigo sin uid ni displayName muestra Amigo', async () => {
    const f = [{ online: false }];
    const p = createFriendsPanel({ fetchFriends: async () => f, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Amigo');
  });

  test('lista vacia muestra empty state', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => [], getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('No tienes amigos');
  });

  test('fetchFriends null retorna [] sin crash', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p._state.friends).toEqual([]);
  });

  test('refresh error muestra mensaje', async () => {
    const p = createFriendsPanel({
      fetchFriends: async () => { throw new Error('FR_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('FR_ERR');
    expect(p.element.textContent).toContain('FR_ERR');
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createFriendsPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true muestra Cargando', async () => {
    const p = createFriendsPanel({ fetchFriends: async () => FRIENDS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('Cargando amigos');
  });
});
