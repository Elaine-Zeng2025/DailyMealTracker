from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from routes.auth import auth_bp
from routes.meals import meals_bp
import os

app = Flask(__name__, static_folder='..', static_url_path='')
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

CORS(app, supports_credentials=True)

init_db()

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(meals_bp, url_prefix='/api/meals')

@app.route('/api/health')
def health():
    return {'status': 'ok'}

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return {'error': 'not found'}, 404
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)