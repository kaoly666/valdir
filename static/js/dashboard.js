// dashboard.js
// Busca produtos da API e exibe na lista e gráfico

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/produtos')
        .then(response => response.json())
        .then(produtos => {
            // Exibir na lista
            const list = document.getElementById('produtos-list');
            produtos.forEach(produto => {
                const li = document.createElement('li');
                li.textContent = `${produto.nome}: R$ ${produto.preco}`;
                list.appendChild(li);
            });

            // Gráfico de preços
            const ctx = document.getElementById('precosChart').getContext('2d');
            const labels = produtos.map(p => p.nome);
            const data = produtos.map(p => p.preco);
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Preços',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Erro ao buscar produtos:', error));
});