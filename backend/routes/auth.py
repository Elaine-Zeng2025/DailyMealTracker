from flask import Blueprint, request, jsonify, session
from database import get_db, DATABASE_URL
import hashlib
import re
from database import get_db

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """用 SHA-256 对密码加密，存入数据库的永远是哈希值而非明文"""
    return hashlib.sha256(password.encode()).hexdigest()

def is_valid_email(email):
    return re.match(r'^[^@]+@[^@]+\.[^@]+$', email)

# ── 注册 ──────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': '所有字段不能为空'}), 400
    if not is_valid_email(email):
        return jsonify({'error': '邮箱格式不正确'}), 400
    if len(password) < 6:
        return jsonify({'error': '密码至少 6 位'}), 400

    conn = get_db()
    try:
        if DATABASE_URL:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)',
                (username, email, hash_password(password))
            )
            cursor.close()
        else:
            conn.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                (username, email, hash_password(password))
            )
        conn.commit()
        return jsonify({'message': '注册成功'}), 201
    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({'error': '用户名或邮箱已被使用'}), 409
    finally:
        conn.close()

# ── 登录 ──────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '')

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        (email, hash_password(password))
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': '邮箱或密码错误'}), 401

    # 把用户 id 存入 session，之后的请求用它验证身份
    session['user_id'] = user['id']
    session['username'] = user['username']

    return jsonify({
        'message': '登录成功',
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}
    })

# ── 登出 ──────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': '已登出'})

# ── 检查当前登录状态 ───────────────────────────────
@auth_bp.route('/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    return jsonify({'user_id': session['user_id'], 'username': session['username']})

# ── 暂时用于查看已有用户 ───────────────────────────────
@auth_bp.route('/admin/users', methods=['GET'])
def admin_users():
    conn = get_db()
    users = conn.execute(
        'SELECT id, username, email, created_at FROM users'
    ).fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])