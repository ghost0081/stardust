# Space Explorer Backend

This backend provides API endpoints for the Space Explorer application with Supabase integration.

## Project Structure

```
backend/
├── config/
│   ├── database.js          # Supabase configuration
│   └── environment.js       # Environment variables
├── models/
│   ├── User.js              # User model/schema
│   └── index.js             # Model exports
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   └── index.js              # Route exports
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Request validation
│   └── index.js             # Middleware exports
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   └── index.js             # Controller exports
├── utils/
│   ├── helpers.js           # Utility functions
│   ├── constants.js         # Application constants
│   └── index.js             # Utility exports
├── package.json             # Backend dependencies
├── .env.example             # Environment variables template
└── server.js                # Main server file
```

## Features

- **Supabase Integration**: Database connection and authentication
- **JWT Authentication**: Secure token-based authentication
- **User Management**: Registration, login, profile management
- **Input Validation**: Request validation middleware
- **Error Handling**: Centralized error handling
- **CORS Support**: Cross-origin resource sharing
- **Environment Configuration**: Secure environment variable management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure Supabase credentials in `.env`

4. Run the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

## Database Schema

See `database/schema.sql` for complete database schema including:
- Users table with authentication fields
- User profiles and preferences
- Session management
- Audit logs
