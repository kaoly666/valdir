// static/js/features/reviews.js
// Sistema de Avaliações e Reviews

class ReviewsManager {
    constructor() {
        this.currentProductId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.detectProductPage();
    }

    bindEvents() {
        // Abrir modal de avaliação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-review-modal') || e.target.closest('.open-review-modal')) {
                e.preventDefault();
                const btn = e.target.classList.contains('open-review-modal') ? e.target : e.target.closest('.open-review-modal');
                const productId = btn.dataset.productId;
                if (productId) {
                    this.openReviewModal(productId);
                }
            }
        });

        // Submeter avaliação
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'review-form') {
                e.preventDefault();
                this.submitReview();
            }
        });

        // Editar avaliação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-review')) {
                e.preventDefault();
                const reviewId = e.target.dataset.reviewId;
                if (reviewId) {
                    this.editReview(reviewId);
                }
            }
        });

        // Deletar avaliação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-review')) {
                e.preventDefault();
                const reviewId = e.target.dataset.reviewId;
                if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
                    this.deleteReview(reviewId);
                }
            }
        });

        // Marcar como útil
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('useful-btn')) {
                e.preventDefault();
                const reviewId = e.target.dataset.reviewId;
                if (reviewId) {
                    this.markAsUseful(reviewId);
                }
            }
        });

        // Filtrar avaliações
        document.addEventListener('change', (e) => {
            if (e.target.id === 'review-filter') {
                this.filterReviews(e.target.value);
            }
        });
    }

    detectProductPage() {
        // Detectar se estamos em uma página de produto
        const productContainer = document.querySelector('[data-product-id]');
        if (productContainer) {
            this.currentProductId = productContainer.dataset.productId;
            this.loadReviews(this.currentProductId);
        }
    }

    async loadReviews(productId) {
        try {
            const response = await fetch(`/api/avaliacoes/produto/${productId}`);
            const reviews = await response.json();

            this.displayReviews(reviews);
            this.updateRatingSummary(reviews);
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        }
    }

    displayReviews(reviews) {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <i class="far fa-star"></i>
                    <h3>Seja o primeiro a avaliar!</h3>
                    <p>Sua opinião é importante para outros compradores.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="review-user">
                        <img src="/static/pic/${review.usuario.foto_perfil || 'default.png'}"
                             alt="${review.usuario.nome}" class="review-avatar">
                        <div class="review-user-info">
                            <strong>${review.usuario.nome}</strong>
                            <div class="review-date">${this.formatDate(review.data_criacao)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.nota)}
                    </div>
                </div>
                ${review.comentario ? `
                    <div class="review-content">
                        <p>${review.comentario}</p>
                    </div>
                ` : ''}
                <div class="review-actions">
                    <button class="useful-btn" data-review-id="${review.id}">
                        <i class="fas fa-thumbs-up"></i>
                        Útil (${review.util})
                    </button>
                    ${this.canEditReview(review) ? `
                        <button class="edit-review" data-review-id="${review.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="delete-review" data-review-id="${review.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    updateRatingSummary(reviews) {
        const summary = document.getElementById('rating-summary');
        if (!summary || reviews.length === 0) return;

        const total = reviews.length;
        const average = reviews.reduce((sum, r) => sum + r.nota, 0) / total;

        // Contar estrelas
        const starsCount = [0, 0, 0, 0, 0];
        reviews.forEach(review => {
            starsCount[review.nota - 1]++;
        });

        summary.innerHTML = `
            <div class="rating-overview">
                <div class="average-rating">
                    <div class="big-stars">${this.renderStars(average)}</div>
                    <div class="rating-number">${average.toFixed(1)}</div>
                    <div class="total-reviews">${total} avaliação${total !== 1 ? 'ões' : ''}</div>
                </div>
                <div class="rating-breakdown">
                    ${starsCount.map((count, index) => `
                        <div class="rating-bar">
                            <span class="star-label">${index + 1}★</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${(count / total) * 100}%"></div>
                            </div>
                            <span class="count">${count}</span>
                        </div>
                    `).reverse().join('')}
                </div>
            </div>
        `;
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    canEditReview(review) {
        // Verificar se o usuário logado é o autor da avaliação
        return window.currentUser && window.currentUser.id === review.usuario.id;
    }

    openReviewModal(productId) {
        this.currentProductId = productId;

        let modal = document.getElementById('review-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'review-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Avaliar Produto</h3>
                        <span class="modal-close">&times;</span>
                    </div>
                    <form id="review-form">
                        <div class="form-group">
                            <label>Sua avaliação:</label>
                            <div class="star-rating">
                                ${[5,4,3,2,1].map(n => `
                                    <input type="radio" id="star${n}" name="rating" value="${n}">
                                    <label for="star${n}">★</label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="review-comment">Comentário (opcional):</label>
                            <textarea id="review-comment" name="comment" rows="4"
                                placeholder="Conte sua experiência com este produto..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">Enviar Avaliação</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Fechar modal
            modal.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
            window.onclick = (e) => {
                if (e.target === modal) modal.style.display = 'none';
            };
        }

        modal.style.display = 'block';
    }

    async submitReview() {
        const form = document.getElementById('review-form');
        const formData = new FormData(form);
        const rating = formData.get('rating');
        const comment = formData.get('comment');

        if (!rating) {
            this.showNotification('Por favor, selecione uma avaliação em estrelas.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/avaliacoes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    produto_id: this.currentProductId,
                    nota: parseInt(rating),
                    comentario: comment
                })
            });

            const result = await response.json();

            if (result.id) {
                this.showNotification('Avaliação enviada com sucesso!', 'success');
                document.getElementById('review-modal').style.display = 'none';
                this.loadReviews(this.currentProductId);
            } else {
                this.showNotification(result.error || 'Erro ao enviar avaliação', 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            this.showNotification('Erro ao enviar avaliação', 'error');
        }
    }

    async editReview(reviewId) {
        // Implementar edição de avaliação
        this.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    async deleteReview(reviewId) {
        try {
            const response = await fetch(`/api/avaliacoes/${reviewId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Avaliação excluída!', 'success');
                this.loadReviews(this.currentProductId);
            } else {
                this.showNotification('Erro ao excluir avaliação', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir avaliação:', error);
            this.showNotification('Erro ao excluir avaliação', 'error');
        }
    }

    async markAsUseful(reviewId) {
        try {
            const response = await fetch(`/api/avaliacoes/${reviewId}/util`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar contador na UI
                const btn = document.querySelector(`.useful-btn[data-review-id="${reviewId}"]`);
                if (btn) {
                    const count = btn.querySelector('.count') || btn;
                    count.textContent = `Útil (${result.util})`;
                }
                this.showNotification('Obrigado pelo feedback!', 'success');
            }
        } catch (error) {
            console.error('Erro ao marcar como útil:', error);
        }
    }

    filterReviews(filter) {
        const reviews = document.querySelectorAll('.review-item');
        reviews.forEach(review => {
            const rating = parseInt(review.querySelector('.review-rating').textContent.length);
            if (filter === 'all' || rating === parseInt(filter)) {
                review.style.display = 'block';
            } else {
                review.style.display = 'none';
            }
        });
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Adicionar estilos CSS
const reviewsStyles = `
<style>
.star-rating {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
}

.star-rating input {
    display: none;
}

.star-rating label {
    font-size: 30px;
    color: #ddd;
    cursor: pointer;
    transition: color 0.3s;
}

.star-rating input:checked ~ label,
.star-rating label:hover,
.star-rating label:hover ~ label {
    color: #ffc107;
}

.review-item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    background: white;
}

.review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.review-user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.review-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.review-rating {
    color: #ffc107;
    font-size: 18px;
}

.review-content {
    margin: 15px 0;
    line-height: 1.6;
}

.review-actions {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}

.useful-btn {
    background: none;
    border: 1px solid #ddd;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.useful-btn:hover {
    border-color: #28a745;
    color: #28a745;
}

.rating-overview {
    display: flex;
    gap: 30px;
    margin-bottom: 20px;
}

.average-rating {
    text-align: center;
}

.big-stars {
    font-size: 48px;
    color: #ffc107;
    margin-bottom: 10px;
}

.rating-number {
    font-size: 36px;
    font-weight: bold;
    color: #333;
}

.rating-breakdown {
    flex: 1;
}

.rating-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.bar-container {
    flex: 1;
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    background: #ffc107;
    transition: width 0.3s ease;
}

.no-reviews {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.no-reviews i {
    font-size: 48px;
    margin-bottom: 20px;
    opacity: 0.5;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 0;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-close {
    font-size: 28px;
    cursor: pointer;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 20px;
    border-top: 1px solid #eee;
}
</style>
`;

// Adicionar estilos ao head
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#reviews-styles')) {
        document.head.insertAdjacentHTML('beforeend', reviewsStyles);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#reviews-container, .open-review-modal, [data-product-id]')) {
        window.reviewsManager = new ReviewsManager();
    }
});