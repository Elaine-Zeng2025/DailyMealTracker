from flask import Blueprint, request, jsonify, session
import json
from database import get_db, DATABASE_URL

meals_bp = Blueprint('meals', __name__)

VALID_TYPES = {'breakfast', 'brunch', 'lunch', 'dinner', 'snack'}
VALID_INCLUDES = {'grains', 'protein', 'vegetables', 'fruits', 'dairy', 'snacks'}

def login_required(f):
    
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Please log in first'}), 401
        return f(*args, **kwargs)
    return decorated

def db_execute(conn, sql, params=()):
    if DATABASE_URL:
        sql = sql.replace('?', '%s')
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor
    else:
        return conn.execute(sql, params)

@meals_bp.route('/', methods=['POST'])
@login_required
def add_meal():
    data = request.get_json()
    title     = data.get('title', '').strip()
    meal_type = data.get('type', '')
    meal_time = data.get('time', '')
    includes  = data.get('includes', [])

    if not title or not meal_type or not meal_time:
        return jsonify({'error': 'Title, type, and time cannot be empty'}), 400
    if meal_type not in VALID_TYPES:
        return jsonify({'error': 'Invalid meal type'}), 400

# 过滤非法的食物分类，并把数组序列化为 JSON 字符串存入数据库
    valid_includes = [i for i in includes if i in VALID_INCLUDES]
    includes_str = json.dumps(valid_includes)

    conn = get_db()
    cursor = db_execute(conn,
        'INSERT INTO meals (user_id, title, type, meal_time, includes) VALUES (?, ?, ?, ?, ?)',
        (session['user_id'], title, meal_type, meal_time, includes_str)
    )
    conn.commit()

    if DATABASE_URL:
        cursor.execute('SELECT lastval()')
        new_id = cursor.fetchone()['lastval']
        cursor.close()
    else:
        new_id = cursor.lastrowid

    conn.close()
    return jsonify({'message': 'The record has been saved', 'id': new_id}), 201

# ── 获取当前用户所有记录 ───────────────────────────
@meals_bp.route('/', methods=['GET'])
@login_required
def get_meals():
    conn = get_db()
    cursor = db_execute(conn,
        'SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    )
    rows = cursor.fetchall()
    if DATABASE_URL:
        cursor.close()
    conn.close()

    meals = []
    for row in rows:
        row = dict(row)
        meals.append({
            'id':         row['id'],
            'title':      row['title'],
            'type':       row['type'],
            'time':       row['meal_time'],
            'includes':   json.loads(row['includes']),
            'created_at': str(row['created_at'])
        })
    return jsonify(meals)

# ── 删除一条记录 ───────────────────────────────────
@meals_bp.route('/<int:meal_id>', methods=['DELETE'])
@login_required
def delete_meal(meal_id):
    conn = get_db()
    cursor = db_execute(conn,
        'DELETE FROM meals WHERE id = ? AND user_id = ?',
        (meal_id, session['user_id'])
    )
    conn.commit()
    affected = cursor.rowcount
    if DATABASE_URL:
        cursor.close()
    conn.close()

    if affected == 0:
        return jsonify({'error': 'Record does not exist or you are not the owner'}), 404
    return jsonify({'message': 'Deleted successfully'})