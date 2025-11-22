# models/avaliacao.py
# Sistema de Avaliações e Reviews

from extensions import db
from datetime import datetime

class Avaliacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    nota = db.Column(db.Integer, nullable=False)  # 1-5 estrelas
    comentario = db.Column(db.Text)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    util = db.Column(db.Integer, default=0)  # Votos de "útil"

    # Relacionamentos
    produto = db.relationship('Produto', backref=db.backref('avaliacoes', lazy='dynamic'))
    usuario = db.relationship('Usuario', backref=db.backref('avaliacoes', lazy='dynamic'))

    # Constraints
    __table_args__ = (
        db.UniqueConstraint('produto_id', 'usuario_id', name='unique_usuario_produto_avaliacao'),
    )

    def __repr__(self):
        return f'<Avaliacao {self.usuario.nome} -> {self.produto.nome}: {self.nota}★>'

    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'usuario_id': self.usuario_id,
            'nota': self.nota,
            'comentario': self.comentario,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'util': self.util,
            'usuario': {
                'id': self.usuario.id,
                'nome': self.usuario.nome,
                'foto_perfil': self.usuario.foto_perfil
            }
        }