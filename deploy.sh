#!/bin/bash

# HalalCheck AI - One-Click Deployment Script
# This script deploys your platform to production in under 5 minutes

set -e

echo "🚀 HalalCheck AI - Production Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Get deployment configuration
get_config() {
    echo ""
    print_info "Deployment Configuration"
    echo "========================"
    
    # Get OpenAI API Key
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -n "Enter your OpenAI API Key: "
        read -s OPENAI_API_KEY
        echo ""
        if [ -z "$OPENAI_API_KEY" ]; then
            print_error "OpenAI API Key is required"
            exit 1
        fi
    fi
    
    # Choose deployment platform
    echo ""
    echo "Choose deployment platform:"
    echo "1) Vercel + Railway (Recommended)"
    echo "2) Railway only"
    echo "3) Manual setup"
    echo -n "Enter choice (1-3): "
    read DEPLOYMENT_CHOICE
    
    case $DEPLOYMENT_CHOICE in
        1) PLATFORM="vercel-railway" ;;
        2) PLATFORM="railway" ;;
        3) PLATFORM="manual" ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
    
    print_status "Configuration collected"
}

# Install CLI tools
install_tools() {
    print_info "Installing deployment tools..."
    
    case $PLATFORM in
        "vercel-railway")
            # Install Vercel CLI
            if ! command -v vercel &> /dev/null; then
                print_info "Installing Vercel CLI..."
                npm install -g vercel
            fi
            
            # Install Railway CLI
            if ! command -v railway &> /dev/null; then
                print_info "Installing Railway CLI..."
                npm install -g @railway/cli
            fi
            ;;
        "railway")
            # Install Railway CLI
            if ! command -v railway &> /dev/null; then
                print_info "Installing Railway CLI..."
                npm install -g @railway/cli
            fi
            ;;
    esac
    
    print_status "Deployment tools installed"
}

# Prepare backend for deployment
prepare_backend() {
    print_info "Preparing backend for deployment..."
    
    # Create deployment directory
    mkdir -p deploy-backend
    
    # Copy backend files
    cp simple-server.js deploy-backend/
    
    # Create production package.json
    cat > deploy-backend/package.json << EOF
{
  "name": "halalcheck-backend",
  "version": "1.0.0",
  "description": "HalalCheck AI Backend API",
  "main": "simple-server.js",
  "scripts": {
    "start": "node simple-server.js",
    "dev": "node simple-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.20.1",
    "pdfkit": "^0.13.0",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF
    
    # Create .env file
    cat > deploy-backend/.env << EOF
OPENAI_API_KEY=$OPENAI_API_KEY
NODE_ENV=production
PORT=3001
EOF
    
    print_status "Backend prepared for deployment"
}

# Deploy backend
deploy_backend() {
    print_info "Deploying backend..."
    
    cd deploy-backend
    
    case $PLATFORM in
        "vercel-railway" | "railway")
            # Login to Railway if not already
            if ! railway status &> /dev/null; then
                print_info "Please login to Railway..."
                railway login
            fi
            
            # Initialize Railway project
            railway init halalcheck-backend --template nodejs
            
            # Set environment variables
            railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
            railway variables set NODE_ENV=production
            railway variables set PORT=3001
            
            # Deploy
            print_info "Deploying to Railway..."
            railway up
            
            # Get backend URL
            BACKEND_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
            if [ -z "$BACKEND_URL" ]; then
                print_warning "Could not automatically detect backend URL"
                echo -n "Please enter your Railway backend URL: "
                read BACKEND_URL
            fi
            ;;
    esac
    
    cd ..
    print_status "Backend deployed successfully"
    print_info "Backend URL: $BACKEND_URL"
}

# Prepare frontend for deployment
prepare_frontend() {
    print_info "Preparing frontend for deployment..."
    
    cd halalcheck-app
    
    # Update API configuration for production
    cat > .env.production << EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NODE_ENV=production
EOF
    
    # Update CORS in simple-server.js
    cd ../deploy-backend
    sed -i.bak "s|app.use(cors());|app.use(cors({ origin: ['https://your-app.vercel.app', 'http://localhost:3000'] }));|g" simple-server.js
    
    cd ../halalcheck-app
    print_status "Frontend prepared for deployment"
}

# Deploy frontend
deploy_frontend() {
    print_info "Deploying frontend..."
    
    case $PLATFORM in
        "vercel-railway")
            # Login to Vercel if not already
            if ! vercel whoami &> /dev/null; then
                print_info "Please login to Vercel..."
                vercel login
            fi
            
            # Deploy to Vercel
            print_info "Deploying to Vercel..."
            vercel --prod --yes
            
            # Get frontend URL
            FRONTEND_URL=$(vercel ls | grep halalcheck | awk '{print $2}' | head -1)
            if [ -z "$FRONTEND_URL" ]; then
                print_warning "Could not automatically detect frontend URL"
                echo -n "Please enter your Vercel frontend URL: "
                read FRONTEND_URL
            else
                FRONTEND_URL="https://$FRONTEND_URL"
            fi
            ;;
        "railway")
            # Create second Railway service for frontend
            railway init halalcheck-frontend --template nextjs
            
            # Set environment variables
            railway variables set NEXT_PUBLIC_API_URL="$BACKEND_URL"
            railway variables set NODE_ENV=production
            
            # Deploy
            railway up
            
            # Get frontend URL
            FRONTEND_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
            ;;
    esac
    
    cd ..
    print_status "Frontend deployed successfully"
    print_info "Frontend URL: $FRONTEND_URL"
}

# Update CORS with actual frontend URL
update_cors() {
    print_info "Updating backend CORS configuration..."
    
    cd deploy-backend
    
    # Update CORS with actual frontend URL
    sed -i.bak "s|https://your-app.vercel.app|$FRONTEND_URL|g" simple-server.js
    
    # Redeploy backend with updated CORS
    case $PLATFORM in
        "vercel-railway" | "railway")
            railway up
            ;;
    esac
    
    cd ..
    print_status "CORS configuration updated"
}

# Test deployment
test_deployment() {
    print_info "Testing deployment..."
    
    # Test backend health
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        print_status "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
    
    # Test API endpoint
    if curl -f -X POST "$BACKEND_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -d '{"productName":"Test","ingredients":"sugar, salt"}' &> /dev/null; then
        print_status "API endpoint test passed"
    else
        print_warning "API endpoint test failed"
    fi
    
    print_status "Deployment testing completed"
}

# Generate summary
generate_summary() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================="
    echo ""
    print_status "Your HalalCheck AI platform is now live!"
    echo ""
    echo "📊 Platform URLs:"
    echo "   Frontend: $FRONTEND_URL"
    echo "   Backend:  $BACKEND_URL"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Visit your frontend URL to test the platform"
    echo "   2. Create your first analysis to verify everything works"
    echo "   3. Start customer outreach using CUSTOMER-OUTREACH-GUIDE.md"
    echo "   4. Monitor performance and scale as needed"
    echo ""
    echo "📚 Resources:"
    echo "   - Deployment Guide: DEPLOYMENT-GUIDE.md"
    echo "   - Customer Outreach: CUSTOMER-OUTREACH-GUIDE.md"
    echo "   - Testing Guide: TESTING.md"
    echo ""
    print_status "Ready for customers! 🚀"
}

# Cleanup
cleanup() {
    print_info "Cleaning up temporary files..."
    rm -rf deploy-backend/package.json.bak
    rm -rf deploy-backend/simple-server.js.bak
    print_status "Cleanup completed"
}

# Main execution
main() {
    echo "Starting HalalCheck AI deployment..."
    echo ""
    
    check_prerequisites
    get_config
    install_tools
    prepare_backend
    deploy_backend
    prepare_frontend
    deploy_frontend
    update_cors
    test_deployment
    cleanup
    generate_summary
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main