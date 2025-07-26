# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 CURRENT ACTIVE SETUP (READ THIS FIRST!)

**The platform is currently running on:**
- **Frontend**: http://localhost:3007 (Next.js in `halalcheck-app/`)
- **Backend**: http://localhost:3003 (simple-server.js in root) 

**To start the platform:**
1. Start backend: `cd "C:\Users\mazin\HalalCheck AI" && node simple-server.js`
2. Start frontend: `cd "C:\Users\mazin\HalalCheck AI\halalcheck-app" && npm run dev -- --port 3007`

**Critical Architecture Components:**
- **Backend API**: `simple-server.js` - Single-file Express server with OpenAI GPT-4o integration
- **Frontend**: `halalcheck-app/src/app/` - Next.js 14 App Router with TypeScript
- **Organization Context**: Multi-organization system with dynamic terminology (certification bodies, manufacturers, import/export)
- **Data Manager**: `halalcheck-app/src/lib/data-manager.ts` - Singleton pattern managing Applications ↔ Certificates sync
- **Islamic Database**: `halalcheck-app/src/lib/islamic-jurisprudence.ts` - 200+ classified ingredients with Quranic references
- **Analysis Engine**: Extensive AI tool with 24-hour state persistence, bulk processing, and client management

## 💡 Strategic Context

### Solopreneur Development Approach
- Always prioritize solutions that can be implemented without a large team or significant capital
- Focus on lean development, leveraging AI and automation to maximize individual productivity
- Choose technologies and approaches that offer high impact with minimal initial investment
- Optimize for quick iteration and minimal overhead
- Prefer serverless/low-infrastructure solutions that reduce operational complexity
- Implement features that provide maximum value with minimal development time

[Rest of the file remains unchanged...]