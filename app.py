# app.py
# Objetivo: Inicializar o Flask, SQLAlchemy, registrar rotas e servir templates.
#
# Requisitos:
# 1. Importar Flask, render_template, SQLAlchemy e a classe Config.
# 2. Inicializar o app e o db (SQLAlchemy(app)).
# 3. Configurar o app usando app.config.from_object(Config).
# 4. Importar e registrar o Blueprint 'api_produtos' do módulo routes.api_produtos.
# 5. Criar uma rota raiz ('/') que renderiza o template 'index.html' (Sua loja).
# 6. Criar uma rota '/dashboard' que renderiza o template 'dashboard.html' (Plataforma de Visualização).
# 7. Criar uma função 'create_db_and_add_samples()' que inicializa o db (db.create_all()) e insere pelo menos 2 produtos de exemplo ('Monitor Gamer' e 'Mousepad Grande') se o banco estiver vazio.
# 8. Rodar o app no bloco __name__ == '__main__' e chamar a função de inicialização.

from flask import Flask, render_template, redirect, request, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from models.usuario import Usuario
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from extensions import db
from functools import wraps
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = 'chave_secreta'  # mudar para algo seguro
db.init_app(app)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # If this is an API call, return JSON error instead of redirecting
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'error': 'Autenticação requerida'}), 401
            return redirect('/login')
        user = Usuario.query.get(session['user_id'])
        if not user or not getattr(user, 'is_admin', False):
            # For API calls return a JSON error, for pages redirect and flash
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'error': 'Acesso negado: administrador necessário.'}), 403
            flash('Acesso negado: você precisa ser administrador para acessar esta página.')
            return redirect('/produtos')
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Retorna o usuário atual se estiver logado"""
    if 'user_id' in session:
        return Usuario.query.get(session['user_id'])
    return None

from models.produto import Produto
from models.usuario import Usuario
from models.categoria import Categoria
from models.avaliacao import Avaliacao
from models.visualizacao import Visualizacao
from models.newsletter import Newsletter

# Adicionar função ao contexto dos templates
@app.context_processor
def inject_current_user():
    return {'get_current_user': get_current_user}

from routes.api_produtos import api_produtos
from routes.api_categorias import api_categorias
from routes.api_avaliacoes import api_avaliacoes
from routes.api_visualizacoes import api_visualizacoes
from routes.api_newsletter import api_newsletter
from routes.api_busca import api_busca

app.register_blueprint(api_produtos)
app.register_blueprint(api_categorias)
app.register_blueprint(api_avaliacoes)
# Favorites API removed (feature disabled)
app.register_blueprint(api_visualizacoes)
app.register_blueprint(api_newsletter)
app.register_blueprint(api_busca)

@app.route('/api/produtos')
def api_produtos_list():
    try:
        produtos = Produto.query.all()
        produtos_data = []
        for produto in produtos:
            produto_dict = produto.to_dict()
            # Garantir que a imagem tenha um valor padrão
            produto_dict['imagem'] = produto.imagem or '/static/images/placeholder.jpeg'
            produtos_data.append(produto_dict)
        return jsonify(produtos_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return redirect('/produtos')

@app.route('/carrinho')
@login_required
def carrinho():
    return render_template('carrinho.html')

@app.route('/checkout')
@login_required
def checkout():
    return render_template('checkout.html')

# Favorites page removed

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    if request.method == 'POST':
        nome = request.form['nome']
        email = request.form['email']
        senha = request.form['senha']
        idade = request.form['idade']
        endereco = request.form.get('endereco', '')
        telefone = request.form.get('telefone', '')
        # Allow the signup form to set admin flag when the checkbox is present.
        # Note: this matches the user's explicit request to let signups create admin accounts
        # when the checkbox is checked. By default (unchecked) new users are not admin.
        is_admin = request.form.get('is_admin') == '1'

        if Usuario.query.filter_by(email=email).first():
            flash('Email já cadastrado!')
            return redirect('/cadastro')

        hashed_senha = generate_password_hash(senha)
        novo_usuario = Usuario(nome=nome, email=email, senha=hashed_senha, idade=int(idade), endereco=endereco, telefone=telefone, is_admin=is_admin)
        db.session.add(novo_usuario)
        db.session.commit()
        flash('Cadastro realizado com sucesso!')
        return redirect('/login')

    return render_template('cadastro.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        senha = request.form['senha']

        usuario = Usuario.query.filter_by(email=email).first()
        if usuario and check_password_hash(usuario.senha, senha):
            session['user_id'] = usuario.id
            session['user_nome'] = usuario.nome
            flash('Login realizado com sucesso!')
            return redirect('/produtos')
        else:
            flash('Email ou senha incorretos!')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logout realizado!')
    return redirect('/login')

@app.route('/produtos')
@login_required
def produtos():
    with app.app_context():
        produtos = Produto.query.options(db.joinedload(Produto.proprietario)).all()
    return render_template('produtos.html', produtos=produtos)


@app.route('/produto/<int:id>')
def produto(id):
    """Página de detalhes do produto. Renderiza uma página padrão com informações
    do produto fornecido pelo ID. Permite adicionar ao carrinho usando o helper
    cliente `addToCart(id)` já exposto globalmente em `static/js/app.js`.
    """
    produto = Produto.query.get_or_404(id)
    # Optional: increment view count in DB for analytics
    try:
        produto.visualizacoes = (produto.visualizacoes or 0) + 1
        db.session.commit()
    except Exception:
        db.session.rollback()

    return render_template('produto.html', produto=produto)

@app.route('/perfil')
@login_required
def perfil():
    usuario = Usuario.query.get(session['user_id'])
    
    # Verificar se a foto de perfil existe
    if usuario.foto_perfil:
        foto_path = os.path.join(app.static_folder, 'pic', usuario.foto_perfil)
        if not os.path.exists(foto_path):
            usuario.foto_perfil = 'default.png'
    
    return render_template('perfil.html', usuario=usuario)

@app.route('/sql')
@admin_required
def sql():
    # SQL admin page — only accessible to admin users (enforced by admin_required)
    with app.app_context():
        produtos = Produto.query.all()
        usuarios = Usuario.query.all()
    return render_template('sql.html', produtos=produtos, usuarios=usuarios)

def create_db_and_add_samples():
    with app.app_context():
        db.create_all()

        # Criar usuário de exemplo
        if Usuario.query.count() == 0:
            from werkzeug.security import generate_password_hash
            usuario_exemplo = Usuario(
                nome='Admin',
                email='admin@example.com',
                senha=generate_password_hash('123456'),
                idade=30,
                endereco='Rua Admin, 123',
                telefone='11999999999',
                is_admin=True
            )
            db.session.add(usuario_exemplo)
            db.session.commit()

        # Pegar o ID do primeiro usuário
        primeiro_usuario = Usuario.query.first()
        proprietario_id = primeiro_usuario.id if primeiro_usuario else None

        # Criar categorias de exemplo
        if Categoria.query.count() == 0:
            categorias = [
                # Hardware para PC
                Categoria(nome='Processadores', descricao='CPUs Intel e AMD', cor='#FF6B6B', icone='fas fa-microchip', ordem=1),
                Categoria(nome='Placas de Vídeo', descricao='GPUs NVIDIA e AMD', cor='#4ECDC4', icone='fas fa-palette', ordem=2),
                Categoria(nome='Placas Mãe', descricao='Motherboards para PC', cor='#45B7D1', icone='fas fa-memory', ordem=3),
                Categoria(nome='Memória RAM', descricao='Módulos de memória DDR4/DDR5', cor='#96CEB4', icone='fas fa-memory', ordem=4),
                Categoria(nome='Armazenamento', descricao='SSDs, HDs e NVMe', cor='#FFEAA7', icone='fas fa-hdd', ordem=5),
                Categoria(nome='Fontes', descricao='PSUs para computadores', cor='#DDA0DD', icone='fas fa-plug', ordem=6),
                Categoria(nome='Gabinetes', descricao='Cases para PC', cor='#98D8C8', icone='fas fa-box', ordem=7),
                Categoria(nome='Coolers', descricao='Coolers e sistemas de refrigeração', cor='#F7DC6F', icone='fas fa-fan', ordem=8),

                # Periféricos
                Categoria(nome='Monitores', descricao='Monitores gamer e profissionais', cor='#BB8FCE', icone='fas fa-desktop', ordem=9),
                Categoria(nome='Teclados', descricao='Teclados mecânicos e membrana', cor='#85C1E9', icone='fas fa-keyboard', ordem=10),
                Categoria(nome='Mouses', descricao='Mouses gamer e ergonômicos', cor='#F8C471', icone='fas fa-mouse', ordem=11),
                Categoria(nome='Headsets', descricao='Fones e headsets gamer', cor='#82E0AA', icone='fas fa-headphones', ordem=12),
                Categoria(nome='Mousepads', descricao='Superfícies para mouse', cor='#F1948A', icone='fas fa-square', ordem=13),
                Categoria(nome='Webcams', descricao='Câmeras para streaming', cor='#AED6F1', icone='fas fa-video', ordem=14),

                # Jogos e Entretenimento
                Categoria(nome='Jogos Digitais', descricao='Jogos para PC e consoles', cor='#FF7675', icone='fas fa-gamepad', ordem=15),
                Categoria(nome='Jogos Físicos', descricao='Jogos em mídia física', cor='#74B9FF', icone='fas fa-compact-disc', ordem=16),
                Categoria(nome='Consoles', descricao='PlayStation, Xbox, Nintendo', cor='#A29BFE', icone='fas fa-tv', ordem=17),
                Categoria(nome='Acessórios para Consoles', descricao='Controles, cabos, capas', cor='#FD79A8', icone='fas fa-joystick', ordem=18),

                # Cadeiras e Mobiliário
                Categoria(nome='Cadeiras Gamer', descricao='Cadeiras ergonômicas para jogos', cor='#E17055', icone='fas fa-chair', ordem=19),
                Categoria(nome='Mesas Gamer', descricao='Mesas especiais para setup', cor='#FAB1A0', icone='fas fa-table', ordem=20),

                # Outros
                Categoria(nome='Pré-vendas', descricao='Produtos em pré-venda', cor='#FFC107', icone='fas fa-clock', ordem=21),
                Categoria(nome='Kits Completos', descricao='Computadores prontos', cor='#00BCD4', icone='fas fa-cogs', ordem=22),
                Categoria(nome='Acessórios Diversos', descricao='Cabos, adaptadores, etc.', cor='#9C88FF', icone='fas fa-tools', ordem=23)
            ]
            db.session.add_all(categorias)
            db.session.commit()

@app.route('/api/update_db', methods=['POST'])
@admin_required
def update_db():
    data = request.form
    table = data.get('table')
    id = data.get('id')
    field = data.get('field')
    value = data.get('value')

    try:
        if table == 'produto':
            produto = Produto.query.get(id)
            if produto:
                if field == 'nome':
                    produto.nome = value
                elif field == 'preco':
                    produto.preco = float(value)
                db.session.commit()
                return jsonify({'success': True})
        elif table == 'usuario':
            usuario = Usuario.query.get(id)
            if usuario:
                if field == 'nome':
                    usuario.nome = value
                elif field == 'email':
                    # Verificar se email foi alterado e se já existe
                    if value != usuario.email:
                        if Usuario.query.filter_by(email=value).first():
                            return jsonify({'success': False, 'error': 'Email já cadastrado'})
                    usuario.email = value
                elif field == 'idade':
                    usuario.idade = int(value)
                elif field == 'endereco':
                    usuario.endereco = value
                elif field == 'telefone':
                    usuario.telefone = value
                db.session.commit()
                return jsonify({'success': True})
        
        return jsonify({'success': False, 'error': 'Campo ou registro não encontrado'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/delete_record', methods=['POST'])
@admin_required
def delete_record():
    data = request.form
    table = data.get('table')
    id = data.get('id')

    try:
        if table == 'produto':
            produto = Produto.query.get(id)
            if produto:
                db.session.delete(produto)
                db.session.commit()
                return jsonify({'success': True})
        elif table == 'usuario':
            usuario = Usuario.query.get(id)
            if usuario:
                db.session.delete(usuario)
                db.session.commit()
                return jsonify({'success': True})
        
        return jsonify({'success': False, 'error': 'Registro não encontrado'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/duplicate_record', methods=['POST'])
@admin_required
def duplicate_record():
    data = request.form
    table = data.get('table')
    id = data.get('id')

    try:
        if table == 'produto':
            produto = Produto.query.get(id)
            if produto:
                novo_produto = Produto(
                    nome=produto.nome + ' (Cópia)',
                    preco=produto.preco
                )
                db.session.add(novo_produto)
                db.session.commit()
                return jsonify({'success': True})
        elif table == 'usuario':
            usuario = Usuario.query.get(id)
            if usuario:
                novo_usuario = Usuario(
                    nome=usuario.nome + ' (Cópia)',
                    email=usuario.email.replace('@', '_copy@'),
                    senha=usuario.senha,
                    idade=usuario.idade,
                    endereco=usuario.endereco,
                    telefone=usuario.telefone
                )
                db.session.add(novo_usuario)
                db.session.commit()
                return jsonify({'success': True})
        
        return jsonify({'success': False, 'error': 'Registro não encontrado'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/add_record', methods=['POST'])
@admin_required
def add_record():
    data = request.form
    table = data.get('table')
    record_data = data.get('data')

    try:
        if table == 'produto':
            # Validar campos obrigatórios
            if not record_data.get('nome') or record_data.get('preco') is None:
                return jsonify({'success': False, 'error': 'Nome e preço são obrigatórios'})

            novo_produto = Produto(
                nome=record_data['nome'],
                preco=record_data['preco']
            )
            db.session.add(novo_produto)
            db.session.commit()
            return jsonify({'success': True})

        elif table == 'usuario':
            # Validar campos obrigatórios
            if not record_data.get('nome') or not record_data.get('email') or record_data.get('idade') is None:
                return jsonify({'success': False, 'error': 'Nome, email e idade são obrigatórios'})

            # Verificar se email já existe
            if Usuario.query.filter_by(email=record_data['email']).first():
                return jsonify({'success': False, 'error': 'Email já cadastrado'})

            # Hash da senha (usando uma senha padrão ou gerando uma)
            from werkzeug.security import generate_password_hash
            senha_padrao = '123456'  # Em produção, deveria gerar uma senha aleatória
            hashed_senha = generate_password_hash(senha_padrao)

            novo_usuario = Usuario(
                nome=record_data['nome'],
                email=record_data['email'],
                senha=hashed_senha,
                idade=record_data['idade'],
                endereco=record_data.get('endereco'),
                telefone=record_data.get('telefone')
            )
            db.session.add(novo_usuario)
            db.session.commit()
            return jsonify({'success': True, 'message': f'Usuário criado com senha padrão: {senha_padrao}'})

        return jsonify({'success': False, 'error': 'Tabela não suportada'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/update_perfil', methods=['POST'])
@login_required
def update_perfil():
    try:
        # Accept either JSON or form-encoded payloads from the client
        data = request.get_json(silent=True) or request.form
        # request.form returns an ImmutableMultiDict so get() works the same
        field = data.get('field')
        value = data.get('value')

        usuario = Usuario.query.get(session['user_id'])
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'})

        if field == 'nome':
            if not value or not value.strip():
                return jsonify({'success': False, 'error': 'Nome não pode estar vazio'})
            usuario.nome = value.strip()
        elif field == 'idade':
            # value may be a string (from form) or numeric (from JSON). Normalize:
            try:
                idade = int(value)
            except Exception:
                return jsonify({'success': False, 'error': 'Idade deve ser um número válido'})
            if idade < 0 or idade > 150:
                return jsonify({'success': False, 'error': 'Idade deve estar entre 0 e 150 anos'})
            usuario.idade = idade
        elif field == 'endereco':
            usuario.endereco = value.strip() if value else None
        elif field == 'telefone':
            usuario.telefone = value.strip() if value else None
        else:
            return jsonify({'success': False, 'error': 'Campo não suportado'})

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/profile/photo', methods=['POST'])
@login_required
def update_profile_photo():
    try:
        data = request.form
        foto_perfil = data.get('foto_perfil')

        usuario = Usuario.query.get(session['user_id'])
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'})

        usuario.foto_perfil = foto_perfil
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/upload_profile_photo', methods=['POST'])
@login_required
def upload_profile_photo():
    try:
        if 'photo' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})

        file = request.files['photo']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})

        # Validar tipo de arquivo
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            return jsonify({'success': False, 'error': 'Tipo de arquivo não permitido'})

        # Obter usuário
        usuario = Usuario.query.get(session['user_id'])
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'})

        # Criar nome do arquivo: id.png
        filename = f"{usuario.id}.png"

        # Caminho completo
        pic_dir = os.path.join(app.static_folder, 'pic')
        filepath = os.path.join(pic_dir, filename)

        # Garantir que o diretório existe
        os.makedirs(pic_dir, exist_ok=True)

        # Salvar arquivo
        file.save(filepath)

        # Atualizar foto_perfil no banco
        usuario.foto_perfil = filename
        db.session.commit()

        return jsonify({
            'success': True,
            'filename': filename,
            'photo_url': f"/static/pic/{filename}"
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/upload_product_image/<int:produto_id>', methods=['POST'])
@login_required
def upload_product_image(produto_id):
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})

        # Validar tipo de arquivo
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            return jsonify({'success': False, 'error': 'Tipo de arquivo não permitido'})

        # Validar tamanho (máximo 5MB)
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Seek back to beginning
        if size > 5 * 1024 * 1024:
            return jsonify({'success': False, 'error': 'Arquivo muito grande (máximo 5MB)'})

        # Obter produto
        produto = Produto.query.get(produto_id)
        if not produto:
            return jsonify({'success': False, 'error': 'Produto não encontrado'})

        # Excluir imagem antiga se existir
        if produto.imagem:
            # Remover o prefixo /static/ para obter o caminho relativo
            relative_path = produto.imagem.replace('/static/', '', 1)
            old_filepath = os.path.join(app.static_folder, relative_path)
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception as e:
                    print(f"Erro ao excluir imagem antiga: {e}")

        # Determinar extensão do arquivo
        _, ext = os.path.splitext(file.filename.lower())
        if not ext:
            ext = '.png'  # Default para PNG

        # Criar nome do arquivo baseado no ID do produto
        filename = f"{produto_id}{ext}"

        # Caminho completo
        images_dir = os.path.join(app.static_folder, 'images')
        filepath = os.path.join(images_dir, filename)

        # Garantir que o diretório existe
        os.makedirs(images_dir, exist_ok=True)

        # Salvar arquivo
        file.save(filepath)

        # Atualizar imagem do produto no banco
        produto.imagem = f"/static/images/{filename}"
        db.session.commit()

        return jsonify({
            'success': True,
            'image_path': f"/static/images/{filename}",
            'filename': filename
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/produto', methods=['POST'])
@login_required
def create_produto():
    # Accept either JSON or form-encoded payloads
    data = request.get_json(silent=True) or request.form
    try:
        # Validate presence of nome and preco
        if 'nome' not in data or not data.get('nome'):
            return jsonify({'success': False, 'error': 'Nome é obrigatório'}), 400

        preco_val = data.get('preco')
        # accept numbers or strings
        # Accept numeric strings, ints or floats
        try:
            if preco_val is None or preco_val == '':
                preco = 0.0
            elif isinstance(preco_val, (int, float)):
                preco = float(preco_val)
            else:
                preco = float(str(preco_val).replace(',','.'))
        except Exception:
            return jsonify({'success': False, 'error': 'Preço inválido'}), 400

        novo_produto = Produto(
            nome=data['nome'],
            preco=preco,
            proprietario_id=session['user_id']
        )
        if 'imagem' in data:
            novo_produto.imagem = data['imagem']
        db.session.add(novo_produto)
        db.session.commit()
        return jsonify({'success': True, 'id': novo_produto.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/usuario', methods=['POST'])
def create_usuario():
    # Accept either JSON or form-encoded payloads
    data = request.get_json(silent=True) or request.form
    try:
        # Verificar se email já existe
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email já cadastrado'})
        
        from werkzeug.security import generate_password_hash
        hashed_senha = generate_password_hash(data.get('senha', '123456'))
        
        novo_usuario = Usuario(
            nome=data['nome'],
            email=data['email'],
            senha=hashed_senha,
            idade=int(data['idade'])
        )
        if 'endereco' in data:
            novo_usuario.endereco = data['endereco']
        if 'telefone' in data:
            novo_usuario.telefone = data['telefone']
        # Favorites field removed from user creation payload — handled internally if needed

            
        db.session.add(novo_usuario)
        db.session.commit()
        return jsonify({'success': True, 'id': novo_usuario.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/produto/<int:id>', methods=['PUT'])
def update_produto(id):
    data = request.get_json(silent=True) or request.form
    try:
        produto = Produto.query.get(id)
        if not produto:
            return jsonify({'success': False, 'error': 'Produto não encontrado'})
        
        if 'nome' in data and data.get('nome') is not None:
            produto.nome = data['nome']
        if 'preco' in data:
            preco_val = data.get('preco')
            try:
                if preco_val is None or preco_val == '':
                    produto.preco = 0.0
                elif isinstance(preco_val, (int, float)):
                    produto.preco = float(preco_val)
                else:
                    produto.preco = float(str(preco_val).replace(',','.'))
            except Exception:
                return jsonify({'success': False, 'error': 'Preço inválido'}), 400
        if 'imagem' in data:
            produto.imagem = data['imagem']
            
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/produto/<int:id>', methods=['DELETE'])
def delete_produto(id):
    try:
        produto = Produto.query.get(id)
        if not produto:
            return jsonify({'success': False, 'error': 'Produto não encontrado'})

        # Excluir registros relacionados antes de excluir o produto
        # (favorites removed) no longer deleting favorites entries

        # Excluir avaliações relacionadas ao produto
        Avaliacao.query.filter_by(produto_id=id).delete()

        # Excluir visualizações relacionadas ao produto (se existir)
        try:
            Visualizacao.query.filter_by(produto_id=id).delete()
        except:
            pass  # Tabela pode não existir

        # Excluir imagem física se existir
        if produto.imagem and produto.imagem.startswith('/static/images/'):
            # Remover o prefixo /static/ para obter o caminho relativo
            relative_path = produto.imagem.replace('/static/', '', 1)
            image_path = os.path.join(app.static_folder, relative_path)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Erro ao excluir imagem {image_path}: {e}")

        db.session.delete(produto)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/usuario/<int:id>', methods=['PUT'])
def update_usuario(id):
    data = request.get_json(silent=True) or request.form
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'})
        
        if 'nome' in data:
            usuario.nome = data['nome']
        if 'email' in data:
            # Verificar se email foi alterado e se já existe
            if data['email'] != usuario.email:
                if Usuario.query.filter_by(email=data['email']).first():
                    return jsonify({'success': False, 'error': 'Email já cadastrado'})
            usuario.email = data['email']
        if 'idade' in data:
            usuario.idade = int(data['idade'])
        if 'endereco' in data:
            usuario.endereco = data['endereco']
        if 'telefone' in data:
            usuario.telefone = data['telefone']
        # Favorites are not editable via this endpoint (removed from admin/UI)

            
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/usuario/<int:id>', methods=['DELETE'])
def delete_usuario(id):
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'})
        
        # Deletar registros relacionados antes de deletar o usuário
        # Deletar avaliações do usuário
        Avaliacao.query.filter_by(usuario_id=id).delete()
        
        # (favorites removed) no longer deleting favorites entries
        
        # Deletar visualizações do usuário
        Visualizacao.query.filter_by(usuario_id=id).delete()
        
        # IMPORTANTE: NÃO deletar produtos do usuário automaticamente
        # Os produtos ficam órfãos (proprietario_id = None) ou podem ser reatribuídos
        
        # Deletar newsletter inscrições
        Newsletter.query.filter_by(email=usuario.email).delete()
        
        # Agora pode deletar o usuário
        db.session.delete(usuario)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/tables')
@admin_required
def api_tables():
    with app.app_context():
        produtos = Produto.query.all()
        usuarios = Usuario.query.all()
    
    # Converter para dict
    produtos_data = [{'id': p.id, 'nome': p.nome, 'preco': p.preco, 'imagem': p.imagem, 'proprietario_id': p.proprietario_id} for p in produtos]
    usuarios_data = [{'id': u.id, 'nome': u.nome, 'email': u.email, 'senha': u.senha, 'idade': u.idade, 'endereco': u.endereco, 'telefone': u.telefone, 'foto_perfil': u.foto_perfil} for u in usuarios]
    
    tables = {
        'produto': produtos_data,
        'usuario': usuarios_data
    }
    return jsonify(tables)

@app.route('/adicionar_produto', methods=['GET', 'POST'])
@login_required
def adicionar_produto():
    if request.method == 'POST':
        nome = request.form['nome']
        preco = float(request.form['preco'])
        categoria_id = request.form['categoria_id']  # Agora obrigatório
        descricao = request.form.get('descricao', '')

        # Processar upload de imagem
        imagem_path = '/static/images/placeholder.jpeg'  # Padrão
        if 'imagem' in request.files:
            file = request.files['imagem']
            if file.filename != '':
                # Validar tipo de arquivo
                if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                    flash('Tipo de arquivo não permitido. Use apenas PNG, JPG, JPEG, GIF ou WebP.')
                    return redirect('/adicionar_produto')

                # Validar tamanho (máximo 5MB)
                file.seek(0, 2)
                size = file.tell()
                file.seek(0)
                if size > 5 * 1024 * 1024:
                    flash('Arquivo muito grande. Máximo 5MB permitido.')
                    return redirect('/adicionar_produto')

                # Determinar extensão
                _, ext = os.path.splitext(file.filename.lower())
                if not ext:
                    ext = '.png'

                # Gerar nome único baseado no timestamp e ID do usuário
                import time
                filename = f"{int(time.time())}_{session['user_id']}{ext}"
                filepath = os.path.join(app.static_folder, 'images', filename)

                # Garantir que o diretório existe
                os.makedirs(os.path.dirname(filepath), exist_ok=True)

                # Salvar arquivo
                file.save(filepath)
                imagem_path = f"/static/images/{filename}"

        novo_produto = Produto(
            nome=nome,
            preco=preco,
            proprietario_id=session['user_id'],
            descricao=descricao,
            imagem=imagem_path
        )

        # Categoria agora é obrigatória
        categoria = Categoria.query.get(int(categoria_id))
        if categoria:
            novo_produto.categorias.append(categoria)

        db.session.add(novo_produto)
        db.session.commit()

        flash('Produto adicionado com sucesso!')
        return redirect('/produtos')

    # GET request - mostrar formulário
    categorias = Categoria.query.all()
    return render_template('adicionar_produto.html', categorias=categorias)

@app.route('/api/usuario/<int:id>', methods=['PUT'])
def api_usuario_update(id):
    try:
        usuario = Usuario.query.get_or_404(id)
        data = request.form
        
        # Atualizar campos permitidos
        for field in ['nome', 'email', 'idade', 'endereco', 'telefone', 'foto_perfil', 'favoritos']:
            if field in data:
                setattr(usuario, field, data[field])
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/produto/<int:id>', methods=['PUT'])
def api_produto_update(id):
    try:
        produto = Produto.query.get_or_404(id)
        data = request.form
        
        # Atualizar campos permitidos
        for field in ['nome', 'preco', 'imagem', 'proprietario_id']:
            if field in data:
                setattr(produto, field, data[field])
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    create_db_and_add_samples()
    app.run(debug=True)