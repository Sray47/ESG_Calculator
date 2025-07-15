#!/bin/bash

# BRSR Calculator Vercel Deployment Script
# This script helps deploy both frontend and backend to Vercel

echo "🚀 Starting BRSR Calculator Vercel Deployment"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Please log in to Vercel first:"
    echo "vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"

# Function to deploy backend
deploy_backend() {
    echo "🔧 Deploying Backend..."
    cd brsr_backend
    
    echo "📦 Installing backend dependencies..."
    npm install
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend deployment successful!"
        BACKEND_URL=$(vercel ls --scope=team | grep brsr-backend | head -1 | awk '{print $2}')
        echo "🌐 Backend URL: https://$BACKEND_URL"
    else
        echo "❌ Backend deployment failed!"
        exit 1
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo "🎨 Deploying Frontend..."
    cd brsr_frontend
    
    echo "📦 Installing frontend dependencies..."
    npm install
    
    echo "🏗️ Building frontend..."
    npm run build
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployment successful!"
        FRONTEND_URL=$(vercel ls --scope=team | grep brsr-frontend | head -1 | awk '{print $2}')
        echo "🌐 Frontend URL: https://$FRONTEND_URL"
    else
        echo "❌ Frontend deployment failed!"
        exit 1
    fi
    
    cd ..
}

# Function to deploy both (monorepo style)
deploy_monorepo() {
    echo "🔄 Deploying as monorepo..."
    
    echo "📦 Installing dependencies..."
    cd brsr_backend && npm install && cd ..
    cd brsr_frontend && npm install && cd ..
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Monorepo deployment successful!"
    else
        echo "❌ Monorepo deployment failed!"
        exit 1
    fi
}

# Ask user for deployment method
echo "Choose deployment method:"
echo "1) Deploy Backend only"
echo "2) Deploy Frontend only"
echo "3) Deploy both separately"
echo "4) Deploy as monorepo (recommended)"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    4)
        deploy_monorepo
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables in Vercel dashboard"
echo "2. Set CORS_ORIGIN to your frontend URL"
echo "3. Set VITE_API_BASE_URL to your backend URL"
echo "4. Test the deployed application"
echo ""
echo "🔗 Useful commands:"
echo "vercel env ls              # List environment variables"
echo "vercel env add             # Add environment variable"
echo "vercel logs                # View deployment logs"
echo "vercel domains             # Manage custom domains"
