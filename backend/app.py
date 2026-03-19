from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from routes.auth import auth_bp
from routes.meals import meals_bp
import os

app = Flask(__name__, static_folder='..', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

IS_PROD = os.environ.get('RAILWAY_ENVIRONMENT') == 'production'
app.config['SESSION_COOKIE_SECURE'] = IS_PROD
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, 
     supports_credentials=True,
     origins=['http://localhost:5000', 'https://piecebypeas-production.up.railway.app','https://Elaine-Zeng2025.github.io'])

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
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=not IS_PROD, host='0.0.0.0', port=port)