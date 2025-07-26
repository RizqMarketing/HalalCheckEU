# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:3007 (Next.js in `halalcheck-app/`)
- **Backend**: http://localhost:3003 (simple-server.js in root) 

**To start the platform:**
1. Start backend: `cd "C:\Users\mazin\HalalCheck AI" && node simple-server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 3007`

## 🏗️ CORE ARCHITECTURE

### Dual Development Environment
**Current Active**: Simple server setup (simple-server.js + halalcheck-app)
**Full Stack**: Dockerized backend/frontend architecture (currently inactive)

**Switch between environments:**
- **Simple**: Use commands above for rapid development
- **Full Stack**: `npm run dev` (Docker), `npm run build`, `npm run start`

### Critical Architecture Components

#### **1. Multi-Organization System**
**Core Files:**
- `halalcheck-app/src/lib/organization-context.ts` - Configuration for 2 organization types
- `halalcheck-app/src/contexts/organization-context.tsx` - React context provider
- `halalcheck-app/src/components/DevelopmentOrgSwitcher.tsx` - Organization switching UI

**Organization Types:**
- **Certification Body**: Applications → Certificates (New → Under Review → Approved → Certified)
- **Food Manufacturer**: Products → Development (Recipe → Testing → Documentation → Certification Ready)

**Key Concept**: All UI terminology, pipeline stages, and workflows dynamically adapt based on selected organization type.

#### **2. Data Management System**
**Core File:** `halalcheck-app/src/lib/data-manager.ts`
- Singleton pattern managing Applications ↔ Certificates synchronization
- Organization-aware status handling (supports dynamic pipeline stages)
- Event subscription system for real-time UI updates
- Local storage persistence with automatic sync

#### **3. AI Analysis Engine**
**Backend:** `simple-server.js` (lines 14-200+) - Verified Fatwa Database integration
**Frontend:** `halalcheck-app/src/app/dashboard/analyze/page.tsx` - 24-hour persistent analysis sessions
**Database:** `halalcheck-app/src/lib/islamic-jurisprudence.ts` - 200+ ingredients with Quranic references

**Key Features:**
- OCR document processing (Tesseract.js)
- Multi-format support (PDF, DOCX, CSV, images)
- Client management system with bulk processing
- State persistence across browser sessions

#### **4. Security & Religious Compliance**
- EU GDPR compliance by design
- Islamic jurisprudence accuracy protocols
- Multi-source verification system
- Expert validation requirements for sensitive ingredients

## 🔧 COMMON DEVELOPMENT COMMANDS

### Development Workflow
```bash
# Start development servers
node simple-server.js                                    # Backend on :3003
cd halalcheck-app && npm run dev -- --port 3007         # Frontend on :3007

# Alternative Docker workflow (currently inactive)
npm run dev                                              # Start both with Docker
npm run dev:build                                       # Force rebuild containers
npm run dev:down                                        # Stop containers
```

### Testing & Quality
```bash
# Run tests
npm test                           # Full stack tests
npm run test:multi-org            # Multi-organization workflow tests
npm run test:backend              # Backend unit tests
npm run test:frontend             # Frontend tests
npm run test:e2e                  # Playwright end-to-end tests

# Code quality
npm run lint                      # Lint both backend and frontend
npm run lint:backend             # Backend ESLint
npm run lint:frontend            # Frontend Next.js linting
```

### Production & Deployment
```bash
# Build
npm run build                     # Build both backend and frontend
npm run build:backend            # TypeScript compilation
npm run build:frontend           # Next.js production build

# Production deployment
npm run prod                      # Start production containers
npm run prod:build              # Build and start production
```

## 📁 PROJECT STRUCTURE UNDERSTANDING

### Frontend Architecture (`halalcheck-app/`)
```
src/
├── app/                         # Next.js 14 App Router
│   ├── dashboard/              # Main application dashboard
│   │   ├── analyze/           # AI ingredient analysis tool
│   │   ├── applications/      # Organization-specific pipeline management
│   │   ├── certificates/      # Certificate management
│   │   └── page.tsx          # Dynamic dashboard adapting to org type
│   ├── layout.tsx            # Root layout with OrganizationProvider
│   └── page.tsx              # Landing page
├── lib/                       # Core business logic
│   ├── organization-context.ts    # Organization configurations & types
│   ├── data-manager.ts            # Centralized data management
│   ├── islamic-jurisprudence.ts   # Islamic law ingredient database
│   └── api.ts                     # Backend communication
├── contexts/                  # React contexts
│   └── organization-context.tsx   # Organization state management
└── components/               # Reusable UI components
    └── DevelopmentOrgSwitcher.tsx # Organization switching interface
```

### Backend Architecture
**Simple Server** (`simple-server.js`): Single-file Express server for rapid development
**Full Backend** (`backend/src/`): Complete TypeScript architecture with:
- Controllers, services, middleware
- Database migrations and seeding
- Comprehensive testing suite
- Security and authentication layers

### Key Integration Points
1. **Organization Context Flow**: `organization-context.ts` → `organization-context.tsx` → all UI components
2. **Data Flow**: `data-manager.ts` ↔ `simple-server.js` ↔ local storage
3. **Analysis Flow**: Frontend upload → `simple-server.js` → OpenAI GPT-4 → Islamic database validation

## 💡 STRATEGIC CONTEXT

### Target Market Focus
**Primary Users:** European halal certification bodies and food manufacturers
**Removed:** Import/export workflow (deleted to focus on core 2-sided market)

### Solopreneur Development Approach
- Prioritize high-impact features with minimal capital investment
- Leverage AI and automation for maximum individual productivity
- Focus on lean development with quick iteration cycles
- Prefer simple, reliable solutions over complex architectures

### Technical Decisions
- **Simple Server**: Chosen over full backend for rapid prototyping and deployment
- **Organization Context**: Enables single codebase to serve multiple user types
- **Local Storage**: Reduces infrastructure costs while maintaining functionality
- **Next.js App Router**: Modern React patterns with excellent TypeScript support

## 🚨 CRITICAL IMPLEMENTATION NOTES

### Organization System
- All UI text, pipeline stages, and workflows are dynamically generated
- Never hardcode organization-specific terminology or stages
- Always use `useOrganization()` hook for context-aware components
- Test organization switching thoroughly when making UI changes

### Data Management
- Applications can have organization-specific statuses
- `data-manager.ts` handles automatic synchronization
- State changes trigger UI updates through subscription pattern
- Local storage keys are prefixed with organization type

### Islamic Compliance
- Never modify Islamic jurisprudence database without expert consultation
- All ingredient classifications include Quranic/Hadith references
- Confidence scores must reflect scholarly consensus accuracy
- Religious sensitivity is paramount in all user-facing content

### Performance Considerations
- Analysis sessions persist for 24 hours to improve UX
- Bulk processing optimized for large ingredient lists
- OCR processing happens client-side to reduce server load
- File uploads handled with proper security validation