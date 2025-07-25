# HalalCheck AI - Production Deployment Guide

🚀 **Make your platform live and ready for customers in under 30 minutes**

## Overview

This guide will help you deploy both your premium frontend (currently on localhost:3004) and working backend (localhost:3003) to production hosting platforms, making your HalalCheck AI platform accessible to customers worldwide.

## 🎯 Deployment Options

### Option 1: Vercel + Railway (Recommended)
- **Frontend**: Vercel (optimized for Next.js)
- **Backend**: Railway (easy Node.js deployment)
- **Cost**: ~$20-50/month total
- **Setup time**: 15-20 minutes

### Option 2: Full Railway Deployment
- **Both services**: Railway
- **Cost**: ~$25-40/month
- **Setup time**: 10-15 minutes

### Option 3: DigitalOcean App Platform
- **Both services**: DigitalOcean
- **Cost**: ~$30-60/month
- **Setup time**: 20-25 minutes

---

## 🚀 Option 1: Vercel + Railway (RECOMMENDED)

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   ```bash
   # Visit https://railway.app and sign up with GitHub
   # Install Railway CLI
   npm install -g @railway/cli
   railway login
   ```

2. **Prepare Backend for Deployment**
   ```bash
   # Create simple-server deployment folder
   mkdir halalcheck-backend-deploy
   cp simple-server.js halalcheck-backend-deploy/
   cp package.json halalcheck-backend-deploy/
   cd halalcheck-backend-deploy
   
   # Create production package.json
   cat > package.json << 'EOF'
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
   ```

3. **Deploy to Railway**
   ```bash
   # Initialize Railway project
   railway init
   
   # Set environment variables
   railway variables set OPENAI_API_KEY=your_openai_key_here
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   
   # Deploy
   railway up
   ```

4. **Get Backend URL**
   ```bash
   railway status
   # Note the URL (e.g., https://halalcheck-backend-production.up.railway.app)
   ```

### Step 2: Deploy Frontend to Vercel

1. **Prepare Frontend for Production**
   ```bash
   cd halalcheck-app
   
   # Update environment for production
   cat > .env.production << 'EOF'
   NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   NODE_ENV=production
   EOF
   ```

2. **Update API Configuration**
   ```bash
   # Edit src/lib/api.ts to use production URL
   # The NEXT_PUBLIC_API_URL will be automatically used
   ```

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   
   # Follow prompts:
   # - Link to existing project? No
   # - Project name: halalcheck-ai
   # - Directory: ./
   # - Override settings? No
   ```

4. **Configure Custom Domain (Optional)**
   ```bash
   # In Vercel dashboard, add your custom domain
   # Example: app.halalcheck.eu
   vercel domains add app.halalcheck.eu
   ```

### Step 3: Final Configuration

1. **Update CORS in Backend**
   ```javascript
   // In simple-server.js, update CORS origin:
   app.use(cors({
     origin: ['https://your-app.vercel.app', 'https://app.halalcheck.eu']
   }));
   ```

2. **Test Production Deployment**
   ```bash
   # Test backend health
   curl https://your-backend-url.up.railway.app/health
   
   # Test API endpoint
   curl -X POST https://your-backend-url.up.railway.app/api/analysis/analyze \
     -H "Content-Type: application/json" \
     -d '{"productName":"Test","ingredients":"sugar, salt"}'
   ```

---

## 🚀 Option 2: Full Railway Deployment

### Step 1: Deploy Backend

1. **Create Railway Project**
   ```bash
   railway login
   railway init halalcheck-backend
   
   # Copy backend files
   cp simple-server.js railway-backend/
   cd railway-backend
   ```

2. **Configure and Deploy**
   ```bash
   # Set environment variables
   railway variables set OPENAI_API_KEY=your_key
   railway variables set PORT=3001
   
   # Deploy
   railway up
   ```

### Step 2: Deploy Frontend

1. **Create Second Railway Service**
   ```bash
   railway init halalcheck-frontend
   cd halalcheck-frontend
   
   # Copy frontend files
   cp -r ../halalcheck-app/* .
   ```

2. **Configure Frontend**
   ```bash
   # Update package.json scripts
   cat > package.json << 'EOF'
   {
     "scripts": {
       "build": "next build",
       "start": "next start",
       "dev": "next dev"
     },
     "dependencies": {
       // ... your existing dependencies
     }
   }
   EOF
   
   # Set environment variables
   railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
   railway variables set NODE_ENV=production
   
   # Deploy
   railway up
   ```

---

## 🔧 Quick Production Checklist

### Before Going Live:

- [ ] **Environment Variables Set**
  - OpenAI API key configured
  - Production URLs updated
  - CORS origins configured

- [ ] **Test Core Features**
  - User registration works
  - Ingredient analysis works
  - PDF generation works
  - All pages load correctly

- [ ] **Performance Optimizations**
  - Frontend build completed
  - Images optimized
  - API responses cached

- [ ] **Security**
  - HTTPS enabled (automatic on Vercel/Railway)
  - Environment variables secured
  - No API keys in frontend code

### After Deployment:

- [ ] **Domain Setup** (if using custom domain)
  - DNS configured
  - SSL certificate active
  - Redirects working

- [ ] **Monitoring**
  - Error tracking setup
  - Performance monitoring
  - Uptime monitoring

---

## 🌐 Custom Domain Setup

### For Vercel:
1. Go to your Vercel dashboard
2. Select your project → Settings → Domains
3. Add your domain (e.g., `app.halalcheck.eu`)
4. Configure DNS with your registrar:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### For Railway:
1. Go to Railway dashboard → Your project → Settings
2. Add custom domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```

---

## 💰 Estimated Monthly Costs

### Vercel + Railway:
- **Vercel Pro**: $20/month (includes custom domains)
- **Railway**: $5-20/month (based on usage)
- **Total**: ~$25-40/month

### Alternative: All-in-One Solutions:
- **Railway**: $15-30/month
- **DigitalOcean**: $25-50/month
- **Heroku**: $25-50/month

---

## 🚀 30-Minute Quick Deploy

**For immediate customer outreach, use this fast track:**

```bash
# 1. Deploy backend to Railway (5 minutes)
railway login
railway init halalcheck-backend
cp simple-server.js package.json railway-backend/
cd railway-backend
railway variables set OPENAI_API_KEY=your_key
railway up

# 2. Deploy frontend to Vercel (5 minutes)
cd ../halalcheck-app
echo "NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app" > .env.production
vercel

# 3. Test deployment (2 minutes)
curl https://your-backend.up.railway.app/health
# Visit your Vercel URL and test analysis

# 4. Update marketing materials (3 minutes)
# Your app is now live at: https://your-app.vercel.app
```

---

## 🎯 Ready for Customer Outreach!

Once deployed, your platform will be:

✅ **Professional**: Running on enterprise-grade infrastructure  
✅ **Scalable**: Automatically handles traffic spikes  
✅ **Secure**: HTTPS enabled, environment variables protected  
✅ **Fast**: Optimized for global delivery  
✅ **Reliable**: 99.9% uptime guarantee  

**Your live platform URLs:**
- Frontend: `https://your-app.vercel.app`
- API: `https://your-backend.up.railway.app`

Start reaching out to potential customers immediately! 🚀

---

## 📞 Support

If you encounter any deployment issues:

1. **Check Railway logs**: `railway logs`
2. **Check Vercel logs**: Vercel dashboard → Functions tab
3. **Test API health**: `curl https://your-backend-url/health`
4. **Verify environment variables**: Railway/Vercel dashboard

Your HalalCheck AI platform is now production-ready and scalable for thousands of users! 🎉