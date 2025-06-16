# BRSR Frontend Deployment Guide

## Deploy to Vercel as Standalone Project

### 1. Create New Vercel Project
1. Go to Vercel dashboard
2. Click "New Project"
3. Import this `brsr_frontend` directory as a separate repository or subfolder
4. Vercel will automatically detect it as a static site (Vite/React)

### 2. Configure Environment Variables
Set these environment variables in your Vercel project settings:

```
VITE_SUPABASE_URL=https://czrxdrytvvbbtqfacnwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnhkcnl0dnZiYnRxZmFjbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI3NzcsImV4cCI6MjA2MzI5ODc3N30.zPjoqzQ1JYRhSkctZyo1_KQhCMGb1YQppNRq-U3hUwQ
VITE_API_BASE_URL=https://your-backend-project.vercel.app
```

### 3. Deployment Steps
1. **Deploy Backend First**: Deploy the `brsr_backend` directory as a separate Vercel project
2. **Get Backend URL**: Copy the deployed backend URL (e.g., `https://your-backend-project.vercel.app`)
3. **Update Frontend Environment**: Update `VITE_API_BASE_URL` with the backend URL
4. **Update Backend CORS**: Update the backend's `CORS_ORIGIN` environment variable with your frontend URL

### 4. Important Notes
- The frontend will be available at: `https://your-frontend-project.vercel.app`
- Make sure both projects are deployed and their URLs are cross-referenced in environment variables
- The frontend expects API endpoints at `/api/*` on the backend domain

### 5. Local Development
```bash
npm install
npm run dev
```
The app will run on `http://localhost:5173`

### 6. Build Process
Vercel automatically runs:
```bash
npm run build
```
This creates optimized production files in the `dist` directory.

---

## Original Vite Template Info

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
