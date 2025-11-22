// static/js/features/search.js
// Sistema de Busca e Filtros

// Função global para redirecionar para adicionar produto
function redirectToAddProduct() {
    window.location.href = '/adicionar_produto';
}

class SearchManager {
    constructor() {
        this.currentFilters = {
            query: '',
            categoria_id: null,
            preco_min: null,
            preco_max: null,
            ordenacao: 'nome',
            pagina: 1
        };
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
    }

    bindEvents() {
        // Campo de busca
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.onSearchInput.bind(this), 300));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Botão de busca
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        // Botão de adicionar produto
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => redirectToAddProduct());
        }

        // Filtros
        const categoriaSelect = document.getElementById('categoria-filter');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', (e) => {
                this.currentFilters.categoria_id = e.target.value || null;
                this.currentFilters.pagina = 1;
                this.performSearch();
            });
        }

        const precoMinInput = document.getElementById('preco-min');
        const precoMaxInput = document.getElementById('preco-max');
        if (precoMinInput) {
            precoMinInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.preco_min = precoMinInput.value || null;
                this.currentFilters.pagina = 1;
                this.performSearch();
            }, 500));
        }
        if (precoMaxInput) {
            precoMaxInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.preco_max = precoMaxInput.value || null;
                this.currentFilters.pagina = 1;
                this.performSearch();
            }, 500));
        }

        // Ordenação
        const ordenacaoSelect = document.getElementById('ordenacao-select');
        if (ordenacaoSelect) {
            ordenacaoSelect.addEventListener('change', (e) => {
                this.currentFilters.ordenacao = e.target.value;
                this.currentFilters.pagina = 1;
                this.performSearch();
            });
        }

        // Paginação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    this.currentFilters.pagina = page;
                    this.performSearch();
                }
            }
        });

        // Limpar filtros
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    async loadInitialData() {
        await this.loadCategories();
        await this.performSearch();
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categorias/');
            const categories = await response.json();

            const categoriaSelect = document.getElementById('categoria-filter');
            if (categoriaSelect) {
                categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nome;
                    categoriaSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    onSearchInput(e) {
        const value = e.target.value;
        this.currentFilters.query = value;
        // show suggestions (small popup) but also act like selecting a category:
        // trigger the main search results update as the user types (debounced)
        this.showSuggestions(value);

        // Only run the main search when the query has at least 1 character to avoid
        // running empty queries too often (debounce already throttles requests)
        if (!value || value.trim().length === 0) {
            // If query cleared, run the search to reset filters (shows all)
            this.currentFilters.pagina = 1;
            this.performSearch();
            return;
        }

        // For typing searches, update page back to 1 and perform the search.
        this.currentFilters.pagina = 1;
        this.performSearch();
    }

    async showSuggestions(query) {
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        try {
            const response = await fetch(`/api/busca/sugestoes?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();

            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        }
    }

    displaySuggestions(suggestions) {
        let suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'search-suggestions';
            suggestionsContainer.className = 'search-suggestions';

            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.parentNode.appendChild(suggestionsContainer);
            }
        }

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // Render suggestion items properly (not using React's dangerouslySetInnerHTML)
        suggestionsContainer.innerHTML = suggestions.map(s => `
            <div class="suggestion-item" data-product-id="${s.id}" data-product-name="${s.nome}">
                <img src="${s.imagem || '/static/images/placeholder.jpeg'}" alt="${s.nome}" class="suggestion-image">
                <div class="suggestion-info">
                    <div class="suggestion-name">${s.nome_destacado}</div>
                    <div class="suggestion-price">R$ ${s.preco.toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // Eventos
        // clicking a suggestion should populate the search input and show results in the products grid
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const productName = item.dataset.productName || '';
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = productName;
                // update current filters and perform search to render results into the products grid
                this.currentFilters.query = productName;
                this.currentFilters.pagina = 1;
                this.performSearch();
                this.hideSuggestions();
            });
        });
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    async performSearch() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams();
            Object.entries(this.currentFilters).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    // backend expects the text search param as 'q'
                    if (key === 'query') {
                        params.append('q', value);
                    } else {
                        params.append(key, value);
                    }
                }
            });

            const response = await fetch(`/api/busca/produtos?${params}`);
            const data = await response.json();

            this.displayResults(data);
            this.updateFiltersUI(data.faixas_preco);
            this.hideSuggestions();

        } catch (error) {
            console.error('Erro na busca:', error);
            this.showError('Erro ao realizar busca');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('products-grid');
        const paginationContainer = document.getElementById('pagination');
        const resultsCount = document.getElementById('results-count');

        if (!resultsContainer) return;

        // Resultados
        if (data.produtos.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente ajustar seus filtros ou termos de busca.</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = data.produtos.map(produto => `
                <article class="product-card" data-product-id="${produto.id}">
                    <div class="product-image-container">
                        <div class="product-image">
                            <img src="${produto.imagem || '/static/images/placeholder.jpeg'}"
                                 alt="${produto.nome}" loading="lazy">
                            ${produto.destaque ? '<div class="product-badge destaque">Destaque</div>' : ''}
                        </div>
                        <!-- favorites removed -->
                    <div class="product-info">
                        <h3 class="product-title">${produto.nome}</h3>
                        <div class="product-meta">
                            ${produto.media_avaliacao ? `
                                <div class="product-rating">
                                    ${this.renderStars(produto.media_avaliacao)}
                                    <span class="rating-count">(${produto.total_avaliacoes})</span>
                                </div>
                            ` : '<div class="no-rating">Sem avaliações</div>'}
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

            // favorites feature removed — no favorite buttons to update
        }

        // Contagem de resultados
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${data.produtos.length} de ${data.stats.total} produtos`;
        }

        // Paginação
        if (paginationContainer) {
            paginationContainer.innerHTML = this.renderPagination(data.stats);
        }
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${'★'.repeat(fullStars)}
            ${hasHalfStar ? '☆' : ''}
            ${'☆'.repeat(emptyStars)}
        `;
    }

    renderPagination(stats) {
        if (stats.paginas <= 1) return '';

        let html = '<div class="pagination">';

        // Anterior
        if (stats.pagina_atual > 1) {
            html += `<a href="#" class="page-link" data-page="${stats.pagina_atual - 1}">« Anterior</a>`;
        }

        // Páginas
        for (let i = Math.max(1, stats.pagina_atual - 2); i <= Math.min(stats.paginas, stats.pagina_atual + 2); i++) {
            if (i === stats.pagina_atual) {
                html += `<span class="page-link current">${i}</span>`;
            } else {
                html += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
            }
        }

        // Próximo
        if (stats.pagina_atual < stats.paginas) {
            html += `<a href="#" class="page-link" data-page="${stats.pagina_atual + 1}">Próximo »</a>`;
        }

        html += '</div>';
        return html;
    }

    updateFiltersUI(faixasPreco) {
        // Atualizar ranges de preço
        const precoMinInput = document.getElementById('preco-min');
        const precoMaxInput = document.getElementById('preco-max');

        if (precoMinInput && !precoMinInput.value) {
            precoMinInput.placeholder = `Mín: R$ ${faixasPreco.min.toFixed(2)}`;
        }
        if (precoMaxInput && !precoMaxInput.value) {
            precoMaxInput.placeholder = `Máx: R$ ${faixasPreco.max.toFixed(2)}`;
        }
    }

    clearFilters() {
        this.currentFilters = {
            query: '',
            categoria_id: null,
            preco_min: null,
            preco_max: null,
            ordenacao: 'nome',
            pagina: 1
        };

        // Limpar campos da UI
        const searchInput = document.getElementById('search-input');
        const categoriaSelect = document.getElementById('categoria-filter');
        const precoMinInput = document.getElementById('preco-min');
        const precoMaxInput = document.getElementById('preco-max');
        const ordenacaoSelect = document.getElementById('ordenacao-select');

        if (searchInput) searchInput.value = '';
        if (categoriaSelect) categoriaSelect.value = '';
        if (precoMinInput) precoMinInput.value = '';
        if (precoMaxInput) precoMaxInput.value = '';
        if (ordenacaoSelect) ordenacaoSelect.value = 'nome';

        this.performSearch();
    }

    showLoading() {
        const resultsContainer = document.getElementById('products-grid');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading">Buscando produtos...</div>';
        }
    }

    hideLoading() {
        // Loading é removido quando displayResults é chamado
    }

    showError(message) {
        const resultsContainer = document.getElementById('products-grid');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Use the global addToCart provided by `static/js/app.js` (cart implementation)
// This file no longer defines a placeholder so the app-wide cart implementation will be used.

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('search-input') || document.getElementById('products-grid')) {
        window.searchManager = new SearchManager();
    }
});