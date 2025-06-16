# BRSR Backend Deployment Guide

## Deploy to Vercel as Standalone Project

### 1. Create New Vercel Project
1. Go to Vercel dashboard
2. Click "New Project"
3. Import this `brsr_backend` directory as a separate repository or subfolder
4. Vercel will automatically detect it as a Node.js project

### 2. Configure Environment Variables
Set these environment variables in your Vercel project settings:

```
DATABASE_URL=postgresql://postgres.czrxdrytvvbbtqfacnwr:password@aws-0-ap-south-1.pooler.supabase.co:6543/postgres
SUPABASE_URL=https://czrxdrytvvbbtqfacnwr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### 3. Important Notes
- The backend will be available at: `https://your-backend-project.vercel.app`
- All API routes are prefixed with `/api/` (e.g., `/api/auth/login`)
- Update the `CORS_ORIGIN` with your frontend's deployed URL
- Update your frontend's `VITE_API_BASE_URL` to point to this backend URL

### 4. API Endpoints
- Health check: `GET /api/test`
- Authentication: `POST /api/auth/login`, `POST /api/auth/create-profile`
- Company: `GET /api/company/profile`, `PUT /api/company/profile`
- Reports: `GET /api/reports`, `POST /api/reports`

### 5. Local Development
```bash
npm install
npm run dev
```
The server will run on `http://localhost:5001`
