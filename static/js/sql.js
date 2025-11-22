// SQL/Admin - Funcionalidades específicas da página de administração

let currentTable = '';
let currentAction = '';
let tablesData = {};
let pendingImages = {}; // Armazenar imagens selecionadas para upload posterior

async function loadTables() {
    try {
        const response = await fetch('/api/tables?' + new Date().getTime());
        if (!response.ok) {
            throw new Error('Erro ao carregar dados');
        }
        tablesData = await response.json();
        renderTables();
    } catch (error) {
        console.error('Erro ao carregar tabelas:', error);
        document.getElementById('sql-container').innerHTML = '<div class="error">Erro ao carregar dados. Tente novamente.</div>';
    }
}

function renderTables() {
    const container = document.getElementById('sql-container');
    container.innerHTML = '';

    // Renderizar cada tabela
    for (const [tableName, records] of Object.entries(tablesData)) {
        const tableSection = document.createElement('div');
        tableSection.className = 'table-section';

        const header = document.createElement('h2');
        header.textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1);

        // Removed the "+ Adicionar" button per request — records are managed via edit/delete only
        tableSection.appendChild(header);

        if (tableName === 'produtos') {
            // Layout especial para produtos
            renderProductsGrid(tableSection, records, tableName);
        } else {
            // Tabela normal para outras entidades
            renderTable(tableSection, records, tableName);
        }

        container.appendChild(tableSection);
    }
}

function renderProductsGrid(container, records, tableName) {
    const grid = document.createElement('div');
    grid.className = 'products-grid';

    records.forEach(record => {
        const card = document.createElement('div');
        card.className = 'product-card';

            const fields = Object.entries(record).map(([key, value]) => {
            if (key === 'id') return '';
            if (key === 'favoritos') return '';
            if (key === 'imagem' && value) {
                return `<div class="product-field"><strong>${key}:</strong> <img src="/static/${value}" alt="Imagem" style="max-width: 100px; max-height: 100px; object-fit: cover;"></div>`;
            }
            return `<div class="product-field"><strong>${key}:</strong> ${value || 'N/A'}</div>`;
        }).join('');

        const actions = document.createElement('div');
        actions.className = 'product-actions';

        const editButton = document.createElement('button');
        editButton.className = 'btn-admin btn-admin-primary';
        editButton.textContent = 'Editar';
        editButton.onclick = () => openModal(tableName, 'edit', record);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-admin btn-admin-danger';
        deleteButton.textContent = 'Excluir';
        deleteButton.onclick = () => deleteRecord(tableName, record.id);

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        card.innerHTML = fields;
        card.appendChild(actions);
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

function renderTable(container, records, tableName) {
    const table = document.createElement('table');
    table.className = 'admin-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

        if (records.length > 0) {
        Object.keys(records[0]).forEach(key => {
            // Skip 'favoritos' column (remove from SQL admin view)
            if (key === 'favoritos') return;
            const th = document.createElement('th');
            th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            headerRow.appendChild(th);
        });

        // Coluna de ações
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Ações';
        headerRow.appendChild(actionsTh);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');

    records.forEach(record => {
        const row = document.createElement('tr');

        Object.entries(record).forEach(([key, value]) => {
            // Skip favorites field entirely in the SQL view
            if (key === 'favoritos') return;
            const td = document.createElement('td');

            // Tratamento especial para campos de senha
            if (key.includes('password') || key.includes('senha')) {
                const passwordSpan = document.createElement('span');
                passwordSpan.className = 'password-field';
                passwordSpan.textContent = value ? value.substring(0, 12) + '...' : 'N/A';
                passwordSpan.title = 'Clique para ver/ocultar senha completa';
                passwordSpan.style.cursor = 'pointer';
                passwordSpan.style.userSelect = 'none';

                let showingFull = false;
                passwordSpan.onclick = () => {
                    showingFull = !showingFull;
                    if (showingFull) {
                        passwordSpan.textContent = value || 'N/A';
                        passwordSpan.style.fontFamily = 'monospace';
                        passwordSpan.style.fontSize = '0.8em';
                    } else {
                        passwordSpan.textContent = value ? value.substring(0, 12) + '...' : 'N/A';
                        passwordSpan.style.fontFamily = '';
                        passwordSpan.style.fontSize = '';
                    }
                };

                td.appendChild(passwordSpan);
            
            } else {
                td.textContent = value || 'N/A';
            }

            row.appendChild(td);
        });

        // Ações
        const actionsTd = document.createElement('td');

        const editButton = document.createElement('button');
        editButton.className = 'btn-admin btn-admin-primary';
        editButton.textContent = 'Editar';
        editButton.onclick = () => openModal(tableName, 'edit', record);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-admin btn-admin-danger';
        deleteButton.textContent = 'Excluir';
        deleteButton.onclick = () => deleteRecord(tableName, record.id);

        actionsTd.appendChild(editButton);
        actionsTd.appendChild(deleteButton);
        row.appendChild(actionsTd);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

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
        // Para adicionar, usar um objeto vazio mas ter referência dos tipos
        // Para editar, usar o registro existente
        const sampleRecord = action === 'add' ? {} : record;
        const typeReference = tableData[0]; // Usar primeiro registro como referência de tipos

        // Para adicionar, garantir que todos os campos necessários sejam criados
        let fieldsToIterate;
        if (action === 'add') {
            // Para adicionar, usar todos os campos do registro de referência
            fieldsToIterate = Object.keys(typeReference).reduce((acc, key) => {
                acc[key] = typeReference[key]; // Copiar tipo do registro de referência
                return acc;
            }, {});
        } else {
            // Para editar, usar o registro específico
            fieldsToIterate = sampleRecord;
        }

        for (const [key, value] of Object.entries(fieldsToIterate)) {
            // Do not expose 'favoritos' field in SQL UI
            if (key === 'favoritos') continue;
            // Pular campos de senha na edição
            if (action === 'edit' && (key.includes('password') || key.includes('senha'))) {
                continue;
            }

            // Pular campos que não devem ser editados
            if (key === 'data_criacao' || key === 'data_visualizacao') {
                continue;
            }

            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ') + ':';
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
                if (action === 'edit' && record) input.value = record[key] ? 'true' : 'false';
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            } else if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                if (action === 'edit' && record) input.value = record[key];
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
                hiddenInput.value = (action === 'edit' && record) ? record[key] || '' : '';

                input = hiddenInput; // Use hidden input for form submission
                imageContainer.appendChild(uploadButton);
                imageContainer.appendChild(fileInput);
                formGroup.appendChild(label);
                formGroup.appendChild(imageContainer);
            } else if (key === 'favoritos') {
                // Special handling for favoritos field - use textarea
                input = document.createElement('textarea');
                input.rows = 3;
                input.placeholder = 'Lista de IDs de produtos favoritos em formato JSON, ex: [1, 2, 3]';
                if (action === 'edit' && record) input.value = record[key] || '';
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            } else {
                input = document.createElement('input');
                input.type = 'text';
                if (action === 'edit' && record) input.value = record[key];
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

function deleteRecord(table, id) {
    console.log('Excluindo registro:', table, id);
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        fetch(`/api/${table}/${id}`, {
            method: 'DELETE',
        })
        .then(response => {
            console.log('Status da resposta (exclusão):', response.status);
            return response.json();
        })
        .then(result => {
            console.log('Resultado da exclusão:', result);
            if (result.success) {
                showNotification('Registro excluído com sucesso!', 'success');
                loadTables();
            } else {
                showNotification('Erro: ' + (result.message || result.error), 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir registro:', error);
            showNotification('Erro ao excluir o registro', 'error');
        });
    }
}

function openFileUpload(fieldName, hiddenInput) {
    const fileInput = document.getElementById(`file-upload-${fieldName}`);
    fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem válido.');
                return;
            }

            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 5MB.');
                return;
            }

            // Upload da imagem
            uploadProductImage(file, fieldName, hiddenInput);
        }
    };
}

function uploadProductImage(file, fieldName, hiddenInput) {
    // Obter ID do produto do formulário
    const produtoId = document.getElementById('record-id').value;

    if (!produtoId) {
        // Estamos criando um novo registro - armazenar imagem para upload posterior
        pendingImages[fieldName] = {
            file: file,
            hiddenInput: hiddenInput
        };
        hiddenInput.value = 'pending_upload'; // Marcador temporário
        alert('Imagem selecionada! Será enviada após salvar o registro.');
        return;
    }

    // Temos ID - fazer upload normalmente
    const formData = new FormData();
    formData.append('image', file);

    // Mostrar loading
    const uploadButton = document.querySelector(`#file-upload-${fieldName}`).previousElementSibling;
    const originalText = uploadButton.textContent;
    uploadButton.textContent = '⏳ Fazendo upload...';
    uploadButton.disabled = true;

    fetch(`/api/upload_product_image/${produtoId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hiddenInput.value = data.image_path;
            alert('Imagem enviada com sucesso!');
        } else {
            alert(data.error || 'Erro ao fazer upload da imagem');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao fazer upload da imagem');
    })
    .finally(() => {
        // Restaurar botão
        uploadButton.textContent = originalText;
        uploadButton.disabled = false;
        // Limpar input
        document.getElementById(`file-upload-${fieldName}`).value = '';
    });
}

function processPendingImages(recordId) {
    const promises = [];

    for (const [fieldName, imageData] of Object.entries(pendingImages)) {
        const formData = new FormData();
        formData.append('image', imageData.file);

        const promise = fetch(`/api/upload_product_image/${recordId}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                imageData.hiddenInput.value = data.image_path;
                console.log(`Imagem ${fieldName} enviada com sucesso`);
            } else {
                console.error(`Erro ao enviar imagem ${fieldName}:`, data.error);
            }
        })
        .catch(error => {
            console.error(`Erro ao enviar imagem ${fieldName}:`, error);
        });

        promises.push(promise);
    }

    // Limpar imagens pendentes após processar
    Promise.all(promises).then(() => {
        pendingImages = {};
        console.log('Todas as imagens pendentes foram processadas');
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', loadTables);