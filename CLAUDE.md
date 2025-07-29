# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


---

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:4000 (Next.js 14 in `halalcheck-app/`)
- **Backend**: http://localhost:8000 (Pure GPT-4 system via `server.js`) 

**To start the platform:**
1. Start GPT-4 backend: `cd "C:\Users\mazin\HalalCheck AI" && node server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 4000`

**Alternative startup methods:**
- Complete system: `node start-complete-system.js` (starts both backend and frontend)
- GPT-4 system only: `node server.js` 
- Test system: Test endpoints directly with curl or via frontend

## 🏗️ CORE ARCHITECTURE

### Pure GPT-4 Backend Architecture
**Current Active**: Pure GPT-4 system (`server.js` + `halalcheck-app`)
**Full Stack**: Dockerized backend/frontend architecture (currently inactive)

**GPT-4 System Components:**
- **Real GPT-4 Analysis**: Authentic OpenAI GPT-4 API integration with comprehensive Islamic jurisprudence
- **Expert Islamic Scholarship**: AI-powered analysis with detailed Islamic dietary law reasoning
- **Document Processing**: Smart parsing with OCR capabilities
- **Multi-format Support**: Handles text, images, PDFs, and Excel files

### Critical Architecture Components

#### **1. Multi-Organization System**
**Core Files:**
- `halalcheck-app/src/lib/organization-context.ts` - Configuration for 2 organization types
- `halalcheck-app/src/contexts/organization-context.tsx` - React context provider

**Organization Types:**
- **Certification Body**: Applications → Certificates (New → Under Review → Approved → Certified)
- **Food Manufacturer**: Products → Development (Recipe → Testing → Documentation → Certification Ready)

#### **2. Data Management System**
**Core File:** `halalcheck-app/src/lib/data-manager.ts`
- Singleton pattern managing Applications ↔ Certificates synchronization
- Organization-aware status handling (supports dynamic pipeline stages)
- Event subscription system for real-time UI updates
- Local storage persistence with automatic sync

#### **3. Real GPT-4 Analysis Engine**
**Backend:** `server.js` - Authentic OpenAI GPT-4 API integration with Islamic jurisprudence expertise
**Frontend:** `halalcheck-app/src/app/dashboard/analyze/page.tsx` - 24-hour persistent analysis sessions
**API Integration:** Direct OpenAI GPT-4 calls with comprehensive Islamic scholarly prompting

**GPT-4 Capabilities:**
- **Real AI Analysis**: Authentic GPT-4 API calls with expert Islamic scholarship prompting
- **Islamic Jurisprudence**: Advanced halal/haram/mashbooh classification with detailed reasoning
- **Scholarly References**: Structure for Quranic/Hadith citations with Arabic text and transliteration
- **Document Processing**: Smart parsing of text files, OCR capabilities
- **Multi-Product Support**: Extract and analyze multiple products from single documents
- **Advanced File Processing**: CSV parsing and messy text format recognition
- **Conservative Approach**: MASHBOOH classification when uncertainty exists

**Key Features:**
- **OpenAI API Integration**: Real GPT-4 model calls for authentic AI analysis
- **Expert Prompting**: Comprehensive Islamic scholar persona with detailed jurisprudence knowledge
- **Premium UI Design**: Professional enterprise-grade interface with animations and gradients
- **Detailed Analysis**: Much deeper reasoning and explanation than mock data
- **Response Times**: 30-60 seconds per request due to real AI processing
- **Error Handling**: Graceful fallbacks if API fails
- **Multi-format document processing**: TXT, CSV, PDF, images with smart parsing
- **Client management system** with bulk processing
- **State persistence** across browser sessions

#### **4. Premium UI Design System**
**Premium Analysis Value Metrics:**
- Multi-layered gradient backgrounds with animated effects
- 3D hover transformations with card lifting and rotation
- Gradient text effects with professional typography
- Interactive animations for professional feel
- Status badges like "PREMIUM AI" for brand reinforcement
- Enhanced spacing and visual hierarchy

**Premium Islamic Compliance Dashboard:**
- Islamic-inspired design with Arabic text integration (حلال, حرام, مشبوه)
- Sophisticated card layout with glowing hover effects
- Scale animations and gradient shadows for premium feel
- Cultural authenticity with Arabic terminology
- Professional color system with proper contrast
- Glass-morphism effects with backdrop blur

**Design Features:**
- Enterprise-grade visual design matching high-end SaaS platforms
- Smooth transitions and hover states throughout
- Professional gradient overlays for depth
- Consistent brand colors and typography
- Interactive feedback on all elements
- Premium card shadows and border effects

#### **5. Advanced File Processing System**
**CSV File Processing:**
- Professional CSV parsing with `csv-parse` library
- Automatic column detection (supports multiple column name formats)
- Multi-product extraction from structured data
- Handles various CSV formats and encodings
- 98% confidence rating for CSV processing

**Messy Text Format Recognition:**
- Intelligent parsing of mixed-format documents
- Supports multiple product naming patterns:
  - `Product 1: Name | ingredients` (pipe-separated)
  - `ITEM#2 - Name` + `Ingredients: list` (multi-line format)
  - `*** Name ***` + `Contains: list` (asterisk headers)
  - `Product Name: Name` + `Ingredient List: list` (standard format)
  - `Another Product    ingredients` (space-separated)
- Smart ingredient extraction with multiple delimiter support
- Robust parsing that handles formatting inconsistencies
- All 5 products correctly extracted from messy formats

**File Format Support:**
- **TXT files**: Advanced text parsing with pattern recognition
- **CSV files**: Professional structured data processing
- **PDF files**: OCR processing capabilities
- **Image files**: Visual content extraction
- **Multi-format uploads**: Automatic format detection

#### **6. Security & Religious Compliance**
- EU GDPR compliance by design
- Islamic jurisprudence accuracy protocols
- Multi-source verification system
- Expert validation requirements for sensitive ingredients

## 🔧 COMMON DEVELOPMENT COMMANDS

### Development Workflow
```bash
# Start GPT-4 development servers
node server.js                                          # GPT-4 backend on :8000
cd halalcheck-app && npm run dev -- --port 4000         # Frontend on :4000

# Complete system startup
node start-complete-system.js                           # Start both backend and frontend with tests

# GPT-4 system management
node server.js                                          # Start only GPT-4 backend

# Quick health checks
curl http://localhost:8000/api/system/health            # Check GPT-4 system health
curl -X POST http://localhost:8000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test","ingredients":"water, sugar, gelatin"}' # Test analysis

# Legacy workflow (currently inactive)
npm run dev                                              # Start both with Docker
npm run dev:build                                       # Force rebuild containers
npm run dev:down                                        # Stop containers
```

### Testing & Quality
```bash
# Real GPT-4 system tests (30-60 second response times)
curl -X POST http://localhost:8000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test","ingredients":"E631, carmine, vitamin D3"}' # Test real GPT-4 Islamic analysis

# Test file analysis functionality - Multiple formats supported
curl -X POST http://localhost:8000/api/analysis/analyze-file \
  -F "file=@test_document.txt" \
  -F "productName=Test Product" # Test messy text format parsing

curl -X POST http://localhost:8000/api/analysis/analyze-file \
  -F "file=@test-detailed-products.csv" \
  -F "productName=CSV Products" # Test CSV processing (extracts all 5 products)

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

**Full Backend** (`backend/src/`): Complete TypeScript architecture with:
- Controllers, services, middleware
- Database migrations and seeding
- Comprehensive testing suite
- Security and authentication layers

### Key Integration Points
1. **Organization Context Flow**: `organization-context.ts` → `organization-context.tsx` → all UI components
2. **GPT-4 Data Flow**: `data-manager.ts` ↔ `server.js` ↔ local storage
3. **Analysis Flow**: Frontend upload → `server.js` → GPT-4 analysis → Response
4. **Direct API Communication**: Frontend → GPT-4 backend → Response

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
- **Pure GPT-4 Architecture**: Clean, simple system with direct AI integration
- **Simplified Backend**: Single server approach for rapid development and deployment
- **Organization Context**: Enables single codebase to serve multiple user types
- **Local Storage**: Reduces infrastructure costs while maintaining functionality
- **Next.js App Router**: Modern React patterns with excellent TypeScript support
- **Direct API Design**: Simple request/response pattern for maximum reliability

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
- All ingredient classifications include Quranic/Hadith references with Arabic text and transliteration
- Confidence scores must reflect scholarly consensus accuracy from authenticated Islamic sources
- Religious sensitivity is paramount in all user-facing content
- Database includes 500+ ingredients covering E-numbers, enzymes, vitamins, biotechnology, and contemporary food additives
- Classifications sourced from Quran, authentic Hadith, four major Sunni schools, and contemporary fatawa from JAKIM, MUI, ISNA, and European Council for Fatwa
- **Critical Categories Covered**: E-numbers (E631, E627, E120, etc.), industrial enzymes, vitamins (D3, B12), emulsifiers, natural flavors, food colorings, preservatives, and modern biotechnology ingredients
- **Authentication Standards**: Conservative MASHBOOH classification when doubt exists, source verification requirements, madhab differences noted

### Performance Considerations
- **Analysis sessions persist for 24 hours** to improve UX
- **Real GPT-4 API calls**: 30-60 second response times due to authentic AI processing
- **OpenAI API integration**: Direct calls to GPT-4 model without mock data
- **Conservative timeout handling**: Extended timeouts for complex ingredient analysis
- **OCR processing happens client-side** to reduce server load
- **File uploads handled with proper security validation**
- **Error handling**: Graceful fallbacks if OpenAI API fails
- **API key management**: Secure OpenAI API key integration


## 📁 PROJECT STATE & CLEANUP

### Current Clean State
The project has been recently cleaned and optimized:
- ✅ **Agent system removed** - All agent-related files and directories cleaned up
- ✅ **Real GPT-4 implementation** - Authentic OpenAI API integration with Islamic jurisprudence
- ✅ **Premium UI design** - Enterprise-grade interface with animations and gradients applied to both solo and bulk analysis
- ✅ **Advanced file processing** - CSV parsing and messy text format recognition implemented
- ✅ **OpenAI package installed** - Official OpenAI npm package for GPT-4 calls
- ✅ **Expert prompting system** - Comprehensive Islamic scholar persona with detailed reasoning
- ✅ **CSV processing** - Professional structured data parsing with multiple column format support
- ✅ **Dependencies refreshed** - Clean npm installations with csv-parse library
- ✅ **UI consistency** - Premium styling applied to both single and bulk analysis sections
- ✅ **Status mapping fixes** - PROHIBITED ingredients now correctly display as red "Haram - Prohibited"
- ✅ **Islamic compliance dashboard** - Accurate counting of halal/haram/mashbooh ingredients
- ✅ **Overall analysis status** - Properly calculated from ingredient statuses (PROHIBITED overrides all)
- ✅ **End-to-end data flow** - Consistent status handling from GPT-4 → Frontend → Dashboard
- ✅ **Purple alternatives styling** - Halal alternatives now use clean purple design instead of green

### Active Components
**Currently Used:**
- `server.js` - Real GPT-4 backend with OpenAI API integration and advanced file processing
- `halalcheck-app/` - Active Next.js frontend with premium UI design
- Premium Analysis Value Metrics with 3D animations and gradient effects
- Premium Islamic Compliance Dashboard with Arabic text integration
- CSV processing system with professional parsing capabilities
- Messy text format recognition supporting 5+ different patterns
- Direct API testing via curl commands (30-60 second response times)
- OpenAI GPT-4 model calls with Islamic jurisprudence expertise

**Legacy/Reference Only:**
- `backend/` - Full TypeScript backend (preserved for reference)
- Various Docker and deployment configs (inactive but preserved)

### ✨ Premium UI Access
**Frontend URL**: http://localhost:4000/dashboard/analyze
- **Solo Analysis**: Premium Analysis Value Metrics + Islamic Compliance Dashboard
- **Bulk Analysis**: Same premium styling applied to all bulk analysis results
- **File Upload**: Supports CSV (5 products), messy text formats (5 patterns), PDF, images
- **Real-time Processing**: 30-60 seconds per analysis with GPT-4
- **Enterprise Design**: Glass-morphism effects, 3D animations, gradient backgrounds