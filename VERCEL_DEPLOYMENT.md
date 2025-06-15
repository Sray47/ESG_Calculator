# BRSR Calculator - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the BRSR Calculator application to Vercel.

## Prerequisites

1. **GitHub Repository**: Ensure your entire project (both `brsr_frontend` and `brsr_backend` folders) is in a single GitHub repository.
2. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com) and connect it to your GitHub account.
3. **Environment Variables**: Have your database and Supabase credentials ready.

## Code Modifications Made

The following changes have been implemented to make the application Vercel-compatible:

### Backend Changes (`brsr_backend/`)

1. **Server Configuration** (`server.js`):
   - Removed `app.listen()` and exported the Express app for serverless functions
   - Made CORS origin configurable via environment variable
   - Updated graceful shutdown handler for serverless compatibility

2. **PDF Generation** (`reportRoutes.js`):
   - Modified submit endpoint to remove filesystem-based PDF generation
   - Updated PDF endpoint to generate PDFs in-memory as buffers
   - Removed filesystem dependencies (`fs` and `path` imports)

3. **Serverless Configuration**:
   - Created `vercel.json` with proper build and routing configuration
   - Configured monorepo structure with separate builds for frontend and backend

## Deployment Steps

### Step 1: Push Changes to GitHub

Commit and push all the modified files to your GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment - serverless compatibility"
git push origin main
```

### Step 2: Import Project on Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New... > Project"
3. Select your GitHub repository
4. **Important**: When prompted for Root Directory, select `brsr_frontend`
5. Vercel will auto-detect this as a Vite project with the following settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Before deploying, add the following environment variables in the Vercel project settings:

**Database Variables:**
- `DB_HOST`: Your PostgreSQL host (e.g., `your-project.supabase.co`)
- `DB_USER`: `postgres`
- `DB_PASSWORD`: Your database password
- `DB_NAME`: `postgres`
- `DB_PORT`: `5432`

**Supabase Variables:**
- `SUPABASE_URL`: `https://your-project.supabase.co`
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key

**Application Variables:**
- `JWT_SECRET`: Your JWT secret key
- `CORS_ORIGIN`: `https://your-project-name.vercel.app` (replace with your actual Vercel domain)

### Step 4: Deploy

1. Click the **"Deploy"** button
2. Monitor the build logs for any issues
3. Once deployed, you'll receive a URL like `https://your-project-name.vercel.app`

### Step 5: Update CORS_ORIGIN

After deployment:
1. Note your Vercel domain from the deployment success page
2. Go to Vercel project settings > Environment Variables
3. Update the `CORS_ORIGIN` value to your actual Vercel domain
4. Redeploy the project for the changes to take effect

## Testing the Deployment

Once deployed, test the following workflow:

1. **Registration/Login**: Create a new account or login
2. **Report Creation**: Start a new BRSR report
3. **Data Entry**: Fill in some sample data across different sections
4. **Save**: Ensure data persistence works
5. **Submit**: Submit the report
6. **PDF Download**: Test the PDF generation and download functionality

The PDF download is critical to test as it validates the in-memory generation logic.

## Key Architectural Changes

### PDF Generation
- **Before**: PDFs were generated and saved to the filesystem during report submission
- **After**: PDFs are generated on-demand in memory when requested, eliminating filesystem dependencies

### CORS Configuration
- **Before**: Hardcoded to `localhost:5173`
- **After**: Configurable via `CORS_ORIGIN` environment variable

### Server Startup
- **Before**: Used `app.listen()` for traditional server deployment
- **After**: Exports Express app for Vercel's serverless function handler

## Troubleshooting

### Common Issues:

1. **PDF Generation Fails**: Ensure all font files are included and accessible
2. **Database Connection Issues**: Verify all database environment variables are correctly set
3. **CORS Errors**: Ensure `CORS_ORIGIN` matches your Vercel domain exactly
4. **Build Failures**: Check that all dependencies are listed in `package.json`

### Monitoring:

- Use Vercel's Function logs to monitor backend performance
- Check the Network tab in browser dev tools for API call issues
- Monitor database connections through your PostgreSQL provider's dashboard

## Troubleshooting Network Errors

### Problem: Frontend shows "Network Error" or API calls fail

This usually means the frontend can't reach the backend. Follow these steps to diagnose and fix:

#### Step 1: Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Ensure you have set **VITE_API_BASE_URL** for the frontend:
   ```
   VITE_API_BASE_URL = https://your-exact-vercel-domain.vercel.app
   ```
   ⚠️ **Important**: This should be your EXACT Vercel domain, not a placeholder

4. **Redeploy** after adding/changing environment variables:
   - Go to **Deployments** tab
   - Click the three dots next to your latest deployment
   - Select **Redeploy**

#### Step 2: Verify API Endpoints Are Working

Test your backend directly by visiting these URLs in your browser:

1. **Health Check**: `https://your-domain.vercel.app/api/test`
   - Should return: `{"message": "Backend is working!", "timestamp": "..."}`

2. **If the above fails**, your backend isn't deployed correctly

#### Step 3: Check Vercel Function Logs

1. Go to your Vercel project dashboard
2. Click on **Functions** tab
3. Look for any error messages in the function logs
4. Common issues:
   - Missing environment variables
   - Database connection failures
   - Import/require errors

#### Step 4: Common Fixes

**A. Frontend Environment Variables Missing:**
```bash
# In Vercel project settings, add:
VITE_API_BASE_URL=https://your-actual-domain.vercel.app
```

**B. Backend Environment Variables Missing:**
```bash
# Ensure all these are set in Vercel:
DB_HOST=your-database-host
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_PORT=5432
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-exact-vercel-domain.vercel.app
```

**C. CORS Issues:**
- Ensure `CORS_ORIGIN` exactly matches your frontend domain
- No trailing slashes
- Use https:// not http://

#### Step 5: Local Testing vs Production

**Local Development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3050`
- VITE_API_BASE_URL not needed (uses fallback)

**Production:**
- Frontend: `https://your-domain.vercel.app`
- Backend: `https://your-domain.vercel.app/api`
- VITE_API_BASE_URL: `https://your-domain.vercel.app`

#### Quick Debug Commands

**Check what API URL the frontend is using:**
Open browser console and run:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

**Test backend directly:**
```bash
curl https://your-domain.vercel.app/api/test
```

### Most Common Solution

90% of network errors are fixed by:
1. Setting `VITE_API_BASE_URL=https://your-exact-vercel-domain.vercel.app`
2. Redeploying the project
3. Hard refreshing the browser (Ctrl+F5)

## Production Considerations

1. **Database Scaling**: Ensure your PostgreSQL instance can handle production load
2. **Rate Limiting**: The app includes rate limiting middleware for security
3. **Error Monitoring**: Consider integrating with services like Sentry for error tracking
4. **Performance**: Vercel functions have cold start latency; consider this for user experience

## Support

If you encounter issues during deployment:
1. Check Vercel's build and function logs
2. Verify all environment variables are correctly set
3. Ensure your database is accessible from Vercel's IP ranges
4. Test the application locally first to isolate deployment-specific issues
