# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:3004 (Next.js in `halalcheck-app/`)
- **Backend**: http://localhost:3003 (simple-server.js in root)

**To start the platform:**
1. Start backend: `cd "C:\Users\mazin\HalalCheck AI" && node simple-server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 3004`

**Key files:**
- Backend API: `simple-server.js` (OpenAI integration, auth endpoints)
- Frontend: `halalcheck-app/src/app/` (Next.js pages)
- API config: `halalcheck-app/.env.local` (points to localhost:3003)

## 🚀 Quick Start Commands

### Current Development Setup (ACTIVE)
```bash
# CURRENT ACTIVE SERVICES:
# Frontend: http://localhost:3004 (Next.js)
# Backend:  http://localhost:3003 (simple-server.js)

# Start backend (required)
cd "C:\Users\mazin\HalalCheck AI"
node simple-server.js

# Start frontend (required) 
cd "C:\Users\mazin\HalalCheck AI\halalcheck-app"
npm run dev -- --port 3004

# Test services
curl http://localhost:3003/health      # Backend health check
curl http://localhost:3004             # Frontend check
```

### Legacy Commands (Docker - not currently used)
```bash
# Full stack with Docker (alternative setup)
npm run dev                # Backend on :3001, Frontend on :3000

# Individual services (legacy)
npm run dev:backend        # Backend API on :3001
npm run dev:frontend       # Frontend on :3000

# Database operations (for full stack setup)
npm run db:migrate         # Run database migrations
npm run db:seed            # Seed test data
npm run validate:ingredients  # Validate ingredient database
```

### Testing & Quality
```bash
# Comprehensive testing
npm test                    # Full test suite
./scripts/test-full-stack.sh  # Complete platform test
npm run test:e2e           # Playwright E2E tests
npm run test:integration   # API integration tests

# Code quality
npm run lint               # Lint both frontend/backend
npm run lint:backend       # Backend ESLint
npm run lint:frontend      # Frontend ESLint
```

### Production & Deployment
```bash
# Production build and start
npm run build             # Build both services
npm run prod              # Start production with monitoring
npm run prod:build        # Build and start production

# Deployment utilities
./deploy.sh               # One-click deployment script
npm run backup            # Backup database and files
npm run logs              # View Docker logs
npm run clean             # Clean Docker system
```

## 🏗️ Architecture Overview

### Multi-Service Architecture
**HalalCheck AI** is a **multi-tenant B2B SaaS platform** targeting European halal certification bodies, food manufacturers, and import/export companies.

### Tech Stack
- **Backend**: Node.js + Express (simple-server.js) → **Port 3003** ⚡ ACTIVE
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS → **Port 3004** ⚡ ACTIVE  
- **AI/ML**: OpenAI GPT-4o + custom validation layers
- **Database**: File-based + In-memory (simple setup)
- **Payments**: Stripe integration ready
- **Infrastructure**: Direct Node.js processes (Docker available as alternative)

### Core Business Systems
1. **AI Ingredient Analysis** - GPT-4o powered halal/haram classification with 99%+ accuracy
2. **Multi-tenant RBAC** - 6 user roles across organizations (SUPER_ADMIN → VIEWER)
3. **File Processing Pipeline** - 25+ formats, OCR with Tesseract.js, batch processing
4. **Subscription Management** - Usage-based billing with trial → paid conversion
5. **Professional Reporting** - PDF generation for certification bodies
6. **Comprehensive Audit Trail** - All user actions logged for compliance

### Key Directories
```
├── simple-server.js      # 🚀 ACTIVE BACKEND (Port 3003)
├── halalcheck-app/       # 🚀 ACTIVE FRONTEND (Port 3004)
│   ├── src/app/          # App Router pages  
│   ├── src/components/   # React components
│   └── src/lib/          # Utilities and API client
├── backend/              # Full Express.js API server (alternative)
│   ├── src/server.ts     # Alternative entry point
│   ├── src/routes/       # API endpoints
│   └── database/         # Migrations and schema  
├── scripts/              # Deployment and testing scripts
├── tests/e2e/           # Playwright end-to-end tests
├── monitoring/          # Prometheus configuration
└── nginx/               # Reverse proxy configuration
```

## 🔧 Development Patterns

### Backend API Structure
- **Routes**: RESTful API in `backend/src/routes/`
- **Authentication**: JWT tokens with role-based access control
- **Database**: PostgreSQL with Redis caching for analysis results
- **File Processing**: Multer for uploads, multiple format parsers
- **AI Integration**: OpenAI API with fallback and error handling

### Frontend Architecture
- **App Router**: Next.js 14 with TypeScript and Tailwind CSS
- **State Management**: React hooks with API service layer
- **Authentication**: Token-based with protected routes
- **UI Components**: Custom components built with Tailwind
- **API Integration**: Centralized API client in `src/lib/api.ts`

### Database Schema
- **Multi-tenancy**: Organization-based data isolation
- **User Management**: RBAC with role hierarchy
- **Analysis Storage**: Results cached in Redis, metadata in PostgreSQL
- **Audit Logging**: Complete activity trail for compliance

## 💼 Business Model & Pricing

### Target Market (EU Focus)
- **245+ Halal Certification Bodies** - Primary revenue source
- **2,000+ Food Manufacturers** - Pre-certification validation
- **300+ Import/Export Companies** - Compliance automation

### Subscription Tiers
- **Trial**: 14 days, 50 analyses (conversion focus)
- **Starter**: €99/month, 100 analyses
- **Professional**: €299/month, 500 analyses  
- **Enterprise**: €899/month, unlimited + custom features

### Analysis Workflow
1. User uploads ingredient list (text/image/file) → Usage tracking
2. AI processes with GPT-4o → Results cached in Redis  
3. Professional report generated → PDF storage
4. Activity logged → Organization audit trail
5. Billing calculated → Stripe subscription updates

## 🐳 Docker & Infrastructure

### Development Environment
- **PostgreSQL 15**: Health checks, persistent volumes
- **Redis 7**: Caching layer for AI results
- **Hot Reload**: Both frontend and backend watch for changes
- **Nginx**: Reverse proxy with SSL termination

### Production Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Performance dashboards  
- **Health Checks**: All services monitored
- **Log Aggregation**: Centralized logging

## 🔒 Security & Compliance

### Built-in Security
- **GDPR Compliance**: EU data protection by design
- **Religious Sensitivity**: Islamic dietary law precision protocols
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive sanitization
- **Audit Trail**: Complete activity logging for certification bodies

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with refresh
- **Role-Based Access**: 6-tier permission system
- **Multi-tenant Isolation**: Organization data separation
- **Session Management**: Secure token handling

## 🚀 Deployment & Production

### Quick Production Deployment
```bash
# One-click deployment to Vercel + Railway
./deploy.sh

# Or manual Docker production
npm run prod:build
```

### Environment Configuration
Required `.env` variables:
- `OPENAI_API_KEY` - GPT-4o API access
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Cache connection
- `STRIPE_SECRET_KEY` - Payment processing
- `JWT_SECRET` - Token signing

## ⚡ Quick Navigation

### Core Entry Points (CURRENT ACTIVE SETUP)
- **🚀 Backend API**: `simple-server.js` (Port 3003)
- **🚀 Frontend App**: `halalcheck-app/src/app/page.tsx` (Port 3004)
- **🚀 API Client**: `halalcheck-app/src/lib/api.ts`
- **🚀 Environment**: `halalcheck-app/.env.local`

### Alternative Entry Points (Full Stack)
- **Backend API**: `backend/src/server.ts`  
- **Database Schema**: `backend/database/schema.sql`

### Development Files
- **Docker Dev**: `docker-compose.dev.yml`
- **Production**: `docker-compose.prod.yml`
- **Testing**: `scripts/test-full-stack.sh`
- **Deployment**: `deploy.sh`

### Business Logic
- **Analysis Engine**: `backend/src/services/analysis.ts`
- **User Management**: `backend/src/routes/auth.ts`
- **Subscription**: `backend/src/routes/billing.ts`
- **Dashboard**: `halalcheck-app/src/app/dashboard/`