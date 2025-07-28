# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:4000 (Next.js in `halalcheck-app/`)
- **Backend**: http://localhost:3003 (GPT-4 powered agent system via `simple-agent-server.js`) 

**To start the platform:**
1. Start agent-based backend: `cd "C:\Users\mazin\HalalCheck AI" && node simple-agent-server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 4000`

**Alternative startup methods:**
- Complete system: `node start-complete-system.js` (starts both backend and frontend)
- Agent system only: `node start-agent-system.js` 
- Test agent system: `node test-agent-system.js`

## 🏗️ CORE ARCHITECTURE

### Current Analysis System
**IMPORTANT**: The platform now uses **pure GPT-4 intelligent analysis** without any static database:
- All ingredient analysis is performed by AI with Islamic jurisprudence knowledge
- No hardcoded ingredient classifications
- Dynamic reasoning based on ingredient context
- Real-time intelligent assessment

### Agent-Based Backend Architecture
**Current Active**: GPT-4 powered agent system (`simple-agent-server.js`)
- Pure AI analysis without database dependencies
- Smart pattern recognition for halal/haram/mashbooh classification
- Intelligent reasoning with Islamic dietary law knowledge
- Document upload changes MASHBOOH ingredients to HALAL (green)

**Agent System Components:**
- **Islamic Analysis Agent**: GPT-4 powered halal/haram classification
- **Document Processing Agent**: OCR, PDF, Excel processing with intelligent extraction
- **Organization Workflow Agent**: Multi-org support and dynamic workflow management
- **Certificate Generation Agent**: Professional PDF certificate creation with QR codes

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
- Organization-aware status handling
- Event subscription system for real-time UI updates
- Local storage persistence with automatic sync

#### **3. Analysis Features**
**Frontend:** `halalcheck-app/src/app/dashboard/analyze/page.tsx`
- Solo and bulk analysis modes
- Document upload for MASHBOOH verification (turns ingredients green/HALAL)
- Recommendations displayed for both analysis modes
- Delete button next to Save to Pipeline
- 24-hour persistent analysis sessions

**Key UI Behaviors:**
- MASHBOOH ingredients show yellow with upload button
- Uploaded documents change status to HALAL (green)
- Success notifications on document upload
- Overall status recalculates automatically

## 🔧 COMMON DEVELOPMENT COMMANDS

### Development Workflow
```bash
# Start development servers
node simple-agent-server.js                             # Backend on :3003
cd halalcheck-app && npm run dev -- --port 4000        # Frontend on :4000

# Complete system startup
node start-complete-system.js                           # Start both with tests

# Testing
node test-agent-system.js                               # Test agent system
curl -X POST http://localhost:3003/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test","ingredients":"beef, vanilla extract"}'

# Linting
cd halalcheck-app && npm run lint                      # Frontend linting
```

### Key API Endpoints
- `/api/analysis/analyze` - Single product analysis
- `/api/analysis/analyze-file` - Document processing
- `/api/analysis/bulk` - Bulk product analysis
- `/api/verification/upload-document` - Document verification upload
- `/api/certificates/generate` - Certificate generation
- `/api/system/health` - System health check

## 💡 STRATEGIC CONTEXT

### Recent Major Changes
1. **Database Removed**: All analysis now uses pure GPT-4 intelligence
2. **UI Improvements**: 
   - Removed "Clear Single Analysis" button from top
   - Added "Delete" button next to "Save to Pipeline"
   - Removed Islamic Guidance messages
   - Added recommendations to bulk analysis
3. **Document Upload Enhancement**: 
   - MASHBOOH ingredients turn HALAL/green when documents uploaded
   - Works in both solo and bulk analysis modes

### GPT-4 Analysis Logic
**HALAL**: Common ingredients like water, salt, sugar, vegetables, plant oils
**HARAM**: Pork, alcohol, blood, carrion derivatives
**MASHBOOH** (Requires Verification):
- Meat products (beef, chicken, lamb) - need halal slaughter verification
- Vanilla extract - contains alcohol (35-40%)
- E-numbers (E471, E120, E631) - source verification needed
- Gelatin, enzymes, natural flavors

### Technical Decisions
- **Pure AI Analysis**: More flexible than static database
- **Conservative Approach**: Unknown ingredients default to MASHBOOH
- **Document Verification**: Converts questionable ingredients to certified
- **Local Storage**: Reduces infrastructure costs
- **Event-Driven Design**: Real-time updates across UI

## 🚨 CRITICAL IMPLEMENTATION NOTES

### Analysis System
- GPT-4 provides all ingredient classifications
- No database lookups - pure intelligent reasoning
- Document uploads change ingredient status immediately
- Success messages confirm verification

### UI/UX Considerations
- Status colors: Green (HALAL), Red (HARAM), Yellow (MASHBOOH)
- Document upload available for all MASHBOOH ingredients
- Recommendations show for both solo and bulk analysis
- Delete buttons allow removing individual results

### State Management
- `saveState()` updates both React state and localStorage
- Bulk results update separately from solo results
- Document uploads trigger immediate UI refresh
- Overall status recalculates after any change

## 🤖 CLAUDE CODE SUBAGENTS

Specialized subagents in `.claude/subagents/`:
1. **islamic-jurisprudence-expert** - Halal/haram classifications
2. **agent-system-developer** - Agent architecture
3. **nextjs-react-expert** - Frontend development
4. **api-testing-integration** - API testing
5. **multi-org-developer** - Multi-organization features
6. **performance-security-auditor** - Performance optimization

## 📁 PROJECT STATE

### Active Components
- `simple-agent-server.js` - GPT-4 powered backend
- `halalcheck-app/` - Next.js frontend
- `test-agent-system.js` - Testing tool

### Inactive/Legacy
- `backend/` - Full TypeScript backend (reference only)
- `agents/` - TypeScript agent system (available but inactive)
- Database files removed - using pure AI analysis