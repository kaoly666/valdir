# models/newsletter.py
# Sistema de Newsletter

from extensions import db
from datetime import datetime

class Newsletter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    nome = db.Column(db.String(100))
    ativo = db.Column(db.Boolean, default=True)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    fonte = db.Column(db.String(50), default='site')  # site, popup, footer, etc.

    # Preferências
    receber_promocoes = db.Column(db.Boolean, default=True)
    receber_novidades = db.Column(db.Boolean, default=True)
    receber_dicas = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Newsletter {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'nome': self.nome,
            'ativo': self.ativo,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None,
            'fonte': self.fonte,
            'receber_promocoes': self.receber_promocoes,
            'receber_novidades': self.receber_novidades,
            'receber_dicas': self.receber_dicas
        }