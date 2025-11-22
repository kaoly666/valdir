// Notifications - Sistema de notificações

function showNotification(message, type = 'info', duration = 5000) {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Ícone baseado no tipo
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✕';
            break;
        case 'warning':
            icon = '⚠';
            break;
        default:
            icon = 'ℹ';
    }

    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="closeNotification(this)">×</button>
    `;

    // Adicionar ao container
    const container = document.getElementById('notification-container') || createNotificationContainer();
    container.appendChild(notification);

    // Animação de entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-remover após duração
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification.querySelector('.notification-close'));
        }, duration);
    }
}

function closeNotification(closeButton) {
    const notification = closeButton.closest('.notification');
    notification.classList.remove('show');

    // Remover do DOM após animação
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Funções de conveniência para diferentes tipos de notificação
function showSuccess(message, duration = 5000) {
    showNotification(message, 'success', duration);
}

function showError(message, duration = 7000) {
    showNotification(message, 'error', duration);
}

function showWarning(message, duration = 6000) {
    showNotification(message, 'warning', duration);
}

function showInfo(message, duration = 5000) {
    showNotification(message, 'info', duration);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Criar container de notificações se não existir
    if (!document.getElementById('notification-container')) {
        createNotificationContainer();
    }
});