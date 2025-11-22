# routes/api_visualizacoes.py
# API para Sistema de Visualizações

from flask import Blueprint, request, jsonify, session
from extensions import db
from models.visualizacao import Visualizacao
from models.produto import Produto
from models.usuario import Usuario
from utils import login_required
from datetime import datetime, timedelta

api_visualizacoes = Blueprint('api_visualizacoes', __name__, url_prefix='/api/visualizacoes')

@api_visualizacoes.route('/', methods=['GET'])
@login_required
def get_visualizacoes():
    """Lista visualizações recentes do usuário"""
    user = Usuario.query.get(session['user_id'])
    # Últimas 50 visualizações
    visualizacoes = Visualizacao.query.filter_by(usuario_id=user.id)\
                                     .order_by(Visualizacao.data_visualizacao.desc())\
                                     .limit(50).all()

    return jsonify([visualizacao.to_dict() for visualizacao in visualizacoes])

@api_visualizacoes.route('/produto/<int:produto_id>', methods=['POST'])
@login_required
def registrar_visualizacao(produto_id):
    """Registra visualização de um produto"""
    user = Usuario.query.get(session['user_id'])
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    # Verificar se já visualizou recentemente (nos últimos 30 minutos)
    recente = Visualizacao.query.filter_by(
        usuario_id=user.id,
        produto_id=produto_id
    ).filter(
        Visualizacao.data_visualizacao > datetime.utcnow() - timedelta(minutes=30)
    ).first()

    if recente:
        # Atualizar tempo de visualização
        data = request.get_json() or {}
        tempo = data.get('tempo', 0)
        recente.tempo_visualizacao += tempo
        db.session.commit()
        return jsonify({'success': True, 'action': 'updated'})
    else:
        # Criar nova visualização
        data = request.get_json() or {}
        tempo = data.get('tempo', 0)

        visualizacao = Visualizacao(
            usuario_id=user.id,
            produto_id=produto_id,
            tempo_visualizacao=tempo
        )

        db.session.add(visualizacao)

        # Incrementar contador de visualizações do produto
        produto.visualizacoes += 1

        db.session.commit()
        return jsonify({'success': True, 'action': 'created'})

@api_visualizacoes.route('/recentes', methods=['GET'])
@login_required
def get_recentes():
    """Produtos visualizados recentemente (últimos 7 dias)"""
    user = Usuario.query.get(session['user_id'])
    semana_atras = datetime.utcnow() - timedelta(days=7)

    # Agrupar por produto e pegar a mais recente de cada
    subquery = db.session.query(
        Visualizacao.produto_id,
        db.func.max(Visualizacao.data_visualizacao).label('ultima_visualizacao')
    ).filter(
        Visualizacao.usuario_id == user.id,
        Visualizacao.data_visualizacao > semana_atras
    ).group_by(Visualizacao.produto_id).subquery()

    visualizacoes = db.session.query(Visualizacao)\
        .join(subquery, db.and_(
            Visualizacao.produto_id == subquery.c.produto_id,
            Visualizacao.data_visualizacao == subquery.c.ultima_visualizacao
        ))\
        .order_by(Visualizacao.data_visualizacao.desc())\
        .limit(20).all()

    return jsonify([v.to_dict() for v in visualizacoes])

@api_visualizacoes.route('/limpar', methods=['DELETE'])
@login_required
def limpar_historico():
    """Remove todo histórico de visualizações do usuário"""
    user = Usuario.query.get(session['user_id'])
    Visualizacao.query.filter_by(usuario_id=user.id).delete()
    db.session.commit()
    return jsonify({'success': True})

@api_visualizacoes.route('/tempo/<int:produto_id>', methods=['PUT'])
@login_required
def atualizar_tempo(produto_id):
    """Atualiza tempo de visualização"""
    user = Usuario.query.get(session['user_id'])
    data = request.get_json()
    tempo_adicional = data.get('tempo', 0)

    visualizacao = Visualizacao.query.filter_by(
        usuario_id=user.id,
        produto_id=produto_id
    ).order_by(Visualizacao.data_visualizacao.desc()).first()

    if visualizacao:
        visualizacao.tempo_visualizacao += tempo_adicional
        db.session.commit()
        return jsonify({'success': True})

    return jsonify({'error': 'Visualização não encontrada'}), 404