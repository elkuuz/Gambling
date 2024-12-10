from python_app import create_app
from flask_session import Session
from flask import Flask

app = create_app()

app.secret_key='secret_key'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT']=False

Session(app)

if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=4000)