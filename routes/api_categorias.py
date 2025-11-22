# routes/api_categorias.py
# API para Sistema de Categorias

from flask import Blueprint, request, jsonify
from extensions import db
from models.categoria import Categoria
from models.produto import Produto

api_categorias = Blueprint('api_categorias', __name__, url_prefix='/api/categorias')

@api_categorias.route('/', methods=['GET'])
def get_categorias():
    """Lista todas as categorias"""
    categorias = Categoria.query.order_by(Categoria.ordem).all()
    return jsonify([categoria.to_dict() for categoria in categorias])

@api_categorias.route('/', methods=['POST'])
def create_categoria():
    """Cria uma nova categoria"""
    data = request.get_json()
    if not data or 'nome' not in data:
        return jsonify({'error': 'Nome é obrigatório'}), 400

    # Verificar se já existe
    if Categoria.query.filter_by(nome=data['nome']).first():
        return jsonify({'error': 'Categoria já existe'}), 400

    categoria = Categoria(
        nome=data['nome'],
        descricao=data.get('descricao'),
        cor=data.get('cor', '#007bff'),
        icone=data.get('icone', 'fas fa-tag'),
        ordem=data.get('ordem', 0)
    )

    db.session.add(categoria)
    db.session.commit()

    return jsonify(categoria.to_dict()), 201

@api_categorias.route('/<int:id>', methods=['PUT'])
def update_categoria(id):
    """Atualiza uma categoria"""
    categoria = Categoria.query.get(id)
    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404

    data = request.get_json()
    if 'nome' in data:
        # Verificar se nome já existe (exceto para esta categoria)
        existing = Categoria.query.filter_by(nome=data['nome']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Nome já existe'}), 400
        categoria.nome = data['nome']

    if 'descricao' in data:
        categoria.descricao = data['descricao']
    if 'cor' in data:
        categoria.cor = data['cor']
    if 'icone' in data:
        categoria.icone = data['icone']
    if 'ordem' in data:
        categoria.ordem = data['ordem']

    db.session.commit()
    return jsonify(categoria.to_dict())

@api_categorias.route('/<int:id>', methods=['DELETE'])
def delete_categoria(id):
    """Remove uma categoria"""
    categoria = Categoria.query.get(id)
    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404

    db.session.delete(categoria)
    db.session.commit()
    return jsonify({'success': True})

@api_categorias.route('/<int:id>/produtos', methods=['GET'])
def get_categoria_produtos(id):
    """Lista produtos de uma categoria"""
    categoria = Categoria.query.get(id)
    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404

    produtos = categoria.produtos
    return jsonify([produto.to_dict() for produto in produtos])

@api_categorias.route('/<int:categoria_id>/produtos/<int:produto_id>', methods=['POST'])
def add_produto_categoria(categoria_id, produto_id):
    """Adiciona produto a uma categoria"""
    categoria = Categoria.query.get(categoria_id)
    produto = Produto.query.get(produto_id)

    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    if produto not in categoria.produtos:
        categoria.produtos.append(produto)
        db.session.commit()

    return jsonify({'success': True})

@api_categorias.route('/<int:categoria_id>/produtos/<int:produto_id>', methods=['DELETE'])
def remove_produto_categoria(categoria_id, produto_id):
    """Remove produto de uma categoria"""
    categoria = Categoria.query.get(categoria_id)
    produto = Produto.query.get(produto_id)

    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    if produto in categoria.produtos:
        categoria.produtos.remove(produto)
        db.session.commit()

    return jsonify({'success': True})