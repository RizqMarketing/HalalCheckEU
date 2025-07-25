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
- Frontend: `halalcheck-app/src/app/` (Next.js App Router pages)
- API Client: `halalcheck-app/src/lib/api.ts` (centralized API communications)
- Data Manager: `halalcheck-app/src/lib/data-manager.ts` (singleton state management)
- Environment: `halalcheck-app/.env.local` (points to localhost:3003)

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
- **AI/ML**: OpenAI GPT-4o + custom validation layers (confidence removed for simplicity)
- **Database**: File-based + In-memory (simple setup)
- **Payments**: Stripe integration ready
- **Infrastructure**: Direct Node.js processes (Docker available as alternative)

### Core Business Systems
1. **AI Ingredient Analysis** - GPT-4o powered halal/haram classification, streamlined without confidence percentages
2. **Multi-tenant RBAC** - 6 user roles across organizations (SUPER_ADMIN → VIEWER)
3. **File Processing Pipeline** - 25+ formats, OCR with Tesseract.js, batch processing
4. **Subscription Management** - Usage-based billing with trial → paid conversion
5. **Professional Reporting** - PDF generation for certification bodies
6. **Dynamic Pipeline Management** - Customizable workflow stages for different business needs
7. **Comprehensive Audit Trail** - All user actions logged for compliance

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

## 🔧 Development Patterns & Architecture

### Current Active Backend (`simple-server.js`)
- **Single File Server**: Express.js with all routes in one file for simplicity
- **OpenAI Integration**: GPT-4o for ingredient analysis (confidence calculation removed)
- **File Processing**: Multer for CSV uploads, custom parsing functions  
- **Authentication**: Mock JWT tokens for demo/trial functionality
- **Storage**: In-memory/file-based for trial, ready for PostgreSQL/Redis scaling

### Frontend Architecture (Next.js 14)
- **App Router**: File-based routing in `src/app/` directory
- **Centralized State**: Singleton `dataManager` class for Applications/Certificates/Analytics
- **State Persistence**: localStorage with 24-hour auto-expiry for analysis dashboard
- **API Layer**: Single `apiService` class handling all backend communications
- **Client-side Workflow**: Analysis → Applications → Certificates → Analytics pipeline
- **Searchable Client Management**: Real-time client search with inline creation capability
- **Dynamic Pipeline Stages**: Custom workflow stages with localStorage persistence

### Key Data Flow Patterns
1. **Analysis Workflow**: User input → OpenAI API → LocalStorage → Application pipeline (confidence removed)
2. **State Management**: DataManager singleton syncs Applications ↔ Certificates with auto-generated relationships
3. **Client Management**: Searchable dropdown with inline client creation + auto-assignment to analysis results
4. **Bulk Processing**: Single application entry OR multiple separate applications for bulk analysis
5. **Real-time Updates**: DataManager notifies components via subscriber pattern for dashboard sync
6. **Pipeline Customization**: Custom stages stored in localStorage, responsive grid layout adapts to column count

### UI/UX Patterns
- **Smart Reset Controls**: "State saved" indicators with selective clear options
- **Workflow Integration**: Each analysis can be saved directly to application pipeline
- **Client Assignment**: Pre-select clients + inline creation to auto-populate analysis results
- **State Restoration**: Automatic restore of analysis work when returning to page
- **Searchable Interfaces**: Real-time client filtering by name, company, or email
- **Dynamic Pipelines**: Add/remove/rename custom workflow stages with visual feedback
- **Professional Styling**: Consistent gradient designs, hover effects, and responsive layouts

## 💼 Business Model & Pricing

### Target Market (EU Focus)
- **245+ Halal Certification Bodies** - Primary revenue source
- **2,000+ Food Manufacturers** - Pre-certification validation
- **300+ Import/Export Companies** - Compliance automation

### Current Subscription Tiers (Updated)
- **Professional**: €299/month, 200 analyses
- **Enterprise**: €799/month, 1,000 analyses (Most Popular)
- **Enterprise Plus**: €1,999/month, unlimited analyses + custom features

### Analysis Workflow
1. User uploads ingredient list (text/image/file) → Usage tracking
2. AI processes with GPT-4o → Results without confidence percentages
3. Professional report generated → PDF storage
4. Activity logged → Organization audit trail
5. Billing calculated → Stripe subscription updates

## 🔄 Recent Platform Enhancements

### Advanced Client Management
- **Searchable Client Selection**: Real-time filtering by name, company, email
- **Inline Client Creation**: Create new clients directly in analysis tool without page navigation
- **Auto-assignment**: New clients automatically selected for current analysis session
- **Cross-mode Sync**: Client selection synced between single and bulk analysis modes

### Dynamic Pipeline Management
- **Custom Workflow Stages**: Add unlimited custom stages beyond default (New → Review → Approved → Certified)
- **Stage Management**: Rename stages by clicking, remove with confirmation dialog
- **Responsive Layout**: Grid adapts from 4→6→unlimited columns based on stage count
- **Safe Deletion**: Applications in deleted stages moved to "New Applications"
- **Persistent Storage**: Custom stages saved in localStorage and restored on page load

### Streamlined Analysis Process
- **Confidence Removal**: Simplified analysis results without potentially misleading confidence percentages
- **Format Flexibility**: AI handles any document format without restrictions
- **Enhanced State Management**: 24-hour analysis state persistence with smart reset controls
- **Bulk Optimization**: Improved bulk upload UI with professional button styling

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
- **Analysis Engine**: `simple-server.js` (analyzeWithGPT4 function, confidence calculation removed)
- **User Management**: `simple-server.js` (mock auth endpoints)
- **Data Management**: `halalcheck-app/src/lib/data-manager.ts` (singleton pattern)
- **Dashboard Pages**: `halalcheck-app/src/app/dashboard/` (analyze, applications, certificates, analytics)
- **API Service**: `halalcheck-app/src/lib/api.ts` (centralized backend communication)

## 🔄 Common Development Tasks

### Modifying Analysis Logic
1. **AI Prompts**: Update `analyzeWithGPT4()` system/user messages in `simple-server.js`
2. **Result Processing**: Edit `parseAIResponse()` in `simple-server.js`
3. **UI State**: Analysis form state managed in `halalcheck-app/src/app/dashboard/analyze/page.tsx`
4. **Client Management**: Search and creation logic in analyze page component

### Adding New Dashboard Pages
1. Create page in `halalcheck-app/src/app/dashboard/[pagename]/page.tsx`
2. Add navigation link in main dashboard layout
3. Use `dataManager` for data access and `apiService` for backend calls
4. Follow existing patterns for state management and responsive design

### Pipeline Customization
1. **Custom Stages**: Managed in `applications/page.tsx` with localStorage persistence
2. **Stage Management**: Add/remove/rename functionality with confirmation dialogs
3. **Responsive Layout**: Grid system adapts to number of columns automatically
4. **Data Safety**: Applications automatically migrated when stages are deleted

### Client Management Enhancement
1. **Search Functionality**: Real-time filtering in dropdown components
2. **Inline Creation**: Modal forms for client creation without navigation
3. **Auto-assignment**: Newly created clients automatically selected for analysis
4. **Cross-mode Sync**: Client selection synchronized across analysis modes

### Backend API Extensions
1. **New Endpoints**: Add routes directly to `simple-server.js` 
2. **File Processing**: Use existing `multer` setup and parsing functions
3. **OpenAI Integration**: Extend `analyzeWithGPT4()` function for new analysis types
4. **Mock Authentication**: Extend existing JWT token system for new features

## 🎯 Platform-Specific Development Notes

### Analysis Tool Enhancements
- Client search state managed with `clientSearch` and `bulkClientSearch` variables
- New client creation handled by `handleCreateNewClient()` function
- State persistence includes client selection in localStorage with 24-hour expiry
- Dropdown visibility controlled by `showClientDropdown` and `showBulkClientDropdown`

### Pipeline Management
- Custom columns stored in localStorage as `pipeline-custom-columns`
- Default columns protected with `isDefault: true` flag
- Stage deletion moves applications to 'new' status safely
- Responsive grid uses Tailwind classes for different column counts

### State Management Philosophy
- DataManager singleton provides centralized application/certificate data
- localStorage used for user session state (analysis, custom stages)
- Real-time updates via subscriber pattern for dashboard synchronization
- State restoration on page load with validation and error handling

### UI/UX Consistency
- Green styling (#10B981) for creation/positive actions
- Purple styling (#7C3AED) for custom features
- Gradient designs for CTAs and important buttons
- Hover effects and transitions for professional feel
- Responsive design with mobile-first approach