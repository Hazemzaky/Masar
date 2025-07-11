# Railway Deployment Guide

This guide will help you deploy the Financial Management API to Railway.

## Prerequisites

1. A GitHub account
2. A Railway account (sign up at https://railway.app)
3. A MongoDB database (you can use MongoDB Atlas or Railway's MongoDB service)

## Step 1: Prepare Your Repository

1. Make sure your server code is in a separate repository or in a `server/` folder
2. Ensure you have the following files in your server directory:
   - `package.json` (with build and start scripts)
   - `Procfile` (with `web: npm start`)
   - `tsconfig.json`
   - `.gitignore`
   - `README.md`

## Step 2: Set Up MongoDB

1. Go to MongoDB Atlas (https://www.mongodb.com/atlas) or use Railway's MongoDB service
2. Create a new cluster
3. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

## Step 3: Deploy to Railway

### Option A: Deploy from GitHub

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Go to https://railway.app
   - Sign in with your GitHub account
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the branch (usually `main`)

3. **Configure Environment Variables:**
   - In your Railway project dashboard, go to the "Variables" tab
   - Add the following environment variables:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secure_jwt_secret
     NODE_ENV=production
     CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
     ```

4. **Deploy:**
   - Railway will automatically detect your Node.js app
   - It will run `npm install` and `npm run build`
   - Then it will start your app using the `Procfile`

### Option B: Deploy from Local Directory

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize and deploy:
   ```bash
   railway init
   railway up
   ```

## Step 4: Configure Domain (Optional)

1. In your Railway project dashboard, go to the "Settings" tab
2. Under "Domains", you can add a custom domain
3. Railway will provide you with a default domain like `your-app-name.railway.app`

## Step 5: Update Frontend Configuration

Once your backend is deployed, update your frontend's API configuration:

1. Update the API base URL in your frontend:
   ```javascript
   // In your frontend's apiBase.ts or similar
   const API_BASE = process.env.REACT_APP_API_BASE || 'https://your-app-name.railway.app';
   ```

2. Update CORS origins in your backend if needed

## Step 6: Test Your Deployment

1. Visit your Railway app URL
2. Test the health endpoint: `https://your-app-name.railway.app/health`
3. Test your API endpoints

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation works locally

2. **MongoDB connection fails:**
   - Verify your `MONGO_URI` is correct
   - Check that your MongoDB cluster allows connections from Railway's IPs

3. **App crashes on startup:**
   - Check Railway logs in the dashboard
   - Verify all environment variables are set
   - Ensure the `start` script in `package.json` is correct

4. **CORS errors:**
   - Update `CORS_ORIGINS` to include your frontend domain
   - Check that your frontend is making requests to the correct URL

### Checking Logs:

- In Railway dashboard, go to your service
- Click on "Deployments" tab
- Click on the latest deployment
- View the logs to see what's happening

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port for the server to run on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://yourdomain.com,http://localhost:3000` |

## Support

If you encounter issues:
1. Check Railway's documentation: https://docs.railway.app
2. Check the logs in your Railway dashboard
3. Verify your environment variables are set correctly
4. Test your app locally first 