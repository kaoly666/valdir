# models/visualizacao.py
# Sistema de Histórico de Visualizações

from extensions import db
from datetime import datetime

class Visualizacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    data_visualizacao = db.Column(db.DateTime, default=datetime.utcnow)
    tempo_visualizacao = db.Column(db.Integer, default=0)  # em segundos

    # Relacionamentos
    usuario = db.relationship('Usuario', backref=db.backref('historico_visualizacoes', lazy='dynamic'))
    produto = db.relationship('Produto', backref=db.backref('registros_visualizacao', lazy='dynamic'))

    def __repr__(self):
        return f'<Visualizacao {self.usuario.nome} -> {self.produto.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'produto_id': self.produto_id,
            'data_visualizacao': self.data_visualizacao.isoformat() if self.data_visualizacao else None,
            'tempo_visualizacao': self.tempo_visualizacao,
            'produto': self.produto.to_dict() if self.produto else None
        }