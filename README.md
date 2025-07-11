# Financial Management API Server

A Node.js/Express API server for the Financial Management System with TypeScript.

## Features

- User authentication and authorization
- Financial management (expenses, income, budgets)
- Asset management
- Employee management
- HSE (Health, Safety & Environment) management
- Procurement management
- Travel management
- And more...

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/financedb

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# CORS Origins (comma separated)
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Node Environment
NODE_ENV=production
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Development

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/expenses` - Expense management
- `/api/employees` - Employee management
- `/api/assets` - Asset management
- `/api/hse` - HSE management
- `/api/procurement` - Procurement management
- `/api/travel` - Travel management
- And more...

## Deployment

This server is configured for deployment on Railway. The `Procfile` specifies how to start the application.

## License

ISC 