# 🚀 Space Explorer Backend Setup Guide

## Your Supabase Configuration
- **Project URL:** https://xznzussaphaawfjtnbsr.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjM5NTQsImV4cCI6MjA3NDQzOTk1NH0.G9_U73SwgG2ZzFl7MTiCFnUOqDLFqkuM0zrpcUy_Ulo
- **Service Role Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2Mzk1NCwiZXhwIjoyMDc0NDM5OTU0fQ.GijAIsQ_D0FR-BFl3RTT-M3wY1PrJ0DBBO8GWBfjXKk

## Step 1: Install Backend Dependencies

```bash
cd stardust/backend
npm install
```

## Step 2: Create Environment File

```bash
cp env.example .env
```

Your `.env` file should now contain:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xznzussaphaawfjtnbsr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjM5NTQsImV4cCI6MjA3NDQzOTk1NH0.G9_U73SwgG2ZzFl7MTiCFnUOqDLFqkuM0zrpcUy_Ulo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2Mzk1NCwiZXhwIjoyMDc0NDM5OTU0fQ.GijAIsQ_D0FR-BFl3RTT-M3wY1PrJ0DBBO8GWBfjXKk

# JWT Configuration
JWT_SECRET=space_explorer_jwt_secret_key_2024
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 3: Set Up Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `xznzussaphaawfjtnbsr`
3. Go to **SQL Editor**
4. Copy and paste the entire content from `database/schema.sql`
5. Click **Run** to execute the SQL

## Step 4: Test Database Connection

```bash
cd stardust/backend
node -e "
const { testConnection } = require('./config/database');
testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed!');
    process.exit(1);
  }
});
"
```

## Step 5: Start the Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

You should see:
```
🚀 Space Explorer API server running on port 5000
📊 Environment: development
🌐 CORS Origin: http://localhost:3000
⏱️  Rate Limit: 100 requests per 900s
✅ Supabase connected successfully
```

## Step 6: Test API Endpoints

### Test Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Space Explorer API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@spaceexplorer.com",
    "password": "TestPass123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "Test User",
      "email": "test@spaceexplorer.com",
      "created_at": "2024-01-01T00:00:00Z",
      "profile_data": {...}
    },
    "tokens": {
      "accessToken": "jwt-token-here",
      "refreshToken": "refresh-token-here"
    }
  }
}
```

## Step 7: Update Frontend to Use Backend

Update your frontend `LoginModal.js` to connect to the backend:

```javascript
// In LoginModal.js, update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      
      // Call onLogin with user data
      onLogin(data.data.user);
      onClose();
      resetForm();
    } else {
      console.error('Authentication failed:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and keys are correct
- Check if the SQL schema was executed successfully
- Ensure your Supabase project is active

### CORS Issues
- Make sure `CORS_ORIGIN` in `.env` matches your frontend URL
- Check browser console for CORS errors

### Authentication Issues
- Verify JWT_SECRET is set in `.env`
- Check if tokens are being stored correctly in localStorage
- Ensure backend is running on port 5000

## Next Steps

1. **Test all API endpoints** using Postman or curl
2. **Update frontend** to use the backend API
3. **Deploy backend** to a cloud service (Vercel, Railway, etc.)
4. **Set up production environment** variables
5. **Configure SSL certificates** for production

## API Endpoints Available

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account

Your backend is now ready to handle user authentication for the Space Explorer application! 🚀
