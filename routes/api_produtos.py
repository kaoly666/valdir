# routes/api_produtos.py
# Objetivo: Criar as rotas da API para Produtos (CRUD).
#
# Requisitos:
# 1. Importar Blueprint, request, jsonify, a instância 'db' de 'app.py' e o modelo 'Produto' de '../models/produto.py'.
# 2. Criar um Blueprint chamado 'api_produtos' com prefixo '/api/produtos'.
# 3. Criar uma rota GET ('/') para listar **todos** os produtos, retornando a lista de dicionários usando o método to_dict.
# 4. Criar uma rota POST ('/') para adicionar um novo produto, recebendo 'nome' e 'preco' do request.json, salvando no banco de dados e retornando o novo produto em JSON.
# 5. Incluir tratamento de erro 400 se faltarem dados no POST.

from flask import Blueprint, request, jsonify
from extensions import db
from models.produto import Produto

api_produtos = Blueprint('api_produtos', __name__, url_prefix='/api/produtos')

@api_produtos.route('/', methods=['GET'])
def get_produtos():
    produtos = Produto.query.all()
    return jsonify([produto.to_dict() for produto in produtos])

@api_produtos.route('/', methods=['POST'])
def add_produto():
    data = request.get_json(silent=True) or request.form
    if not data or ('nome' not in data and not data.get('nome')) or ('preco' not in data and not data.get('preco')):
        return jsonify({'error': 'Nome e preco são obrigatórios'}), 400

    nome = data.get('nome')
    preco_val = data.get('preco')
    try:
        preco = float(preco_val) if preco_val is not None and preco_val != '' else 0.0
    except Exception:
        return jsonify({'error': 'Preço inválido'}), 400

    novo_produto = Produto(nome=nome, preco=preco)
    db.session.add(novo_produto)
    db.session.commit()
    return jsonify(novo_produto.to_dict()), 201