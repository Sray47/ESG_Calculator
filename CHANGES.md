# Deployment Changes Summary

## Files Modified for Separate Deployments

### Backend (`brsr_backend/`)
- **NEW**: `vercel.json` - Standalone Vercel configuration
- **NEW**: `.env.example` - Environment variables template
- **NEW**: `README.md` - Backend deployment instructions  
- **MODIFIED**: `server.js` - Restored `/api` prefix for routes

### Frontend (`brsr_frontend/`)
- **NEW**: `vercel.json` - Standalone Vercel configuration
- **NEW**: `.env.example` - Environment variables template
- **MODIFIED**: `.env` - Updated API URL placeholder
- **MODIFIED**: `README.md` - Frontend deployment instructions

### Root Directory
- **NEW**: `DEPLOYMENT.md` - Overall deployment guide
- **MOVED**: `vercel.json` → `vercel.json.backup` - Original monorepo config backed up

## Next Steps

1. **Create two separate repositories or use Vercel's monorepo import**:
   - One for `brsr_backend/` directory
   - One for `brsr_frontend/` directory

2. **Deploy in this order**:
   - Deploy backend first to get the API URL
   - Update frontend environment variables with backend URL
   - Deploy frontend
   - Update backend CORS_ORIGIN with frontend URL

3. **Environment Variables to Set**:

   **Backend Vercel Project**:
   ```
   DATABASE_URL=your_database_url
   SUPABASE_URL=https://czrxdrytvvbbtqfacnwr.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   JWT_SECRET=your_jwt_secret
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

   **Frontend Vercel Project**:
   ```
   VITE_SUPABASE_URL=https://czrxdrytvvbbtqfacnwr.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_BASE_URL=https://your-backend-url.vercel.app
   ```

Both applications will now deploy independently with proper API communication between them.
