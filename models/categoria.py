# models/categoria.py
# Sistema de Categorias para organizar produtos

from extensions import db

class Categoria(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), unique=True, nullable=False)
    descricao = db.Column(db.String(200))
    cor = db.Column(db.String(7), default='#007bff')  # Cor em hex para UI
    icone = db.Column(db.String(50), default='fas fa-tag')  # Classe do FontAwesome
    ordem = db.Column(db.Integer, default=0)  # Para ordenação

    # Relacionamento many-to-many com produtos
    produtos = db.relationship('Produto', secondary='produto_categoria',
                              backref=db.backref('categorias', lazy='dynamic'))

    def __repr__(self):
        return f'<Categoria {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'cor': self.cor,
            'icone': self.icone,
            'ordem': self.ordem,
            'produtos_count': len(self.produtos) if self.produtos else 0
        }

# Tabela de relacionamento many-to-many entre Produto e Categoria
produto_categoria = db.Table('produto_categoria',
    db.Column('produto_id', db.Integer, db.ForeignKey('produto.id'), primary_key=True),
    db.Column('categoria_id', db.Integer, db.ForeignKey('categoria.id'), primary_key=True)
)