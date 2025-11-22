# routes/api_busca.py
# API para Sistema de Busca e Filtros

from flask import Blueprint, request, jsonify
from extensions import db
from models.produto import Produto
from models.categoria import Categoria
from sqlalchemy import or_, and_, func
import json

api_busca = Blueprint('api_busca', __name__, url_prefix='/api/busca')

@api_busca.route('/produtos', methods=['GET'])
def buscar_produtos():
    """Busca e filtra produtos"""
    # Parâmetros de busca
    query = request.args.get('q', '').strip()
    categoria_id = request.args.get('categoria_id', type=int)
    preco_min = request.args.get('preco_min', type=float)
    preco_max = request.args.get('preco_max', type=float)
    ordenacao = request.args.get('ordenacao', 'nome')  # nome, preco_asc, preco_desc, recentes, populares
    pagina = request.args.get('pagina', 1, type=int)
    por_pagina = request.args.get('por_pagina', 12, type=int)

    # Base query
    produtos_query = Produto.query.filter_by(ativo=True)

    # Filtro de texto
    if query:
        produtos_query = produtos_query.filter(
            or_(
                Produto.nome.ilike(f'%{query}%'),
                Produto.descricao.ilike(f'%{query}%')
            )
        )

    # Filtro de categoria
    if categoria_id:
        categoria = Categoria.query.get(categoria_id)
        if categoria:
            produtos_query = produtos_query.filter(
                Produto.categorias.any(Categoria.id == categoria_id)
            )

    # Filtro de preço
    if preco_min is not None:
        produtos_query = produtos_query.filter(Produto.preco >= preco_min)
    if preco_max is not None:
        produtos_query = produtos_query.filter(Produto.preco <= preco_max)

    # Ordenação
    if ordenacao == 'preco_asc':
        produtos_query = produtos_query.order_by(Produto.preco.asc())
    elif ordenacao == 'preco_desc':
        produtos_query = produtos_query.order_by(Produto.preco.desc())
    elif ordenacao == 'recentes':
        produtos_query = produtos_query.order_by(Produto.data_criacao.desc())
    elif ordenacao == 'populares':
        produtos_query = produtos_query.order_by(Produto.visualizacoes.desc())
    else:  # nome
        produtos_query = produtos_query.order_by(Produto.nome.asc())

    # Paginação
    total = produtos_query.count()
    produtos = produtos_query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    # Estatísticas
    stats = {
        'total': total,
        'paginas': (total + por_pagina - 1) // por_pagina,
        'pagina_atual': pagina,
        'por_pagina': por_pagina
    }

    # Faixas de preço disponíveis
    precos = db.session.query(
        func.min(Produto.preco).label('min'),
        func.max(Produto.preco).label('max')
    ).filter(Produto.ativo == True).first()

    faixas_preco = {
        'min': precos.min or 0,
        'max': precos.max or 0
    }

    return jsonify({
        'produtos': [produto.to_dict() for produto in produtos],
        'stats': stats,
        'faixas_preco': faixas_preco,
        'filtros_aplicados': {
            'query': query,
            'categoria_id': categoria_id,
            'preco_min': preco_min,
            'preco_max': preco_max,
            'ordenacao': ordenacao
        }
    })

@api_busca.route('/sugestoes', methods=['GET'])
def sugestoes_busca():
    """Sugestões de busca baseadas em produtos existentes"""
    query = request.args.get('q', '').strip()
    limite = request.args.get('limite', 5, type=int)

    if not query or len(query) < 2:
        return jsonify([])

    # Buscar produtos que contenham a query
    produtos = Produto.query.filter(
        and_(
            Produto.ativo == True,
            or_(
                Produto.nome.ilike(f'%{query}%'),
                Produto.descricao.ilike(f'%{query}%')
            )
        )
    ).limit(limite).all()

    sugestoes = []
    for produto in produtos:
        # Destacar o texto encontrado
        nome_destacado = produto.nome.replace(query, f'<mark>{query}</mark>')
        sugestoes.append({
            'id': produto.id,
            'nome': produto.nome,
            'nome_destacado': nome_destacado,
            'preco': produto.preco,
            'imagem': produto.imagem
        })

    return jsonify(sugestoes)

@api_busca.route('/autocomplete', methods=['GET'])
def autocomplete():
    """Autocomplete para busca"""
    query = request.args.get('q', '').strip()
    limite = request.args.get('limite', 10, type=int)

    if not query or len(query) < 1:
        return jsonify([])

    # Buscar nomes de produtos que começam com a query
    produtos = Produto.query.filter(
        and_(
            Produto.ativo == True,
            Produto.nome.ilike(f'{query}%')
        )
    ).order_by(Produto.nome).limit(limite).all()

    resultados = [produto.nome for produto in produtos]
    return jsonify(resultados)

@api_busca.route('/destaques', methods=['GET'])
def produtos_destaques():
    """Produtos em destaque"""
    produtos = Produto.query.filter_by(
        ativo=True,
        destaque=True
    ).order_by(Produto.data_criacao.desc()).limit(8).all()

    return jsonify([produto.to_dict() for produto in produtos])

@api_busca.route('/populares', methods=['GET'])
def produtos_populares():
    """Produtos mais visualizados"""
    produtos = Produto.query.filter_by(ativo=True)\
                           .order_by(Produto.visualizacoes.desc())\
                           .limit(8).all()

    return jsonify([produto.to_dict() for produto in produtos])

@api_busca.route('/recomendados/<int:produto_id>', methods=['GET'])
def produtos_recomendados(produto_id):
    """Produtos recomendados baseados em um produto"""
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify([])

    # Recomendação simples: produtos da mesma categoria ou faixa de preço
    recomendados = Produto.query.filter(
        and_(
            Produto.ativo == True,
            Produto.id != produto_id,
            or_(
                Produto.preco.between(produto.preco * 0.8, produto.preco * 1.2),
                Produto.categorias.any(Categoria.id.in_(
                    [c.id for c in produto.categorias]
                )) if hasattr(produto, 'categorias') and produto.categorias else False
            )
        )
    ).order_by(Produto.visualizacoes.desc()).limit(4).all()

    return jsonify([p.to_dict() for p in recomendados])