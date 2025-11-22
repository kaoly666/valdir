from extensions import db
import json
from flask_login import UserMixin

class Usuario(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    idade = db.Column(db.Integer, nullable=False)
    endereco = db.Column(db.String(200))
    telefone = db.Column(db.String(20))
    foto_perfil = db.Column(db.String(255), default='default.png')
    is_admin = db.Column(db.Boolean, default=False)
    # Campo para armazenar lista de IDs de produtos favoritos como JSON
    favoritos = db.Column(db.Text, default='[]')

    def __repr__(self):
        return f'<Usuario {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'idade': self.idade,
            'endereco': self.endereco,
            'telefone': self.telefone,
            'foto_perfil': self.foto_perfil,
            'is_admin': self.is_admin,
            'favoritos': self.favoritos
        }