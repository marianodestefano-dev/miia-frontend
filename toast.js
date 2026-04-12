/**
 * MIIA Toast Notification System
 * Reemplaza alert() con toasts no bloqueantes en la esquina inferior derecha.
 *
 * Uso:
 *   showToast('Guardado correctamente', 'success')
 *   showToast('Error al conectar', 'error')
 *   showToast('Procesando...', 'warning')
 *   showToast('Información', 'info')
 */

(function () {
  // Inyectar estilos una sola vez
  if (!document.getElementById('miia-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'miia-toast-styles';
    style.textContent = `
      #miia-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .miia-toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 13px 18px;
        border-radius: 12px;
        background: var(--glass-bg, #0D1628);
        border: 1px solid var(--bd-indigo, rgba(91,141,248,0.2));
        color: var(--tx-bright, #E8EDF8);
        font-family: Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        line-height: 1.4;
        max-width: 360px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        opacity: 0;
        transform: translateX(24px);
        transition: opacity 0.28s ease, transform 0.28s ease;
        pointer-events: auto;
      }
      .miia-toast.show {
        opacity: 1;
        transform: translateX(0);
      }
      .miia-toast-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
      .miia-toast-msg  { flex: 1; }
      .miia-toast.success { border-color: rgba(34,197,94,0.5); }
      .miia-toast.error   { border-color: rgba(239,68,68,0.5); }
      .miia-toast.warning { border-color: rgba(245,158,11,0.5); }
      .miia-toast.info    { border-color: rgba(91,141,248,0.4); }
    `;
    document.head.appendChild(style);
  }

  function getContainer() {
    let c = document.getElementById('miia-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'miia-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  window.showToast = function (msg, type = 'info', duration = 3800) {
    const container = getContainer();
    const toast = document.createElement('div');
    toast.className = `miia-toast ${type}`;
    toast.innerHTML = `<span class="miia-toast-icon">${ICONS[type] || ICONS.info}</span><span class="miia-toast-msg">${msg}</span>`;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  };
  /**
   * miiaConfirm — drop-in replacement for native confirm()
   * Auto-detects destructive intent from message keywords.
   * Usage: if (!await miiaConfirm('¿Eliminar producto?')) return;
   */
  window.miiaConfirm = async function (msg) {
    const isDanger = /elimin|borr|desconect|desvincul|irrever|no se puede deshacer|ÚLTIMA/i.test(msg);
    return showConfirm('¿Estás seguro?', msg.replace(/^¿/, '').replace(/\?$/, ''), {
      confirmText: isDanger ? 'Sí, eliminar' : 'Confirmar',
      cancelText: 'Cancelar',
      danger: isDanger
    });
  };

  /**
   * showConfirm — modal de confirmación estilo dashboard (reemplaza confirm() nativo)
   * @param {string} title - Título del diálogo
   * @param {string} message - Mensaje descriptivo
   * @param {Object} [opts] - { confirmText, cancelText, danger }
   * @returns {Promise<boolean>} true si confirma, false si cancela
   */
  window.showConfirm = function (title, message, opts = {}) {
    const { confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = opts;
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" data-action="cancel">${cancelText}</button>
            <button class="confirm-ok ${danger ? 'danger' : ''}" data-action="ok">${confirmText}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'ok') { overlay.remove(); resolve(true); }
        else if (action === 'cancel') { overlay.remove(); resolve(false); }
      });
      // ESC to cancel
      const esc = (e) => { if (e.key === 'Escape') { overlay.remove(); resolve(false); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
    });
  };
  /**
   * showPrompt — custom input modal (replaces native prompt())
   * @param {string} title
   * @param {string} message
   * @param {Object} [opts] - { placeholder, defaultValue, inputType }
   * @returns {Promise<string|null>} input value or null if cancelled
   */
  window.showPrompt = function (title, message, opts = {}) {
    const { placeholder = '', defaultValue = '', inputType = 'text' } = opts;
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <h3>${title}</h3>
          <p>${message}</p>
          <input type="${inputType}" value="${defaultValue}" placeholder="${placeholder}"
            style="width:100%;padding:10px 14px;border:1px solid var(--bd-2);border-radius:var(--r-md);background:var(--surface);color:var(--tx-bright);font-size:.9rem;font-family:inherit;margin-bottom:16px;outline:none;" />
          <div class="confirm-actions">
            <button class="confirm-cancel" data-action="cancel">Cancelar</button>
            <button class="confirm-ok" data-action="ok">Aceptar</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('input');
      input.focus();
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { overlay.remove(); resolve(input.value || null); } });
      overlay.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'ok') { overlay.remove(); resolve(input.value || null); }
        else if (action === 'cancel') { overlay.remove(); resolve(null); }
      });
      const esc = (e) => { if (e.key === 'Escape') { overlay.remove(); resolve(null); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
    });
  };
})();
