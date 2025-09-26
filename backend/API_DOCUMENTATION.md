# Space Explorer Backend API Documentation

## Overview
This backend provides a RESTful API for the Space Explorer application with Supabase integration for user authentication and data management.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-domain.com`

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "profile_data": {...}
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### User Routes (`/api/users`)

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "profile_data": {
    "bio": "Space enthusiast",
    "preferences": {
      "theme": "space",
      "notifications": true,
      "language": "en"
    }
  }
}
```

#### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### Delete Account
```http
DELETE /api/users/account
Authorization: Bearer <token>
```

#### Get Public User Profile
```http
GET /api/users/:id
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": [...] // Optional validation details
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `USER_EXISTS` - User already exists
- `INVALID_CREDENTIALS` - Invalid email/password
- `TOKEN_EXPIRED` - JWT token expired
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting
- 100 requests per 15 minutes per IP
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_data JSONB DEFAULT '{}'::jsonb
);
```

## Environment Variables

Required environment variables:
```bash
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection protection via Supabase

## Development

### Start Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production Supabase instance
3. Set up SSL certificates
4. Use process manager (PM2)
5. Configure reverse proxy (Nginx)

## Support
For issues and questions, please contact the development team.
