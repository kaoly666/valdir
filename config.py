# config.py
# Objetivo: Definir as configurações principais do Flask.
#
# Requisitos:
# 1. Criar uma classe 'Config'.
# 2. Dentro de 'Config', definir a variável 'SQLALCHEMY_DATABASE_URI' para apontar para um arquivo SQLite chamado 'db.sqlite' na pasta raiz.
# 3. Definir 'SQLALCHEMY_TRACK_MODIFICATIONS' como False.

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite'
    SQLALCHEMY_TRACK_MODIFICATIONS = False