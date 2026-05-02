/* c8 ignore start */
/**
 * game-card.js - TEC-LUDOMIIA-MIGRAR-23.
 *
 * Componente reutilizable que reemplaza
 * apps/web-ludomiia/components/GameCard.tsx (Next.js, deprecado).
 *
 * Tarjeta de juego con avatar de inicial, meta, expand on hover y CTA.
 *
 * Uso:
 *   const card = createGameCard({
 *     id: 'g1', name: 'Ajedrez', description: 'El clasico...',
 *     category: 'Estrategia', minPlayers: 2, maxPlayers: 2,
 *     multiplayer: false,
 *     onView: (id) => {},
 *   });
 *   container.appendChild(card.element);
 */

'use strict';

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createGameCard = factory();
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
/* c8 ignore stop */

  function createGameCard(opts) {
    opts = opts || {};
    var id          = opts.id          || '';
    var name        = opts.name        || '';
    var description = opts.description || '';
    var category    = opts.category;
    var minPlayers  = opts.minPlayers;
    var maxPlayers  = opts.maxPlayers;
    var multiplayer = opts.multiplayer  || false;
    var onView      = opts.onView       || function () {};

    var article = document.createElement('article');
    article.className = 'game-card-root';

    // Avatar
    var avatarEl = document.createElement('div');
    avatarEl.className = 'game-card-image-placeholder';
    var initialEl = document.createElement('span');
    initialEl.className = 'game-card-initial';
    initialEl.textContent = name.charAt(0);
    avatarEl.appendChild(initialEl);
    article.appendChild(avatarEl);

    // Body
    var bodyEl = document.createElement('div');
    bodyEl.className = 'game-card-body';

    var nameEl = document.createElement('h3');
    nameEl.className = 'game-card-name';
    nameEl.textContent = name;
    bodyEl.appendChild(nameEl);

    var metaEl = document.createElement('div');
    metaEl.className = 'game-card-meta';
    if (minPlayers != null && maxPlayers != null) {
      var playersEl = document.createElement('span');
      playersEl.className = 'game-card-players';
      playersEl.textContent = minPlayers + '–' + maxPlayers + ' jugadores';
      metaEl.appendChild(playersEl);
    }
    if (category) {
      var catEl = document.createElement('span');
      catEl.className = 'game-card-category';
      catEl.textContent = category;
      metaEl.appendChild(catEl);
    }
    if (multiplayer) {
      var badgeEl = document.createElement('span');
      badgeEl.className = 'game-card-badge badge-online';
      badgeEl.textContent = 'Online';
      metaEl.appendChild(badgeEl);
    }
    bodyEl.appendChild(metaEl);

    var descExpandedEl = document.createElement('p');
    descExpandedEl.className = 'game-card-desc-expanded';
    descExpandedEl.style.display = 'none';
    descExpandedEl.textContent = description;
    bodyEl.appendChild(descExpandedEl);

    article.appendChild(bodyEl);

    // CTA
    var ctaBtn = document.createElement('button');
    ctaBtn.className = 'game-card-cta';
    ctaBtn.textContent = 'Ver juego';
    ctaBtn.setAttribute('aria-label', 'Ver detalle de ' + name);
    ctaBtn.addEventListener('click', function () { onView(id); });
    article.appendChild(ctaBtn);

    // Hover expand
    article.addEventListener('mouseenter', function () {
      descExpandedEl.style.display = '';
    });
    article.addEventListener('mouseleave', function () {
      descExpandedEl.style.display = 'none';
    });

    return {
      element: article,
    };
  }

  return createGameCard;
/* c8 ignore start */
}));
/* c8 ignore stop */
