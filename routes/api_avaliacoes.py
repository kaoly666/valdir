# routes/api_avaliacoes.py
# API para Sistema de Avaliações

from flask import Blueprint, request, jsonify, session
from extensions import db
from models.avaliacao import Avaliacao
from models.produto import Produto
from models.usuario import Usuario
from utils import login_required

api_avaliacoes = Blueprint('api_avaliacoes', __name__, url_prefix='/api/avaliacoes')

@api_avaliacoes.route('/produto/<int:produto_id>', methods=['GET'])
def get_avaliacoes_produto(produto_id):
    """Lista avaliações de um produto"""
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    avaliacoes = Avaliacao.query.filter_by(produto_id=produto_id)\
                               .order_by(Avaliacao.data_criacao.desc()).all()

    return jsonify([avaliacao.to_dict() for avaliacao in avaliacoes])

@api_avaliacoes.route('/', methods=['POST'])
@login_required
def create_avaliacao():
    """Cria uma nova avaliação"""
    user = Usuario.query.get(session['user_id'])
    data = request.get_json()
    if not data or 'produto_id' not in data or 'nota' not in data:
        return jsonify({'error': 'produto_id e nota são obrigatórios'}), 400

    produto_id = data['produto_id']
    nota = data['nota']

    # Validar nota
    if nota < 1 or nota > 5:
        return jsonify({'error': 'Nota deve ser entre 1 e 5'}), 400

    # Verificar se produto existe
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    # Verificar se usuário já avaliou este produto
    existing = Avaliacao.query.filter_by(
        produto_id=produto_id,
        usuario_id=user.id
    ).first()

    if existing:
        return jsonify({'error': 'Você já avaliou este produto'}), 400

    avaliacao = Avaliacao(
        produto_id=produto_id,
        usuario_id=user.id,
        nota=nota,
        comentario=data.get('comentario')
    )

    db.session.add(avaliacao)
    db.session.commit()

    return jsonify(avaliacao.to_dict()), 201

@api_avaliacoes.route('/<int:id>', methods=['PUT'])
@login_required
def update_avaliacao(id):
    """Atualiza uma avaliação"""
    user = Usuario.query.get(session['user_id'])
    avaliacao = Avaliacao.query.get(id)
    if not avaliacao:
        return jsonify({'error': 'Avaliação não encontrada'}), 404

    # Verificar se é o dono da avaliação
    if avaliacao.usuario_id != user.id:
        return jsonify({'error': 'Acesso negado'}), 403

    data = request.get_json()
    if 'nota' in data:
        nota = data['nota']
        if nota < 1 or nota > 5:
            return jsonify({'error': 'Nota deve ser entre 1 e 5'}), 400
        avaliacao.nota = nota

    if 'comentario' in data:
        avaliacao.comentario = data['comentario']

    db.session.commit()
    return jsonify(avaliacao.to_dict())

@api_avaliacoes.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_avaliacao(id):
    """Remove uma avaliação"""
    user = Usuario.query.get(session['user_id'])
    avaliacao = Avaliacao.query.get(id)
    if not avaliacao:
        return jsonify({'error': 'Avaliação não encontrada'}), 404

    # Verificar se é o dono da avaliação
    if avaliacao.usuario_id != user.id:
        return jsonify({'error': 'Acesso negado'}), 403

    db.session.delete(avaliacao)
    db.session.commit()
    return jsonify({'success': True})

@api_avaliacoes.route('/<int:id>/util', methods=['POST'])
@login_required
def marcar_util(id):
    """Marca avaliação como útil"""
    avaliacao = Avaliacao.query.get(id)
    if not avaliacao:
        return jsonify({'error': 'Avaliação não encontrada'}), 404

    avaliacao.util += 1
    db.session.commit()

    return jsonify({'success': True, 'util': avaliacao.util})