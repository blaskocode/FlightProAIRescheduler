#!/bin/bash

# FlightPro AI - Production Deployment Script
# This script helps automate the deployment process

set -e # Exit on error

echo "🚀 FlightPro AI - Production Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed.${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Vercel${NC}"
    echo "Logging you in..."
    vercel login
    echo ""
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"
echo ""

# Verify environment variables
echo "📋 Checking environment variables..."
echo ""
echo "Required variables for production:"
echo "  - DATABASE_URL"
echo "  - UPSTASH_REDIS_REST_URL"
echo "  - UPSTASH_REDIS_REST_TOKEN"
echo "  - FIREBASE_ADMIN_PROJECT_ID"
echo "  - FIREBASE_ADMIN_CLIENT_EMAIL"
echo "  - FIREBASE_ADMIN_PRIVATE_KEY"
echo "  - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "  - NEXT_PUBLIC_FIREBASE_APP_ID"
echo "  - NEXT_PUBLIC_APP_URL"
echo ""

read -p "Have you set all required environment variables in Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set environment variables first:"
    echo "  1. Visit: https://vercel.com/[your-username]/[project-name]/settings/environment-variables"
    echo "  2. Or run: vercel env add [VARIABLE_NAME]"
    echo ""
    echo "See ENVIRONMENT_VARIABLES.md for full list"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Environment variables confirmed${NC}"
echo ""

# Build check
echo "🏗️  Testing build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Ask about database migration
read -p "Have you pushed database schema to production? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  You need to push the database schema first${NC}"
    echo ""
    echo "Run these commands:"
    echo "  1. Update DATABASE_URL in .env to point to Neon production"
    echo "  2. npx prisma db push"
    echo "  3. (Optional) npx tsx scripts/create-demo-accounts.ts"
    echo ""
    read -p "Push schema now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing schema..."
        npx prisma db push
        echo ""
        read -p "Create demo accounts? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx tsx scripts/create-demo-accounts.ts
        fi
    else
        echo "Skipping database migration. Make sure to do this before deploying!"
    fi
fi

echo ""

# Deploy
echo "🚀 Deploying to production..."
echo ""

vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --prod 2>/dev/null | grep production | awk '{print $2}' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "⚠️  Could not automatically get deployment URL"
    echo "Please manually update NEXT_PUBLIC_APP_URL in Vercel"
else
    echo "📝 Your production URL: https://$DEPLOYMENT_URL"
    echo ""
    echo "Next steps:"
    echo "  1. Update NEXT_PUBLIC_APP_URL to: https://$DEPLOYMENT_URL"
    echo "  2. Update Firebase authorized domains to include: $DEPLOYMENT_URL"
    echo "  3. Redeploy with: vercel --prod"
    echo ""
fi

echo "🎉 Deployment complete!"
echo ""
echo "Verify your deployment:"
echo "  - Health check: https://$DEPLOYMENT_URL/api/health"
echo "  - App: https://$DEPLOYMENT_URL"
echo ""
echo "See PRODUCTION_DEPLOYMENT_GUIDE.md for post-deployment steps"

