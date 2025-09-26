from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
import bcrypt
import jwt
import datetime
from functools import wraps
from dotenv import load_dotenv

# Load env
load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError('Missing SUPABASE_URL or SUPABASE_ANON_KEY in env')

# Public client per docs
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
# Admin client for inserts/updates requiring elevated policies
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else supabase

JWT_SECRET = os.getenv('JWT_SECRET', 'change_me_dev_only')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user: dict) -> str:
    payload = {
        'userId': user['id'],
        'email': user['email'],
        'name': user['name'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or ' ' not in auth:
            return jsonify({'success': False, 'message': 'Missing token'}), 401
        token = auth.split(' ')[1]
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 401
        return f(decoded, *args, **kwargs)
    return wrapped

@app.get('/health')
def health():
    return jsonify({ 'success': True, 'message': 'OK' })

@app.post('/api/auth/register')
def register():
    body = request.get_json(force=True)
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400

    # Per docs: select/eq/execute
    existing = (
        supabase_admin
        .table('users')
        .select('id')
        .eq('email', email)
        .execute()
    )
    if existing.data:
        return jsonify({'success': False, 'message': 'User exists'}), 409

    password_hash = hash_password(password)
    user_payload = {
        'email': email,
        'name': name,
        'password_hash': password_hash,
        'is_active': True,
        'created_at': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat(),
        'profile_data': { 'preferences': { 'theme': 'space', 'notifications': True, 'language': 'en' } }
    }

    inserted = (
        supabase_admin
        .table('users')
        .insert(user_payload)
        .execute()
    )
    # Handle insert errors
    if getattr(inserted, 'error', None):
        msg = inserted.error.get('message', 'Insert failed') if isinstance(inserted.error, dict) else 'Insert failed'
        return jsonify({'success': False, 'message': msg}), 500

    rows = inserted.data or []
    if len(rows) == 0:
        return jsonify({'success': False, 'message': 'Insert returned no rows'}), 500

    user = rows[0]
    user.pop('password_hash', None)
    token = generate_token(user)
    return jsonify({ 'success': True, 'data': { 'user': user, 'tokens': { 'accessToken': token } } }), 201

@app.post('/api/auth/login')
def login():
    body = request.get_json(force=True)
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    if not email or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400

    # Per docs: select/eq/single/execute
    result = (
        supabase_admin
        .table('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .execute()
    )
    # If no user rows found
    rows = result.data or []
    if len(rows) == 0:
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    user = rows[0]
    if not user.get('is_active', True):
        return jsonify({'success': False, 'message': 'Account deactivated'}), 401

    if not verify_password(password, user['password_hash']):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    # Update last_login
    supabase_admin.table('users').update({
        'last_login': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat()
    }).eq('id', user['id']).execute()

    user.pop('password_hash', None)
    token = generate_token(user)
    return jsonify({ 'success': True, 'data': { 'user': user, 'tokens': { 'accessToken': token } } })

@app.get('/api/users/profile')
@token_required
def me(decoded):
    uid = decoded['userId']
    res = (
        supabase
        .table('users')
        .select('id, name, email, created_at, last_login, profile_data')
        .eq('id', uid)
        .single()
        .execute()
    )
    if res.error:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    return jsonify({ 'success': True, 'data': { 'profile': res.data } })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('NODE_ENV') == 'development')


