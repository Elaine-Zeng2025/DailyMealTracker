from flask import Blueprint, request, jsonify, session
import json
from database import get_db

meals_bp = Blueprint('meals', __name__)

VALID_TYPES = {'breakfast', 'brunch', 'lunch', 'dinner', 'snack'}
VALID_INCLUDES = {'grains', 'protein', 'vegetables', 'fruits', 'dairy', 'snacks'}

def login_required(f):
    """装饰器：检查用户是否已登录，未登录直接返回 401"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '请先登录'}), 401
        return f(*args, **kwargs)
    return decorated

# ── 新增一条饮食记录 ───────────────────────────────
@meals_bp.route('/', methods=['POST'])
@login_required
def add_meal():
    data = request.get_json()
    title     = data.get('title', '').strip()
    meal_type = data.get('type', '')
    meal_time = data.get('time', '')
    includes  = data.get('includes', [])  # 前端传来的数组，如 ["grains","protein"]

    if not title or not meal_type or not meal_time:
        return jsonify({'error': '标题、类型、时间不能为空'}), 400
    if meal_type not in VALID_TYPES:
        return jsonify({'error': '无效的餐食类型'}), 400

    # 过滤非法的食物分类，并把数组序列化为 JSON 字符串存入数据库
    valid_includes = [i for i in includes if i in VALID_INCLUDES]
    includes_str = json.dumps(valid_includes)

    conn = get_db()
    cursor = conn.execute(
        'INSERT INTO meals (user_id, title, type, meal_time, includes) VALUES (?, ?, ?, ?, ?)',
        (session['user_id'], title, meal_type, meal_time, includes_str)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({'message': '记录已保存', 'id': new_id}), 201

# ── 获取当前用户所有记录 ───────────────────────────
@meals_bp.route('/', methods=['GET'])
@login_required
def get_meals():
    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()
    conn.close()

    meals = []
    for row in rows:
        meals.append({
            'id':         row['id'],
            'title':      row['title'],
            'type':       row['type'],
            'time':       row['meal_time'],
            'includes':   json.loads(row['includes']),
            'created_at': row['created_at']
        })
    return jsonify(meals)

# ── 删除一条记录 ───────────────────────────────────
@meals_bp.route('/<int:meal_id>', methods=['DELETE'])
@login_required
def delete_meal(meal_id):
    conn = get_db()
    # 加上 user_id 条件防止用户删除别人的数据
    result = conn.execute(
        'DELETE FROM meals WHERE id = ? AND user_id = ?',
        (meal_id, session['user_id'])
    )
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        return jsonify({'error': '记录不存在或无权删除'}), 404
    return jsonify({'message': '已删除'})