# BRSR Calculator Vercel Deployment Script for Windows PowerShell
# This script helps deploy both frontend and backend to Vercel

Write-Host "🚀 Starting BRSR Calculator Vercel Deployment" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>$null
    if (-not $vercelVersion) {
        throw "Vercel CLI not found"
    }
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Cyan
try {
    $whoami = vercel whoami 2>$null
    if (-not $whoami) {
        throw "Not logged in"
    }
    Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "❌ Please log in to Vercel first:" -ForegroundColor Red
    Write-Host "vercel login" -ForegroundColor Yellow
    exit 1
}

# Function to deploy backend
function Deploy-Backend {
    Write-Host "🔧 Deploying Backend..." -ForegroundColor Cyan
    Set-Location "brsr_backend"
    
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install backend dependencies!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Set-Location ".."
}

# Function to deploy frontend
function Deploy-Frontend {
    Write-Host "🎨 Deploying Frontend..." -ForegroundColor Cyan
    Set-Location "brsr_frontend"
    
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build frontend!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Set-Location ".."
}

# Function to deploy both (monorepo style)
function Deploy-Monorepo {
    Write-Host "🔄 Deploying as monorepo..." -ForegroundColor Cyan
    
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "brsr_backend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install backend dependencies!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    Set-Location ".."
    
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "brsr_frontend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    Set-Location ".."
    
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Monorepo deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Monorepo deployment failed!" -ForegroundColor Red
        exit 1
    }
}

# Ask user for deployment method
Write-Host ""
Write-Host "Choose deployment method:" -ForegroundColor Cyan
Write-Host "1) Deploy Backend only" -ForegroundColor White
Write-Host "2) Deploy Frontend only" -ForegroundColor White
Write-Host "3) Deploy both separately" -ForegroundColor White
Write-Host "4) Deploy as monorepo (recommended)" -ForegroundColor White
$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Deploy-Backend
    }
    "2" {
        Deploy-Frontend
    }
    "3" {
        Deploy-Backend
        Deploy-Frontend
    }
    "4" {
        Deploy-Monorepo
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Set CORS_ORIGIN to your frontend URL" -ForegroundColor White
Write-Host "3. Set VITE_API_BASE_URL to your backend URL" -ForegroundColor White
Write-Host "4. Test the deployed application" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful commands:" -ForegroundColor Cyan
Write-Host "vercel env ls              # List environment variables" -ForegroundColor Yellow
Write-Host "vercel env add             # Add environment variable" -ForegroundColor Yellow
Write-Host "vercel logs                # View deployment logs" -ForegroundColor Yellow
Write-Host "vercel domains             # Manage custom domains" -ForegroundColor Yellow
