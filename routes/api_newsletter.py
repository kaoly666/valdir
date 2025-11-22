# routes/api_newsletter.py
# API para Sistema de Newsletter

from flask import Blueprint, request, jsonify
from extensions import db
from models.newsletter import Newsletter
import re

api_newsletter = Blueprint('api_newsletter', __name__, url_prefix='/api/newsletter')

def validar_email(email):
    """Valida formato do email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@api_newsletter.route('/', methods=['POST'])
def inscrever():
    """Inscreve email na newsletter"""
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email é obrigatório'}), 400

    email = data['email'].strip().lower()

    # Validar email
    if not validar_email(email):
        return jsonify({'error': 'Email inválido'}), 400

    # Verificar se já está inscrito
    existing = Newsletter.query.filter_by(email=email).first()
    if existing:
        if existing.ativo:
            return jsonify({'error': 'Email já inscrito'}), 400
        else:
            # Reativar inscrição
            existing.ativo = True
            existing.nome = data.get('nome', existing.nome)
            existing.fonte = data.get('fonte', 'reativacao')
            db.session.commit()
            return jsonify({'success': True, 'message': 'Inscrição reativada'})

    # Criar nova inscrição
    inscricao = Newsletter(
        email=email,
        nome=data.get('nome'),
        fonte=data.get('fonte', 'site'),
        receber_promocoes=data.get('receber_promocoes', True),
        receber_novidades=data.get('receber_novidades', True),
        receber_dicas=data.get('receber_dicas', False)
    )

    db.session.add(inscricao)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Inscrição realizada com sucesso'}), 201

@api_newsletter.route('/<int:id>', methods=['PUT'])
def atualizar_preferencias(id):
    """Atualiza preferências de um inscrito"""
    inscricao = Newsletter.query.get(id)
    if not inscricao:
        return jsonify({'error': 'Inscrição não encontrada'}), 404

    data = request.get_json()

    if 'receber_promocoes' in data:
        inscricao.receber_promocoes = data['receber_promocoes']
    if 'receber_novidades' in data:
        inscricao.receber_novidades = data['receber_novidades']
    if 'receber_dicas' in data:
        inscricao.receber_dicas = data['receber_dicas']
    if 'nome' in data:
        inscricao.nome = data['nome']

    db.session.commit()
    return jsonify(inscricao.to_dict())

@api_newsletter.route('/cancelar', methods=['POST'])
def cancelar():
    """Cancela inscrição"""
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email é obrigatório'}), 400

    email = data['email'].strip().lower()
    inscricao = Newsletter.query.filter_by(email=email).first()

    if not inscricao:
        return jsonify({'error': 'Email não encontrado'}), 404

    inscricao.ativo = False
    db.session.commit()

    return jsonify({'success': True, 'message': 'Inscrição cancelada'})

@api_newsletter.route('/reativar', methods=['POST'])
def reativar():
    """Reativa inscrição cancelada"""
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email é obrigatório'}), 400

    email = data['email'].strip().lower()
    inscricao = Newsletter.query.filter_by(email=email).first()

    if not inscricao:
        return jsonify({'error': 'Email não encontrado'}), 404

    if inscricao.ativo:
        return jsonify({'error': 'Inscrição já está ativa'}), 400

    inscricao.ativo = True
    db.session.commit()

    return jsonify({'success': True, 'message': 'Inscrição reativada'})

@api_newsletter.route('/stats', methods=['GET'])
def get_stats():
    """Estatísticas da newsletter"""
    total = Newsletter.query.count()
    ativos = Newsletter.query.filter_by(ativo=True).count()
    inativos = total - ativos

    return jsonify({
        'total': total,
        'ativos': ativos,
        'inativos': inativos,
        'taxa_atividade': round((ativos / total * 100), 1) if total > 0 else 0
    })