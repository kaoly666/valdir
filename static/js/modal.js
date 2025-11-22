// Modal - Funcionalidades compartilhadas dos modais

function openModal(table, action, record = null) {
    currentTable = table;
    currentAction = action;

    document.getElementById('table-name').value = table;
    const recordIdElement = document.getElementById('record-id');
    recordIdElement.value = record && record.id ? record.id : '';
    recordIdElement.dataset.action = action;

    document.getElementById('modal-title').textContent = action === 'edit' ? 'Editar Registro' : 'Adicionar Registro';

    const fieldsContainer = document.getElementById('form-fields');
    fieldsContainer.innerHTML = '';

    // Get table data to determine field types
    const tableData = tablesData[table];
    if (tableData && tableData.length > 0) {
        const sampleRecord = record || tableData[0];

        for (const [key, value] of Object.entries(sampleRecord)) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ':';
            label.htmlFor = key;

            let input;

            if (key === 'id' || key === 'ID') {
                if (action === 'edit') {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = record ? record[key] : '';
                    input.readOnly = true;
                    formGroup.appendChild(label);
                    formGroup.appendChild(input);
                }
                // Skip ID field for new records
            } else if (typeof value === 'boolean') {
                input = document.createElement('select');
                const trueOption = document.createElement('option');
                trueOption.value = 'true';
                trueOption.textContent = 'Sim';
                const falseOption = document.createElement('option');
                falseOption.value = 'false';
                falseOption.textContent = 'Não';
                input.appendChild(trueOption);
                input.appendChild(falseOption);
                if (record) input.value = record[key] ? 'true' : 'false';
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            } else if (key.includes('password') || key.includes('senha')) {
                input = document.createElement('input');
                input.type = 'password';
                input.placeholder = action === 'edit' ? 'Deixe em branco para manter a senha atual' : '';
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            } else if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                if (record) input.value = record[key];
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            } else if (key === 'imagem' || key === 'image') {
                // Special handling for image fields
                const imageContainer = document.createElement('div');
                imageContainer.style.display = 'flex';
                imageContainer.style.alignItems = 'center';
                imageContainer.style.gap = '10px';
                imageContainer.style.flexWrap = 'wrap';

                const uploadButton = document.createElement('button');
                uploadButton.type = 'button';
                uploadButton.className = 'btn-admin btn-admin-success';
                uploadButton.textContent = 'Fazer Upload';
                uploadButton.onclick = () => openFileUpload(key, input);

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                fileInput.id = `file-upload-${key}`;

                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = key;
                hiddenInput.value = record ? record[key] || '' : '';

                input = hiddenInput; // Use hidden input for form submission
                imageContainer.appendChild(uploadButton);
                imageContainer.appendChild(fileInput);
                formGroup.appendChild(label);
                formGroup.appendChild(imageContainer);
            } else {
                input = document.createElement('input');
                input.type = 'text';
                if (record) input.value = record[key];
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            }

            if (input) {
                input.name = key;
                input.id = key;
            }

            if (formGroup.children.length > 0) {
                fieldsContainer.appendChild(formGroup);
            }
        }
    }

    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    // Limpar imagens pendentes quando o modal é fechado
    pendingImages = {};
}

// Função para submeter formulário do modal
function submitModalForm(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Converter valores booleanos
    Object.keys(data).forEach(key => {
        if (data[key] === 'true') data[key] = true;
        else if (data[key] === 'false') data[key] = false;
    });

    // Normalizar campos numéricos importantes (preco)
    if (data.hasOwnProperty('preco')) {
        const raw = data.preco;
        if (raw === '' || raw === null || raw === undefined) {
            data.preco = null;
        } else if (typeof raw === 'string') {
            // aceitar formatos com vírgula ou ponto
            const normalized = raw.replace(',', '.');
            const num = Number(normalized);
            data.preco = Number.isNaN(num) ? raw : num;
        }
    }

    // Normalize table name: api endpoints are singular (e.g., produto, usuario)
    const rawTable = data.table_name;
    const table = rawTable && rawTable.endsWith('s') ? rawTable.slice(0, -1) : rawTable;
    const recordId = data.record_id;
    const action = data.record_id ? 'edit' : 'add';

    // Remover campos especiais do formulário
    delete data.table_name;
    delete data.record_id;

    // Para edição, só enviar campos que foram preenchidos/alterados
    if (action === 'edit') {
        Object.keys(data).forEach(key => {
            // Remover campos vazios ou que não foram alterados
            if (data[key] === '' || data[key] === null || data[key] === undefined) {
                delete data[key];
            }
        });
    }

    console.log('Enviando dados:', data, 'para tabela:', table, 'ação:', action);

    const url = action === 'edit' ? `/api/${table}/${recordId}` : `/api/${table}`;
    const method = action === 'edit' ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(async response => {
        // Try parsing JSON, but gracefully handle HTML/text errors
        let result;
        try {
            result = await response.json();
        } catch (e) {
            const text = await response.text();
            result = { success: false, error: text || 'Erro desconhecido', status: response.status };
        }

        if (!response.ok) {
            if (result && result.login_required) {
                showNotification('Você precisa estar logado para esta ação', 'error');
                setTimeout(() => window.location.href = '/login', 1200);
                return;
            }
            showNotification('Erro: ' + (result.message || result.error || 'Resposta inválida do servidor'), 'error');
            return;
        }

        if (result.success) {
            showNotification(action === 'edit' ? 'Registro atualizado com sucesso!' : 'Registro criado com sucesso!', 'success');

            // Processar imagens pendentes se for um novo registro
            if (action === 'add' && result.id && Object.keys(pendingImages).length > 0) {
                processPendingImages(result.id);
            }

            closeModal();
            loadTables();
        } else {
            showNotification('Erro: ' + (result.message || result.error), 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao enviar formulário:', error);
        showNotification('Erro ao salvar o registro', 'error');
    });
}

// Inicialização dos eventos do modal
document.addEventListener('DOMContentLoaded', function() {
    // Fechar modal ao clicar no X
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }

    // Fechar modal ao clicar fora dele
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            closeModal();
        }
    }

    // Submeter formulário do modal
    const modalForm = document.getElementById('modal-form');
    if (modalForm) {
        modalForm.addEventListener('submit', submitModalForm);
    }
});