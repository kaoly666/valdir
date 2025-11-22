# models/produto.py
# Objetivo: Definir o modelo Produto para o SQLAlchemy.
#
# Requisitos:
# 1. Importar a instância 'db' de 'app.py' (Assuma que ela existe).
# 2. Definir a classe 'Produto' que herda de db.Model.
# 3. A classe deve ter as colunas: 'id' (Integer, Primary Key), 'nome' (String, 80 caracteres, Unique, Not Null) e 'preco' (Float, Not Null).
# 4. Incluir um método '__repr__' para representação amigável do objeto.
# 5. Incluir um método 'to_dict' que retorna os dados do produto em formato de dicionário para serialização JSON.

from extensions import db
from datetime import datetime

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(80), unique=True, nullable=False)
    preco = db.Column(db.Float, nullable=False)
    descricao = db.Column(db.Text)
    imagem = db.Column(db.String(255), nullable=True)  # Imagem principal
    imagens = db.Column(db.Text)  # JSON com lista de imagens adicionais
    proprietario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    destaque = db.Column(db.Boolean, default=False)  # Produto em destaque
    ativo = db.Column(db.Boolean, default=True)  # Produto ativo/inativo
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    visualizacoes = db.Column(db.Integer, default=0)  # Contador de visualizações

    # Relacionamento com Usuario
    proprietario = db.relationship('Usuario', backref='produtos', lazy=True)

    def __repr__(self):
        return f'<Produto {self.nome}>'

    def to_dict(self):
        # Parse das imagens adicionais
        imagens_lista = []
        if self.imagens:
            try:
                import json
                imagens_lista = json.loads(self.imagens)
            except:
                imagens_lista = []

        return {
            'id': self.id,
            'nome': self.nome,
            'preco': self.preco,
            'descricao': self.descricao,
            'imagem': self.imagem,
            'imagens': imagens_lista,
            'proprietario_id': self.proprietario_id,
            'destaque': self.destaque,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'visualizacoes': self.visualizacoes,
            'proprietario': self.proprietario.to_dict() if self.proprietario else None,
            'media_avaliacao': self.get_media_avaliacao(),
            'total_avaliacoes': self.get_total_avaliacoes()
        }

    def get_media_avaliacao(self):
        """Retorna a média das avaliações"""
        if not hasattr(self, 'avaliacoes') or not self.avaliacoes:
            return 0
        avaliacoes = self.avaliacoes.all()
        if not avaliacoes:
            return 0
        return round(sum(a.nota for a in avaliacoes) / len(avaliacoes), 1)

    def get_total_avaliacoes(self):
        """Retorna o total de avaliações"""
        if not hasattr(self, 'avaliacoes') or not self.avaliacoes:
            return 0
        return self.avaliacoes.count()