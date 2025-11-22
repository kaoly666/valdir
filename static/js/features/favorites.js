// FAVORITES FEATURE REMOVED
// This file previously implemented the favorites frontend. The feature has been
// removed and all references were cleared from the user-facing UI. This file
// is intentionally left empty to avoid runtime errors if still referenced.
// (no-op)

    async init() {
        console.log('FavoritesManager initializing...');
        // ensure visibility so clicking is easier
        document.documentElement.classList.add('favorites-js-ready');
        await this.loadFavorites();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        console.log('FavoritesManager binding events');
        // Botões de favorito nos produtos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn')) {
                e.preventDefault();
                const btn = e.target.classList.contains('favorite-btn') ? e.target : e.target.closest('.favorite-btn');
                const productId = btn.dataset.productId;
                console.log('favorite btn clicked for productId=', productId);
                if (productId) {
                    this.toggleFavorite(productId, btn);
                }
            }
        });

        // Remover favorito da lista
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-favorite')) {
                e.preventDefault();
                const favoriteId = e.target.dataset.favoriteId;
                console.log('remove favorite clicked id=', favoriteId);
                if (favoriteId) {
                    this.removeFavorite(favoriteId);
                }
            }
        });

        // Note: 'Mostrar IDs Favoritos' UI was removed — no toggle handler is needed
    }

    async loadFavorites() {
        try {
            const response = await fetch('/api/favoritos/produtos?' + new Date().getTime(), { credentials: 'same-origin' });
            if (response.ok) {
                const favorites = await response.json();
                this.favorites = new Set(favorites.map(f => f.id));
                console.log('Favorites loaded:', Array.from(this.favorites));
            } else {
                console.error('loadFavorites failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
        }
    }

    async toggleFavorite(productId, btn = null) {
        const numericId = parseInt(productId, 10);
        const isFavorite = this.favorites.has(numericId);

        // Optimistic UI change — update immediately
        if (btn) {
            try {
                this.updateFavoriteButton(btn, !isFavorite);
            } catch (e) {
                // non-fatal
            }
        }

        try {
            const response = await fetch(`/api/favoritos/produto/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                // Attempt to parse error JSON if provided
                let err = null;
                try { err = await response.json(); } catch (e) { err = { error: 'Erro desconhecido' }; }
                if (err && err.login_required) {
                    this.showNotification('Você precisa estar logado para usar os favoritos', 'error');
                    setTimeout(() => window.location.href = '/login', 1500);
                    return;
                }
                // revert optimistic change
                if (btn) this.updateFavoriteButton(btn, isFavorite);
                throw new Error(err.error || 'Erro no servidor');
            }

            const result = await response.json();

            if (result && result.success) {
                if (result.action === 'added') {
                    this.showNotification('Produto adicionado aos favoritos!', 'success');
                    // Append immediately when the server returns the favorito object
                    // We will re-render the entire favorites list after syncing to server,
                    // so no need to append the card here (avoids duplicates).
                } else {
                    this.showNotification('Produto removido dos favoritos!', 'info');
                }
                // Ensure client state matches server (reload favorites) so the favorites
                // page and other UI areas reflect the latest persisted data.
                // re-sync server state
                await this.loadFavorites();
                this.updateUI();
                const isNowFavorite = this.favorites.has(numericId);
                if (btn) this.updateFavoriteButton(btn, isNowFavorite);
                const favoritesList = document.getElementById('favorites-list');
                if (favoritesList) {
                    // Immediately refresh favorites-area so it contains newly favorited product
                    await this.renderFavoritesList();
                }
            } else {
                if (result.login_required) {
                    this.showNotification('Você precisa estar logado para usar os favoritos', 'error');
                    // Redirecionar para login após um pequeno delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    this.showNotification(result.error || 'Erro ao atualizar favorito', 'error');
                    // revert optimistic change if we applied it
                    if (btn) this.updateFavoriteButton(btn, isFavorite);
                }
            }
        } catch (error) {
            console.error('Erro ao toggle favorito:', error);
            this.showNotification('Erro ao atualizar favorito', 'error');
            // revert optimistic change if we applied it
            if (btn) this.updateFavoriteButton(btn, isFavorite);
        }
    }

    async removeFavorite(favoriteId) {
        try {
            const response = await fetch(`/api/favoritos/${favoriteId}`, {
                method: 'DELETE'
                , credentials: 'same-origin'
            });

            if (response.ok) {
                // Recarregar favoritos
                await this.loadFavorites();
                this.updateUI();
                this.showNotification('Favorito removido!', 'success');
            } else {
                this.showNotification('Erro ao remover favorito', 'error');
            }
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            this.showNotification('Erro ao remover favorito', 'error');
        }
    }

    updateFavoriteButton(btn, isFavorite) {
        if (!btn) return;

        const icon = btn.querySelector('i') || btn;
        const text = btn.querySelector('.favorite-text');

        if (isFavorite) {
            btn.classList.add('active');
            if (icon) icon.className = 'fas fa-heart';
            if (text) text.textContent = 'Favoritado';
        } else {
            btn.classList.remove('active');
            if (icon) icon.className = 'far fa-heart';
            if (text) text.textContent = 'Favoritar';
        }
    }

    updateUI() {
        // Atualizar contadores
        const counters = document.querySelectorAll('.favorites-count');
        counters.forEach(counter => {
            counter.textContent = this.favorites.size;
        });
        // Also update landing page / favorites page counter if present
        const favouritesIdEl = document.getElementById('favorites-count');
        if (favouritesIdEl) favouritesIdEl.textContent = this.favorites.size;

        // Atualizar botões de favorito
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const productId = btn.dataset.productId;
            if (productId) {
                const isFavorite = this.favorites.has(parseInt(productId));
                this.updateFavoriteButton(btn, isFavorite);
            }
        });

        // Atualizar lista de favoritos se estiver na página
        const favoritesList = document.getElementById('favorites-list');
        if (favoritesList) {
            this.renderFavoritesList();
        }
    }

    async renderFavoritesList() {
        console.log('renderFavoritesList called');
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) {
            console.error('FavoritesManager: favorites-list element not found');
            return;
        }

        try {
            const response = await fetch('/api/favoritos/produtos?' + new Date().getTime(), { credentials: 'same-origin' });
            console.log('renderFavoritesList response status:', response.status);
            if (response.ok) {
                const favorites = await response.json();
                console.log('renderFavoritesList favorites:', favorites);

                if (favorites.length === 0) {
                    favoritesList.innerHTML = `
                        <div class="empty-favorites">
                            <i class="far fa-heart"></i>
                            <h3>Seus favoritos estão vazios</h3>
                            <p>Adicione produtos aos seus favoritos para visualizá-los aqui.</p>
                            <a href="/produtos" class="btn btn-primary">Explorar Produtos</a>
                        </div>
                    `;
                } else {
                    favoritesList.innerHTML = favorites.map(produto => `
                        <article class="product-card favorite-card" data-product-id="${produto.id}">
                            <div class="product-image-container">
                                <div class="product-image">
                                    <img src="${produto.imagem || '/static/images/placeholder.jpeg'}"
                                         alt="${produto.nome}" loading="lazy">
                                </div>
                                <button class="favorite-btn active" data-product-id="${produto.id}" title="Remover dos favoritos">
                                    <i class="fas fa-heart"></i>
                                    <span class="favorite-text">Favoritado</span>
                                </button>
                            </div>
                            <div class="product-info">
                                <h3 class="product-title">${produto.nome}</h3>
                                <div class="product-meta">
                                    <div class="product-price">R$ ${produto.preco.toFixed(2)}</div>
                                </div>
                                ${produto.descricao ? `<p class="product-description">${produto.descricao.substring(0, 80)}${produto.descricao.length > 80 ? '...' : ''}</p>` : ''}
                            </div>
                            <div class="product-actions">
                                <button class="btn btn-primary" onclick="window.location.href='/produto/${produto.id}'">
                                    <i class="fas fa-eye"></i> Ver Detalhes
                                </button>
                                <button class="btn btn-secondary" onclick="addToCart(${produto.id})">
                                    <i class="fas fa-cart-plus"></i> Adicionar
                                </button>
                            </div>
                        </article>
                    `).join('');
                }
            } else {
                console.error('FavoritesManager: API error:', response.status);
                if (response.status === 401) {
                    favoritesList.innerHTML = '<div class="error">Você precisa estar logado para ver seus favoritos. <a href="/login">Fazer login</a></div>';
                } else {
                    favoritesList.innerHTML = '<div class="error">Erro ao carregar favoritos</div>';
                }
            }
        } catch (error) {
            console.error('Erro ao renderizar lista de favoritos:', error);
            favoritesList.innerHTML = '<div class="error">Erro ao carregar favoritos</div>';
        }
    }

    async fetchFavoriteIds() {
        try {
            const res = await fetch('/api/favoritos/ids', { credentials: 'same-origin' });
            if (!res.ok) return [];
            const ids = await res.json();
            return ids;
        } catch (e) {
            console.error('Erro ao buscar ids de favoritos', e);
            return [];
        }
    }

    // appendFavoriteToList removed: favorites list is re-rendered from server

    showNotification(message, type = 'info') {
        // Usar sistema de notificações existente ou criar um simples
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback simples
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
                color: white;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
}

// Adicionar estilos CSS necessários
const favoritesStyles = `
<style>
.favorite-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    border: 2px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.favorite-btn:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
}

.favorite-btn.active {
    background: var(--danger);
    color: var(--bg-primary);
    border-color: var(--danger);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

.favorite-btn i {
    font-size: 16px;
    color: inherit;
}

.favorites-count {
    background: #ff6b6b;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 12px;
    min-width: 18px;
    text-align: center;
}

.empty-favorites {
    text-align: center;
    padding: 50px 20px;
    color: #666;
}

.empty-favorites i {
    font-size: 48px;
    margin-bottom: 20px;
    opacity: 0.5;
}

.favorite-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 15px;
    background: white;
}

.favorite-image img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 5px;
}

.favorite-info {
    flex: 1;
}

.favorite-title {
    margin: 0 0 5px 0;
    font-size: 16px;
}

.favorite-price {
    color: #28a745;
    font-weight: bold;
    margin-bottom: 10px;
}

.favorite-actions {
    display: flex;
    gap: 10px;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

.btn-outline {
    border: 1px solid #ddd;
    background: white;
    color: #666;
}

.btn-outline:hover {
    border-color: #dc3545;
    color: #dc3545;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
</style>
`;

// Adicionar estilos ao head
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#favorites-styles')) {
        document.head.insertAdjacentHTML('beforeend', favoritesStyles);
    }
});

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se há elementos relacionados a favoritos na página
    const hasFavoriteElements = document.querySelector('.favorite-btn, #favorites-list, #products-grid');

    if (hasFavoriteElements) {
        try {
            window.favoritesManager = new FavoritesManager();
        } catch (error) {
            console.error('Erro ao inicializar FavoritesManager:', error);
        }
    }

    // Forçar renderização na página de favoritos se ela existir
    const favoritesList = document.getElementById('favorites-list');
    if (favoritesList) {
        setTimeout(() => {
            if (window.favoritesManager) {
                window.favoritesManager.renderFavoritesList();
            } else {
// Forçar renderização na página de favoritos se ela existir
    const favoritesList = document.getElementById('favorites-list');
    if (favoritesList) {
        setTimeout(() => {
            if (window.favoritesManager) {
                window.favoritesManager.renderFavoritesList();
            } else {
                // Fallback: render diretamente
                fetch('/api/favoritos/produtos?' + new Date().getTime(), { credentials: 'same-origin' })
                    .then(response => {
                        if (!response.ok) throw new Error('Not authorized');
                        return response.json();
                    })
                    .then(favorites => {
                        if (favorites.length === 0) {
                            favoritesList.innerHTML = `
                                <div class="empty-favorites">
                                    <i class="far fa-heart"></i>
                                    <h3>Seus favoritos estão vazios</h3>
                                    <p>Adicione produtos aos seus favoritos para visualizá-los aqui.</p>
                                    <a href="/produtos" class="btn btn-primary">Explorar Produtos</a>
                                </div>
                            `;
                        } else {
                            favoritesList.innerHTML = favorites.map(produto => `
                                <article class="product-card favorite-card" data-product-id="${produto.id}">
                                    <div class="product-image-container">
                                        <div class="product-image">
                                            <img src="${produto.imagem || '/static/images/placeholder.jpeg'}"
                                                 alt="${produto.nome}" loading="lazy">
                                        </div>
                                        <button class="favorite-btn active" data-product-id="${produto.id}" title="Remover dos favoritos">
                                            <i class="fas fa-heart"></i>
                                            <span class="favorite-text">Favoritado</span>
                                        </button>
                                    </div>
                                    <div class="product-info">
                                        <h3 class="product-title">${produto.nome}</h3>
                                        <div class="product-meta">
                                            <div class="product-price">R$ ${produto.preco.toFixed(2)}</div>
                                        </div>
                                        ${produto.descricao ? `<p class="product-description">${produto.descricao.substring(0, 80)}${produto.descricao.length > 80 ? '...' : ''}</p>` : ''}
                                    </div>
                                    <div class="product-actions">
                                        <button class="btn btn-primary" onclick="window.location.href='/produto/${produto.id}'"><i class="fas fa-eye"></i> Ver Detalhes</button>
                                        <button class="btn btn-secondary" onclick="addToCart(${produto.id})"><i class="fas fa-cart-plus"></i> Adicionar</button>
                                    </div>
                                </article>
                            `).join('');
                        }
                    })
                    .catch(error => {
                        favoritesList.innerHTML = '<div class="error">Erro ao carregar favoritos. Você precisa estar logado.</div>';
                    });
            }
        }, 100);
    }
});

// Observe DOM changes in products grid and favorites list so dynamic content
// (loaded by search.js or other scripts) always gets favorite-state applied.
(function setupMutationObservers() {
    try {
        const productsGrid = document.getElementById('products-grid');
        const favoritesListContainer = document.getElementById('favorites-list');

        const observerCallback = (mutationsList) => {
            let changed = false;
            for (const m of mutationsList) {
                if (m.addedNodes && m.addedNodes.length > 0) {
                    changed = true; break;
                }
            }
            if (changed && window.favoritesManager) {
                try { window.favoritesManager.updateUI(); } catch(e) { console.error('favorites observer updateUI', e); }
            }
        };

        const observer = new MutationObserver(observerCallback);
        if (productsGrid) observer.observe(productsGrid, { childList: true, subtree: true });
        if (favoritesListContainer) observer.observe(favoritesListContainer, { childList: true, subtree: true });
    } catch (e) {
        console.warn('favorites.js MutationObserver setup failed', e);
    }
})();
