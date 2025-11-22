# Projeto valdirgay - Loja Virtual Completa

Este projeto é uma aplicação Flask completa que implementa uma loja virtual moderna com múltiplas funcionalidades avançadas.

## 🚀 Funcionalidades Implementadas

### ✅ **Sistema de Usuários**
- Cadastro e login de usuários
- Perfis de usuário com foto
- Sistema de autenticação seguro
- **Contas de Administrador** com acesso ao painel SQL

### ✅ **Gerenciamento de Produtos**
- CRUD completo de produtos
- Sistema de proprietários (quem adicionou o produto)
- Upload de imagens dos produtos
- Produtos em destaque
- Controle de estoque (ativo/inativo)

### ✅ **Sistema de Categorias**
- Organização de produtos por categorias
- Cores e ícones personalizáveis para categorias
- Relacionamento many-to-many entre produtos e categorias

### ✅ **Sistema de Busca e Filtros**
- Busca em tempo real por nome de produto
- Filtros por categoria, faixa de preço
- Ordenação (nome, preço, data, popularidade)
- Paginação inteligente
- Sugestões de busca

### ⚠️ **Sistema de Favoritos (removido)**
Este projeto tinha um recurso de "Favoritos" (wishlist) — ele foi removido do código e não está mais disponível.

### ✅ **Sistema de Avaliações e Reviews**
- Avaliação por estrelas (1-5)
- Sistema de comentários
- Média de avaliações por produto
- Votos de "útil" nas avaliações
- Filtro de avaliações

### ✅ **Sistema de Carrinho de Compras**
- Adicionar/remover produtos
- Persistência no localStorage
- Cálculo automático de totais
- Interface responsiva

### ✅ **Histórico de Visualizações**
- Rastreamento de produtos visualizados
- Produtos visualizados recentemente
- Persistência por usuário

### ✅ **Painel SQL Admin**
- Interface web para visualizar tabelas
- Edição inline de registros
- Controle de permissões (proprietario_id não editável)

### ✅ **Newsletter e Alertas**
- Sistema de inscrição para newsletter
- Preferências de notificação
- API para gerenciamento

## 📁 Estrutura do Projeto

```
valdirgay./
├── app.py                          # Aplicação principal Flask
├── config.py                       # Configurações
├── extensions.py                   # Extensões Flask
├── requirements.txt                # Dependências Python
├── models/                         # Modelos de dados
│   ├── produto.py                  # Modelo Produto (atualizado)
│   ├── usuario.py                  # Modelo Usuario
│   ├── categoria.py                # Sistema de Categorias
│   ├── avaliacao.py                # Sistema de Avaliações
│   ├── favorito.py                 # (removed) sistema de favoritos
│   ├── visualizacao.py             # Histórico de Visualizações
│   └── newsletter.py               # Sistema de Newsletter
├── routes/                         # APIs REST
│   ├── api_produtos.py             # CRUD de produtos
│   ├── api_categorias.py           # Gerenciamento de categorias
│   ├── api_avaliacoes.py           # Sistema de reviews
│   ├── api_favoritos.py            # (removed) Gerenciamento de favoritos
│   ├── api_visualizacoes.py        # Histórico de visualizações
│   ├── api_newsletter.py           # Sistema de newsletter
│   └── api_busca.py                # Busca e filtros
├── static/                         # Arquivos estáticos
│   ├── css/
│   │   ├── styles.css              # CSS principal
│   │   └── features/               # CSS dos recursos
│   │       ├── search.css          # Busca e filtros
│   │       ├── favorites.css       # (removed) Favoritos
│   │       └── reviews.css         # Avaliações
│   ├── js/
│   │   ├── app.js                  # JavaScript principal
│   │   └── features/               # JS dos recursos
│   │       ├── search.js           # Busca e filtros
│   │       ├── favorites.js        # (removed) Favoritos
│   │       └── reviews.js          # Avaliações
│   └── images/                     # Imagens dos produtos
├── templates/                      # Templates HTML
│   ├── base.html                   # Template base (atualizado)
│   ├── produtos.html               # Página de produtos (atualizada)
│   ├── favoritos.html              # (removed) Página de favoritos
│   ├── carrinho.html               # Carrinho de compras
│   ├── perfil.html                 # Perfil do usuário
│   ├── login.html                  # Login
│   ├── cadastro.html               # Cadastro
│   └── sql.html                    # Painel SQL admin
└── venv/                          # Ambiente virtual
```

## 🛠️ Como Executar

1. **Ativar o ambiente virtual:**
   ```bash
   source venv/bin/activate
   ```

2. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Executar a aplicação:**
   ```bash
   python app.py
   ```

4. **Acessar:**
   - Loja: http://127.0.0.1:5000/
   - Produtos: http://127.0.0.1:5000/produtos
   - Favoritos: (removed)
   - Painel SQL: http://127.0.0.1:5000/sql

## 🔗 APIs Disponíveis

### Produtos
- `GET /api/produtos` - Lista produtos
- `POST /api/produtos` - Criar produto

### Busca e Filtros
- `GET /api/busca/produtos` - Busca filtrada
- `GET /api/busca/sugestoes` - Sugestões de busca
- `GET /api/busca/destaques` - Produtos em destaque

### Categorias
- `GET /api/categorias/` - Lista categorias
- `POST /api/categorias/` - Criar categoria
- `GET /api/categorias/<id>/produtos` - Produtos da categoria

### Favoritos (removido)
As APIs de Favoritos foram removidas deste projeto.

### Avaliações
- `GET /api/avaliacoes/produto/<id>` - Avaliações do produto
- `POST /api/avaliacoes/` - Criar avaliação
- `PUT /api/avaliacoes/<id>` - Editar avaliação
- `DELETE /api/avaliacoes/<id>` - Remover avaliação

### Visualizações
- `GET /api/visualizacoes/` - Histórico do usuário
- `POST /api/visualizacoes/produto/<id>` - Registrar visualização

### Newsletter
- `POST /api/newsletter/` - Inscrever
- `DELETE /api/newsletter/cancelar` - Cancelar inscrição

## 📊 Dados de Exemplo

O sistema cria automaticamente:
- 1 usuário admin (admin@example.com / 123456) **com privilégios administrativos**
- 8 produtos de exemplo
- 4 categorias organizadas
- Avaliações de exemplo
- Relacionamentos entre produtos e categorias

## 🎨 Tecnologias Utilizadas

- **Backend:** Flask, SQLAlchemy, Werkzeug
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Banco:** SQLite (desenvolvimento)
- **UI/UX:** Design responsivo, FontAwesome icons
- **APIs:** RESTful JSON APIs

## 🔐 Sistema de Administradores

### Criando Conta de Administrador
Durante o cadastro, marque a opção "Conta de Administrador (acesso ao painel SQL)" para criar uma conta com privilégios administrativos.

### Privilégios de Administrador
- Acesso ao painel SQL para visualização e edição de dados
- Link "SQL" aparece no menu de navegação
- Controle total sobre usuários e produtos do sistema

### Conta Admin Padrão
- **Email:** admin@example.com
- **Senha:** 123456
- **Privilégios:** Administrador completo

## 📱 Responsividade

- Design mobile-first
- Breakpoints para tablets e desktop
- Navegação touch-friendly
- Imagens otimizadas

## 🚀 Próximas Expansões Possíveis

- Sistema de pagamentos (simulado)
- Notificações em tempo real (WebSockets)
- Upload múltiplo de imagens
- Sistema de cupons/descontos
- Relatórios e analytics
- API de integração externa
- Modo escuro/claro
- Chat ao vivo
- Sistema de pedidos

## Usando ngrok para Exposição Externa

Para expor a aplicação localmente para acesso externo (útil para testes ou compartilhamento):

1. **Instalar ngrok:**
   - Baixe e instale o ngrok em https://ngrok.com/download
   - Ou via snap: `sudo snap install ngrok`

2. **Autenticar ngrok (opcional, para domínios personalizados):**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

3. **Executar a aplicação Flask em background ou em outro terminal.**

4. **Expor a porta 5000:**
   ```bash
   ngrok http 5000
   ```

5. **Copie a URL gerada (ex: https://abc123.ngrok.io) e acesse no navegador.**

**Nota:** ngrok gera URLs temporárias. Para sessões persistentes, considere um plano pago.

## Funcionalidades

- **Loja (index.html):** Página inicial da loja (personalize conforme necessário)
- **Dashboard (dashboard.html):** Visualização de produtos com lista e gráfico de preços usando Chart.js
- **Banco de Dados:** SQLite local (db.sqlite) com produtos de exemplo

## Desenvolvimento

- Modifique os templates em `templates/` para personalizar o frontend
- Adicione novas rotas em `routes/`
- Atualize modelos em `models/`
- Estilos em `static/css/`, scripts em `static/js/`

## Limpeza

Para limpar arquivos temporários:
```bash
rm -rf __pycache__ instance/
```

## 🧭 Explicação detalhada do código (visão por arquivos)

A seguir está uma descrição dos componentes principais do projeto, com explicações sobre como funcionam e onde procurar para alterar comportamento.

- **app.py**
   - Arquivo principal que configura o Flask, inicializa a extensão `db` do SQLAlchemy e registra rotas públicas e APIs.
   - Implementa `login_required` e `admin_required` para controle de acesso. O `admin_required` retorna respostas JSON (401/403) para APIs quando necessário.
   - Entrada do servidor e funções para CRUD de produtos e usuários, uploads de imagens e endpoints administrativos.

- **extensions.py**
   - Inicializa a instância `db` (SQLAlchemy) que é importada por modelos e pela aplicação.

- **config.py**
   - Configurações do aplicativo (ex.: URI do SQLite). Personalize aqui para apontar o banco de dados desejado.

- **models/**
   - Contém os modelos de dados do SQLAlchemy: `Usuario`, `Produto`, `Categoria`, `Avaliacao`, `Visualizacao`, `Newsletter`.
   - Cada arquivo tem o `to_dict()` onde necessário para serializar objetos às APIs.

- **routes/**
   - Blueprints e APIs REST organizadas por responsabilidade: produtos, categorias, avaliações, newsletter, busca, visualizações.

- **templates/**
   - Templates Jinja2 para as páginas do site. `base.html` é o layout global (inclusões de CSS/JS, navbar, footer).

- **static/**
   - `css/`: temas, componentes, compatibilidade legada e estilos específicos.
   - `js/`: scripts cliente. `app.js` gerencia o carrinho (persistência local), `sql.js` manipula o painel SQL, `modal.js` lida com envio de formulários via modal. Arquivos dentro de `features/` isolam funcionalidades como busca e reviews.

## 🔤 Tradução e mensagens

- Todas as mensagens visíveis ao usuário (flashes, notificações e textos em templates) foram mantidas/garantidas em português.
- Mensagens técnicas (console.log / console.error) também foram traduzidas onde faz sentido — mas chaves usadas programaticamente em JSON (`success`, `error`) foram mantidas em inglês para compatibilidade com chamadas JS existentes.

## ⚠️ Observações finais e boas práticas

- Se o projeto ficar exposto ao público, remova a opção de criar administradores via cadastro público ou proteja com um token/invite — é um risco de segurança deixar essa opção aberta.
- Recomendação: usar variáveis de ambiente para configuração (SENHA, CHAVE, DATABASE_URL) e não manter valores sensíveis em código.
