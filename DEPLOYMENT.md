# ESG Calculator - Separate Deployment Setup

This project has been configured for separate frontend and backend deployments on Vercel.

## Deployment Instructions

### 1. Deploy Backend
1. Navigate to `brsr_backend/` directory
2. Follow the instructions in `brsr_backend/README.md`
3. Deploy as a separate Vercel project
4. Note the deployed backend URL

### 2. Deploy Frontend
1. Navigate to `brsr_frontend/` directory  
2. Update environment variables with the backend URL from step 1
3. Follow the instructions in `brsr_frontend/README.md`
4. Deploy as a separate Vercel project

### 3. Cross-Reference URLs
- Update backend's `CORS_ORIGIN` with frontend URL
- Update frontend's `VITE_API_BASE_URL` with backend URL

## Why Separate Deployments?

1. **Independent Scaling**: Frontend and backend can scale independently
2. **Faster Deployments**: Changes to one part don't require redeploying everything
3. **Better Resource Allocation**: Each service gets dedicated resources
4. **Easier Debugging**: Clearer separation of concerns

## Original Monorepo Structure

The original monorepo `vercel.json` has been moved to `vercel.json.backup` for reference.
Each directory now has its own deployment configuration.
