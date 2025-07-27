# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:4000 (Next.js in `halalcheck-app/`)
- **Backend**: http://localhost:3003 (Agent-based system via `simple-agent-server.js`) 

**To start the platform:**
1. Start agent-based backend: `cd "C:\Users\mazin\HalalCheck AI" && node simple-agent-server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 4000`

**Alternative startup methods:**
- Complete system: `node start-complete-system.js` (starts both backend and frontend)
- Agent system only: `node start-agent-system.js` 
- Test agent system: `node test-agent-system.js`

## 🏗️ CORE ARCHITECTURE

### Agent-Based Backend Architecture
**Current Active**: Agent-based system (`simple-agent-server.js` + `halalcheck-app`)
**Legacy**: TypeScript agent system (`agents/` directory - more complex, currently inactive)
**Full Stack**: Dockerized backend/frontend architecture (currently inactive)

**Agent System Components:**
- **4 Core Agents**: Islamic Analysis, Document Processing, Organization Workflow, Certificate Generation
- **Event-Driven Communication**: Real-time inter-agent messaging
- **API Adapter**: Backward compatibility with existing frontend
- **Agent Orchestrator**: Workflow coordination and execution

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

#### **3. Agent-Based Analysis Engine**
**Backend:** `simple-agent-server.js` - Agent-powered analysis with Islamic jurisprudence
**Agents Directory:** `agents/` - Full TypeScript agent system (inactive but available)
**Frontend:** `halalcheck-app/src/app/dashboard/analyze/page.tsx` - 24-hour persistent analysis sessions
**Database:** `halalcheck-app/src/lib/islamic-jurisprudence.ts` - 200+ ingredients with Quranic references

**Agent Capabilities:**
- **Islamic Analysis Agent**: Halal/haram classification with 200+ ingredient database
- **Document Processing Agent**: OCR, PDF, Excel processing with intelligent extraction
- **Organization Workflow Agent**: Multi-org support and dynamic workflow management
- **Certificate Generation Agent**: Professional PDF certificate creation with QR codes

**Key Features:**
- Real-time agent communication via Event Bus
- Intelligent workflow orchestration
- Multi-format document processing (PDF, DOCX, CSV, images)
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
# Start agent-based development servers
node simple-agent-server.js                             # Agent backend on :3003
cd halalcheck-app && npm run dev -- --port 4000         # Frontend on :4000

# Complete system startup
node start-complete-system.js                           # Start both backend and frontend with tests

# Agent system management
node start-agent-system.js                              # Start only agent backend
node test-agent-system.js                               # Run comprehensive agent tests

# Legacy workflow (currently inactive)
npm run dev                                              # Start both with Docker
npm run dev:build                                       # Force rebuild containers
npm run dev:down                                        # Stop containers
```

### Testing & Quality
```bash
# Agent system tests
node test-agent-system.js         # Comprehensive agent system integration tests

# Full stack tests
npm test                           # Full stack tests
npm run test:multi-org            # Multi-organization workflow tests
npm run test:backend              # Backend unit tests
npm run test:frontend             # Frontend tests
npm run test:e2e                  # Playwright end-to-end tests

# Code quality
npm run lint                      # Lint both backend and frontend
npm run lint:backend             # Backend ESLint
npm run lint:frontend            # Frontend Next.js linting
cd halalcheck-app && npm run lint # Next.js specific linting
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
**Agent-Based Server** (`simple-agent-server.js`): Agent-powered Express server with:
- 4 intelligent agents for specialized processing
- Event-driven inter-agent communication
- Islamic jurisprudence integration
- Real-time workflow orchestration

**TypeScript Agent System** (`agents/` directory): Full agent architecture with:
- `agents/islamic-analysis/` - Islamic analysis with 200+ ingredient database
- `agents/document-processing/` - OCR and document parsing capabilities  
- `agents/organization-workflow/` - Multi-organization workflow management
- `agents/certificate-generation/` - Professional certificate generation
- `agents/core/` - Event bus, orchestrator, and registry infrastructure

**Full Backend** (`backend/src/`): Complete TypeScript architecture with:
- Controllers, services, middleware
- Database migrations and seeding
- Comprehensive testing suite
- Security and authentication layers

### Key Integration Points
1. **Organization Context Flow**: `organization-context.ts` → `organization-context.tsx` → all UI components
2. **Agent Data Flow**: `data-manager.ts` ↔ `simple-agent-server.js` ↔ local storage
3. **Agent Analysis Flow**: Frontend upload → `simple-agent-server.js` → Agent system → Islamic database validation
4. **Event-Driven Communication**: Agent → Event Bus → Other Agents → Orchestrator → API Response

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
- **Agent-Based Architecture**: Intelligent, scalable system with specialized agents for different concerns
- **Simple Agent Server**: Chosen over complex TypeScript system for rapid development and deployment
- **Organization Context**: Enables single codebase to serve multiple user types
- **Local Storage**: Reduces infrastructure costs while maintaining functionality
- **Next.js App Router**: Modern React patterns with excellent TypeScript support
- **Event-Driven Design**: Real-time agent communication for responsive and scalable processing

## 🤖 CLAUDE CODE SUBAGENTS

This repository includes 6 specialized Claude Code subagents in `.claude/subagents/` that automatically assist with development:

### Expert Subagents
1. **islamic-jurisprudence-expert** - Islamic dietary laws, halal/haram classifications, Quranic references
2. **agent-system-developer** - Agent architecture, event-driven systems, TypeScript agent development  
3. **nextjs-react-expert** - Next.js 14 App Router, React components, frontend optimization
4. **api-testing-integration** - API testing, integration testing, system validation
5. **multi-org-developer** - Multi-organization features, dynamic terminology, adaptive UI
6. **performance-security-auditor** - Performance optimization, security auditing, monitoring

### Automatic Invocation
Claude Code will automatically call the appropriate subagent based on your request:
- Working on Islamic logic → **islamic-jurisprudence-expert**
- Creating agents → **agent-system-developer** 
- Building React components → **nextjs-react-expert**
- Testing APIs → **api-testing-integration**
- Adding org features → **multi-org-developer**
- Optimizing performance → **performance-security-auditor**

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

### Agent System Considerations
- Agent communication is event-driven and asynchronous
- Islamic Analysis Agent includes 200+ ingredient database with Quranic references
- Document Processing Agent handles OCR, PDF, Excel with intelligent extraction
- Organization Workflow Agent adapts dynamically to organization type
- Certificate Generation Agent creates professional PDFs with QR codes
- All agents coordinate through Event Bus for real-time processing

### Performance Considerations
- Analysis sessions persist for 24 hours to improve UX
- Agent system optimized for parallel processing and bulk operations
- Event-driven architecture enables real-time responsiveness
- OCR processing happens client-side to reduce server load
- File uploads handled with proper security validation
- Agent orchestration minimizes redundant processing through intelligent coordination