
from python_app.routes.casino_blue import casino_blueprint


def register_blueprints(app):
    app.register_blueprint(casino_blueprint, url_prefix='/casino')
