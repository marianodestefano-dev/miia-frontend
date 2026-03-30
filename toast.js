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
        background: #0D1628;
        border: 1px solid rgba(91,141,248,0.2);
        color: #E8EDF8;
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
})();
