// Perfil - Funcionalidades específicas da página de perfil

// Funções de edição de perfil
function editNome() {
    const nomeValue = document.getElementById('nome-value');
    const editBtn = document.getElementById('edit-nome-btn');
    const nomeDisplay = document.getElementById('nome-display');

    // Criar input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = nomeValue.textContent.trim();
    input.id = 'nome-input';

    // Criar botões
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.onclick = saveNome;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = cancelEdit;

    // Substituir conteúdo
    nomeValue.innerHTML = '';
    nomeValue.appendChild(input);
    editBtn.style.display = 'none';

    const detailValue = nomeValue.parentElement;
    detailValue.appendChild(saveBtn);
    detailValue.appendChild(cancelBtn);

    input.focus();
}

function saveNome() {
    const input = document.getElementById('nome-input');
    const newNome = input.value.trim();

    if (!newNome) {
        showNotification('Nome não pode estar vazio!', 'error');
        return;
    }

    // Enviar para servidor
    fetch('/api/update_perfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            field: 'nome',
            value: newNome
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar display
            document.getElementById('nome-value').textContent = newNome;
            document.getElementById('nome-display').textContent = `Olá, ${newNome}!`;
            cancelEdit();
            showNotification('Nome atualizado com sucesso!', 'success');
        } else {
            showNotification('Erro ao atualizar nome: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar nome', 'error');
    });
}

function editIdade() {
    const idadeValue = document.getElementById('idade-value');
    const editBtn = document.getElementById('edit-idade-btn');

    // Criar input
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'edit-input';
    input.value = idadeValue.textContent.replace(' anos', '');
    input.id = 'idade-input';
    input.min = '0';
    input.max = '150';

    // Criar botões
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.onclick = saveIdade;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => cancelEditField('idade');

    // Substituir conteúdo
    idadeValue.innerHTML = '';
    idadeValue.appendChild(input);
    editBtn.style.display = 'none';

    const detailValue = idadeValue.parentElement;
    detailValue.appendChild(saveBtn);
    detailValue.appendChild(cancelBtn);

    input.focus();
}

function saveIdade() {
    const input = document.getElementById('idade-input');
    const newIdade = input.value.trim();

    if (!newIdade) {
        showNotification('Idade não pode estar vazia!', 'error');
        return;
    }

    const idadeNum = parseInt(newIdade);
    if (isNaN(idadeNum) || idadeNum < 0 || idadeNum > 150) {
        showNotification('Idade deve estar entre 0 e 150 anos!', 'error');
        return;
    }

    // Enviar para servidor
    fetch('/api/update_perfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            field: 'idade',
            value: idadeNum
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar display
            document.getElementById('idade-value').textContent = `${idadeNum} anos`;
            cancelEditField('idade');
            showNotification('Idade atualizada com sucesso!', 'success');
        } else {
            showNotification('Erro ao atualizar idade: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar idade', 'error');
    });
}

function editEndereco() {
    const enderecoValue = document.getElementById('endereco-value');
    const editBtn = document.getElementById('edit-endereco-btn');

    // Criar input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = enderecoValue.textContent === 'Não informado' ? '' : enderecoValue.textContent;
    input.id = 'endereco-input';
    input.placeholder = 'Digite seu endereço';

    // Criar botões
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.onclick = saveEndereco;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => cancelEditField('endereco');

    // Substituir conteúdo
    enderecoValue.innerHTML = '';
    enderecoValue.appendChild(input);
    editBtn.style.display = 'none';

    const detailValue = enderecoValue.parentElement;
    detailValue.appendChild(saveBtn);
    detailValue.appendChild(cancelBtn);

    input.focus();
}

function saveEndereco() {
    const input = document.getElementById('endereco-input');
    const newEndereco = input.value.trim();

    // Enviar para servidor
    fetch('/api/update_perfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            field: 'endereco',
            value: newEndereco || null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar display
            document.getElementById('endereco-value').textContent = newEndereco || 'Não informado';
            cancelEditField('endereco');
            showNotification('Endereço atualizado com sucesso!', 'success');
        } else {
            showNotification('Erro ao atualizar endereço: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar endereço', 'error');
    });
}

function editTelefone() {
    const telefoneValue = document.getElementById('telefone-value');
    const editBtn = document.getElementById('edit-telefone-btn');

    // Criar input
    const input = document.createElement('input');
    input.type = 'tel';
    input.className = 'edit-input';
    input.value = telefoneValue.textContent === 'Não informado' ? '' : telefoneValue.textContent;
    input.id = 'telefone-input';
    input.placeholder = '(11) 99999-9999';

    // Criar botões
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.onclick = saveTelefone;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => cancelEditField('telefone');

    // Substituir conteúdo
    telefoneValue.innerHTML = '';
    telefoneValue.appendChild(input);
    editBtn.style.display = 'none';

    const detailValue = telefoneValue.parentElement;
    detailValue.appendChild(saveBtn);
    detailValue.appendChild(cancelBtn);

    input.focus();
}

function saveTelefone() {
    const input = document.getElementById('telefone-input');
    const newTelefone = input.value.trim();

    // Enviar para servidor
    fetch('/api/update_perfil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            field: 'telefone',
            value: newTelefone || null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar display
            document.getElementById('telefone-value').textContent = newTelefone || 'Não informado';
            cancelEditField('telefone');
            showNotification('Telefone atualizado com sucesso!', 'success');
        } else {
            showNotification('Erro ao atualizar telefone: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar telefone', 'error');
    });
}

function cancelEditField(field) {
    const valueElement = document.getElementById(`${field}-value`);
    const editBtn = document.getElementById(`edit-${field}-btn`);
    const detailValue = valueElement.parentElement;

    // Restaurar valor original baseado no campo
    let originalValue;
    if (field === 'idade') {
        originalValue = '{{ usuario.idade }} anos';
    } else if (field === 'endereco') {
        originalValue = '{{ usuario.endereco or "Não informado" }}';
    } else if (field === 'telefone') {
        originalValue = '{{ usuario.telefone or "Não informado" }}';
    }

    valueElement.textContent = originalValue;

    // Restaurar botão editar
    editBtn.style.display = 'inline-block';

    // Remover botões de salvar/cancelar
    const saveBtn = detailValue.querySelector('.btn-save');
    const cancelBtn = detailValue.querySelector('.btn-cancel');
    if (saveBtn) saveBtn.remove();
    if (cancelBtn) cancelBtn.remove();
}

function cancelEdit() {
    const nomeValue = document.getElementById('nome-value');
    const editBtn = document.getElementById('edit-nome-btn');
    const detailValue = nomeValue.parentElement;

    // Restaurar valor original
    const originalNome = document.getElementById('nome-display').textContent.replace('Olá, ', '').replace('!', '');
    nomeValue.textContent = originalNome;

    // Restaurar botão editar
    editBtn.style.display = 'inline-block';

    // Remover botões de salvar/cancelar
    const saveBtn = detailValue.querySelector('.btn-save');
    const cancelBtn = detailValue.querySelector('.btn-cancel');
    if (saveBtn) saveBtn.remove();
    if (cancelBtn) cancelBtn.remove();
}

// Funções para upload de foto de perfil
function uploadProfilePhoto() {
    const fileInput = document.getElementById('photo-upload');
    fileInput.click();
}

function changeProfilePhoto() {
    uploadProfilePhoto();
}

// Event listener para quando o arquivo for selecionado
document.addEventListener('DOMContentLoaded', function() {
    const photoUpload = document.getElementById('photo-upload');
    if (photoUpload) {
        photoUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                uploadProfileImage(file);
            }
        });
    }
});

function uploadProfileImage(file) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione um arquivo de imagem válido.', 'error');
        return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 5MB.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    // Mostrar loading
    showNotification('Enviando imagem...', 'info');

    fetch('/api/upload_profile_photo', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar imagem no perfil
            const profileImage = document.getElementById('profile-image');
            profileImage.src = `/static/pic/${data.filename}?t=${Date.now()}`; // Cache busting

            showNotification('Foto de perfil atualizada com sucesso!', 'success');
        } else {
            showNotification(data.error || 'Erro ao fazer upload da imagem.', 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao fazer upload:', error);
        showNotification('Erro ao fazer upload da imagem.', 'error');
    });
}