from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
import bcrypt
import jwt
import datetime
from functools import wraps
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://xznzussaphaawfjtnbsr.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjM5NTQsImV4cCI6MjA3NDQzOTk1NH0.G9_U73SwgG2ZzFl7MTiCFnUOqDLFqkuM0zrpcUy_Ulo')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2Mzk1NCwiZXhwIjoyMDc0NDM5OTU0fQ.GijAIsQ_D0FR-BFl3RTT-M3wY1PrJ0DBBO8GWBfjXKk')

# JWT configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'space_explorer_jwt_secret_key_2024_secure_token')
JWT_EXPIRES_IN = os.getenv('JWT_EXPIRES_IN', '7d')

# Initialize Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_data: dict) -> str:
    """Generate JWT token"""
    payload = {
        'userId': user_data['id'],
        'email': user_data['email'],
        'name': user_data['name'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def token_required(f):
    """Decorator to require JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer TOKEN
            except IndexError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid token format',
                    'code': 'INVALID_TOKEN_FORMAT'
                }), 401
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing',
                'code': 'MISSING_TOKEN'
            }), 401
        
        try:
            data = verify_token(token)
            current_user_id = data['userId']
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e),
                'code': 'INVALID_TOKEN'
            }), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Space Explorer API is running',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'environment': os.getenv('NODE_ENV', 'development')
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'{field} is required',
                    'code': 'MISSING_FIELD'
                }), 400
        
        # Check if user already exists
        existing_user = supabase_admin.table('users').select('id').eq('email', data['email'].lower().strip()).execute()
        
        if existing_user.data:
            return jsonify({
                'success': False,
                'message': 'User with this email already exists',
                'code': 'USER_EXISTS'
            }), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Prepare user data
        user_data = {
            'email': data['email'].lower().strip(),
            'name': data['name'].strip(),
            'password_hash': password_hash,
            'is_active': True,
            'created_at': datetime.datetime.utcnow().isoformat(),
            'updated_at': datetime.datetime.utcnow().isoformat(),
            'profile_data': {
                'avatar': None,
                'bio': '',
                'preferences': {
                    'theme': 'space',
                    'notifications': True,
                    'language': 'en'
                }
            }
        }
        
        # Insert user into database
        result = supabase_admin.table('users').insert(user_data).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'message': 'Failed to create user',
                'code': 'CREATION_FAILED'
            }), 500
        
        user = result.data[0]
        
        # Generate token
        token = generate_token(user)
        
        # Remove password hash from response
        del user['password_hash']
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'user': user,
                'tokens': {
                    'accessToken': token
                }
            }
        }), 201
        
    except Exception as e:
        logger.error(f'Registration error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'code': 'REGISTRATION_ERROR'
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required',
                'code': 'MISSING_CREDENTIALS'
            }), 400
        
        # Find user by email
        result = supabase_admin.table('users').select('*').eq('email', data['email'].lower().strip()).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        user = result.data[0]
        
        # Check if account is active
        if not user['is_active']:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated',
                'code': 'ACCOUNT_DEACTIVATED'
            }), 401
        
        # Verify password
        if not verify_password(data['password'], user['password_hash']):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        # Update last login
        supabase_admin.table('users').update({
            'last_login': datetime.datetime.utcnow().isoformat(),
            'updated_at': datetime.datetime.utcnow().isoformat()
        }).eq('id', user['id']).execute()
        
        # Generate token
        token = generate_token(user)
        
        # Remove password hash from response
        del user['password_hash']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': user,
                'tokens': {
                    'accessToken': token
                }
            }
        })
        
    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Login failed',
            'code': 'LOGIN_ERROR'
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user_id):
    """Get current user profile"""
    try:
        result = supabase_admin.table('users').select('*').eq('id', current_user_id).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'message': 'User not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        user = result.data[0]
        del user['password_hash']
        
        return jsonify({
            'success': True,
            'data': {
                'user': user
            }
        })
        
    except Exception as e:
        logger.error(f'Get user error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get user profile',
            'code': 'PROFILE_ERROR'
        }), 500

@app.route('/api/users/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    try:
        result = supabase.table('users').select('id, name, email, created_at, last_login, profile_data').eq('id', current_user_id).eq('is_active', True).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'message': 'Profile not found',
                'code': 'PROFILE_NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'profile': result.data[0]
            }
        })
        
    except Exception as e:
        logger.error(f'Get profile error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get profile',
            'code': 'PROFILE_ERROR'
        }), 500

@app.route('/api/users/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        # Prepare update data
        update_data = {
            'updated_at': datetime.datetime.utcnow().isoformat()
        }
        
        if 'name' in data:
            update_data['name'] = data['name'].strip()
        
        if 'profile_data' in data:
            update_data['profile_data'] = data['profile_data']
        
        # Update user
        result = supabase_admin.table('users').update(update_data).eq('id', current_user_id).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'message': 'Failed to update profile',
                'code': 'UPDATE_FAILED'
            }), 500
        
        user = result.data[0]
        del user['password_hash']
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': {
                'user': user
            }
        })
        
    except Exception as e:
        logger.error(f'Update profile error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to update profile',
            'code': 'UPDATE_ERROR'
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user_id):
    """Logout user"""
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'API endpoint not found',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500

if __name__ == '__main__':
    # Test database connection
    try:
        result = supabase.table('users').select('count').limit(1).execute()
        print('✅ Supabase connected successfully')
    except Exception as e:
        print(f'❌ Supabase connection failed: {str(e)}')
    
    # Start Flask app
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    
    print(f'🚀 Space Explorer API server starting on port {port}')
    print(f'📊 Environment: {os.getenv("NODE_ENV", "development")}')
    print(f'🌐 CORS Origin: {os.getenv("CORS_ORIGIN", "http://localhost:3000")}')
    
    app.run(host='0.0.0.0', port=port, debug=debug)
