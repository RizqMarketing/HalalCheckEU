# Multi-Organization Architecture Documentation

## Overview

HalalCheck AI has been enhanced with a comprehensive multi-organization architecture that supports three distinct organization types, each with customized workflows, terminology, and features optimized for their specific use cases in the halal certification ecosystem.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Organization Types](#organization-types)
3. [Technical Implementation](#technical-implementation)
4. [API Documentation](#api-documentation)
5. [Frontend Components](#frontend-components)
6. [User Workflows](#user-workflows)
7. [Analytics & Tracking](#analytics--tracking)
8. [Development Guide](#development-guide)

## Architecture Overview

### Multi-Tenant B2B SaaS Platform

HalalCheck AI operates as a **multi-tenant B2B SaaS platform** targeting three primary market segments in the European halal certification industry:

1. **🏛️ Halal Certification Bodies** - Primary revenue source (245+ in Europe)
2. **🏭 Food Manufacturers** - Pre-certification validation (2,000+ companies)
3. **🚢 Import/Export Companies** - Trade compliance automation (300+ companies)

### Key Architectural Principles

- **Organization-Specific Customization**: Dynamic UI, terminology, and workflows
- **Shared Core Platform**: Common analysis engine with organization-specific presentation
- **Role-Based Access Control**: 6-tier permission system across organizations
- **Analytics-Driven**: Comprehensive usage tracking per organization type
- **Islamic Compliance**: Religious sensitivity and terminology accuracy

## Organization Types

### 1. Certification Bodies (`certification-body`)

**Primary Users**: Halal certification authorities, Islamic councils, religious certification organizations

**Workflow**: Application Review → Certification → Certificate Generation
- **Pipeline Stages**: New → Under Review → Approved → Certified
- **Key Features**: 
  - Islamic jurisprudence integration
  - Professional certificate generation (HC-2024-XXX)
  - Comprehensive audit trails
  - Client application management

**Terminology**:
- Items: "Applications"
- Pipeline: "Certification Pipeline"  
- Documents: "Certificates"
- Action: "Issue Certificates"

### 2. Food Manufacturers (`food-manufacturer`)

**Primary Users**: Food production companies, product development teams, quality assurance departments

**Workflow**: Product Development → Testing → Documentation → Certification Ready
- **Pipeline Stages**: Recipe → Testing → Documentation → Certification Ready
- **Key Features**:
  - Product development tracking
  - Pre-certification reports (PCR-2024-XXX)
  - Development recommendations
  - Certification readiness evaluation

**Terminology**:
- Items: "Products"
- Pipeline: "Development Pipeline"
- Documents: "Development Reports"
- Action: "Generate Reports"

### 3. Import/Export Companies (`import-export`)

**Primary Users**: International traders, supply chain managers, customs compliance teams

**Workflow**: Product Verification → Compliance Check → Trade Documentation → Export/Import
- **Pipeline Stages**: New → Verification → Compliant → Export Ready
- **Key Features**:
  - Trade compliance certificates (CC-2024-XXX)
  - International standards integration (MS 1500:2019, OIC)
  - Multi-country regulatory alignment
  - Customs documentation support

**Terminology**:
- Items: "Trade Items"
- Pipeline: "Compliance Pipeline"
- Documents: "Trade Certificates"
- Action: "Generate Trade Docs"

## Technical Implementation

### Backend Architecture

#### Core Files
- **`simple-server.js`**: Main backend server (Port 3003)
- **`backend/src/server.ts`**: Alternative full Express.js server
- **Analysis Engine**: GPT-4o integration with organization-specific context

#### API Endpoints
```javascript
// Analysis
POST /api/analysis/analyze
GET  /api/dashboard/stats
GET  /api/dashboard/recent-analyses

// Authentication (Mock)
POST /api/auth/register
POST /api/auth/login
```

### Frontend Architecture

#### Core Structure
```
halalcheck-app/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── dashboard/          # Organization-aware dashboard
│   │   ├── register/           # Organization selection
│   │   └── layout.tsx          # Root layout with providers
│   ├── components/             # Reusable components
│   │   ├── OnboardingWelcome.tsx
│   │   └── ErrorBoundary.tsx
│   ├── contexts/               # React Context providers
│   │   └── organization-context.tsx
│   └── lib/                    # Utilities and services
│       ├── organization-context.ts  # Organization configs
│       ├── data-manager.ts          # State management
│       ├── analytics-tracker.ts     # Usage analytics
│       └── api.ts                   # API client
```

#### Organization Context System

**Context Provider**: `OrganizationProvider`
- Manages organization type state
- Provides organization-specific configurations
- Handles terminology mappings
- Controls UI adaptations

**Configuration Structure**:
```typescript
interface OrganizationConfig {
  type: OrganizationType
  name: string
  description: string
  icon: string
  color: string
  dashboardTitle: string
  pipelineTitle: string
  stages: PipelineStage[]
  terminology: Terminology
  features: OrganizationFeatures
}
```

### Database Schema

#### Organization-Specific Data
- **User Profiles**: Include `organizationType` field
- **Applications**: Adapted pipeline stages per organization
- **Analytics Events**: Include organization context
- **Certificates**: Organization-specific templates and numbering

#### Storage Strategy
- **Development**: File-based + localStorage persistence
- **Production**: PostgreSQL + Redis caching ready
- **Multi-tenancy**: Organization-based data isolation

## API Documentation

### Analysis API

#### POST /api/analysis/analyze
Analyzes ingredients for halal compliance with organization-specific context.

**Request**:
```json
{
  "productName": "Organic Energy Bar",
  "ingredients": "oats, dates, almonds, coconut oil"
}
```

**Response**:
```json
{
  "product": "Organic Energy Bar",
  "overall": "APPROVED",
  "ingredients": [
    {
      "name": "oats",
      "status": "APPROVED",
      "reason": "Oats are inherently halal",
      "risk": "VERY_LOW",
      "category": "grain"
    }
  ],
  "warnings": [],
  "recommendations": ["Verify organic certification sources"]
}
```

### Dashboard API

#### GET /api/dashboard/stats
Returns organization-specific dashboard statistics.

**Response**:
```json
{
  "totalAnalyses": 107,
  "halalCount": 81,
  "haramCount": 12,
  "mashboohCount": 30,
  "costSavings": 6266,
  "avgProcessingTime": 18
}
```

## Frontend Components

### Core Components

#### 1. OrganizationProvider
**File**: `src/contexts/organization-context.tsx`
- Provides organization context to all components
- Manages organization type state
- Handles localStorage persistence

#### 2. OnboardingWelcome
**File**: `src/components/OnboardingWelcome.tsx`
- Organization-specific onboarding flows
- Multi-step guidance with progress tracking
- Analytics integration for onboarding completion

#### 3. Dashboard
**File**: `src/app/dashboard/page.tsx`
- Organization-aware quick actions
- Dynamic workflow visualization  
- Performance metrics display

### Dynamic UI System

#### Terminology Mapping
```typescript
const organizationText = {
  'certification-body': {
    itemName: 'Applications',
    pipelineName: 'Certification Pipeline',
    documentName: 'Certificates'
  },
  'food-manufacturer': {
    itemName: 'Products', 
    pipelineName: 'Development Pipeline',
    documentName: 'Development Reports'
  }
}
```

#### Styling System
```typescript
const organizationStyling = {
  'certification-body': {
    colors: {
      primary: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      text: 'text-emerald-600'
    }
  }
}
```

## User Workflows

### Certification Body Workflow

1. **Registration**: Select "Halal Certification Body"
2. **Onboarding**: Islamic jurisprudence integration guidance
3. **Analysis**: AI ingredient analysis with Islamic context
4. **Pipeline**: New → Under Review → Approved → Certified
5. **Certificates**: Generate official halal certificates (HC-2024-XXX)
6. **Analytics**: Track certification performance metrics

### Food Manufacturer Workflow

1. **Registration**: Select "Food Manufacturer"
2. **Onboarding**: Product development process guidance  
3. **Analysis**: Product formulation analysis
4. **Pipeline**: Recipe → Testing → Documentation → Certification Ready
5. **Reports**: Generate pre-certification reports (PCR-2024-XXX)
6. **Analytics**: Track development progress and readiness

### Import/Export Workflow

1. **Registration**: Select "Import/Export Company"
2. **Onboarding**: Trade compliance guidance
3. **Analysis**: Product compliance verification
4. **Pipeline**: New → Verification → Compliant → Export Ready
5. **Documentation**: Generate trade certificates (CC-2024-XXX)
6. **Analytics**: Track trade compliance metrics

## Analytics & Tracking

### Analytics Architecture

**File**: `src/lib/analytics-tracker.ts`

#### Event Types
- `page_view`: Page navigation tracking
- `analysis`: Ingredient analysis lifecycle
- `pipeline`: Workflow stage changes
- `client_management`: Client creation/selection
- `onboarding`: User onboarding progress
- `feature_usage`: Feature interaction tracking
- `performance`: System performance metrics
- `error`: Error tracking and debugging

#### Organization-Specific Metrics

**Certification Bodies**:
- `certificatesGenerated`: Number of certificates issued
- `applicationsProcessed`: Pipeline throughput
- `averageProcessingTime`: Certification efficiency

**Food Manufacturers**:
- `productsAnalyzed`: Product analysis volume
- `preCertReportsGenerated`: Report generation count
- `developmentStagesCompleted`: Development progress

**Import/Export Companies**:
- `tradeComplianceChecks`: Compliance verification count
- `tradeCertificatesGenerated`: Trade document count
- `internationalStandardsUsed`: Standards compliance tracking

#### Usage Metrics Structure
```typescript
interface UsageMetrics {
  organizationType: OrganizationType
  totalSessions: number
  totalEvents: number
  uniqueUsers: number
  averageSessionDuration: number
  topFeatures: Array<{
    feature: string
    usage: number
    percentage: number
  }>
  organizationSpecificMetrics: any
}
```

## Development Guide

### Adding New Organization Types

1. **Update Type Definition** (`src/lib/organization-context.ts`)
```typescript
export type OrganizationType = 'certification-body' | 'food-manufacturer' | 'import-export' | 'new-type'
```

2. **Add Organization Configuration**
```typescript
const organizationConfigs: Record<OrganizationType, OrganizationConfig> = {
  'new-type': {
    type: 'new-type',
    name: 'New Organization',
    // ... configuration
  }
}
```

3. **Update Registration Options** (`src/app/register/page.tsx`)
```typescript
<option value="new_type">🏢 New Organization Type</option>
```

4. **Add Terminology Mapping**
```typescript
const terminologyMap: Record<OrganizationType, Terminology> = {
  'new-type': {
    itemName: 'Items',
    pipelineName: 'Workflow',
    // ... terminology
  }
}
```

5. **Update Analytics Tracking** (`src/lib/analytics-tracker.ts`)
```typescript
case 'new-type':
  metrics.specificMetric = calculateNewMetric(events)
  break
```

### Customizing Workflows

#### Pipeline Stages
Update pipeline stages in organization configuration:
```typescript
stages: [
  {
    id: 'new',
    title: 'New Items',
    description: 'Recently created items',
    color: 'bg-blue-500',
    icon: <NewIcon />,
    isDefault: true
  }
]
```

#### Custom Components
Create organization-specific components:
```typescript
function OrganizationSpecificComponent() {
  const { organizationType } = useOrganization()
  
  switch (organizationType) {
    case 'new-type':
      return <NewTypeComponent />
    default:
      return <DefaultComponent />
  }
}
```

### Testing Organization Features

#### Manual Testing
1. Register with different organization types
2. Verify terminology changes across UI
3. Test pipeline workflow differences
4. Validate analytics tracking

#### Automated Testing
```javascript
// Example test structure
describe('Multi-Organization Features', () => {
  test('displays correct terminology for certification bodies', () => {
    // Test implementation
  })
  
  test('tracks organization-specific analytics', () => {
    // Test implementation
  })
})
```

### Performance Considerations

#### Optimization Strategies
- **Lazy Loading**: Organization configurations loaded on demand
- **Memoization**: Cached organization context to prevent re-renders
- **Bundle Splitting**: Separate bundles for organization-specific features
- **Analytics Batching**: Event batching to reduce server load

#### Monitoring
- **Performance Metrics**: Track page load times per organization
- **Error Tracking**: Organization-specific error monitoring
- **Usage Analytics**: Feature adoption per organization type

## Security Considerations

### Data Isolation
- **Multi-tenancy**: Organization-based data separation
- **Access Control**: Role-based permissions per organization
- **Audit Trails**: Complete activity logging for compliance

### Religious Sensitivity
- **Islamic Compliance**: Accurate halal/haram terminology
- **Cultural Respect**: Appropriate Islamic references and context
- **Expert Validation**: Religious terminology reviewed by Islamic scholars

## Deployment & Scaling

### Current Setup (Development)
```bash
# Backend
cd "C:\Users\mazin\HalalCheck AI"
node simple-server.js

# Frontend  
cd "C:\Users\mazin\HalalCheck AI\halalcheck-app"
npm run dev -- --port 3004
```

### Production Considerations
- **Database**: PostgreSQL with organization-based partitioning
- **Caching**: Redis for organization configurations and analytics
- **CDN**: Organization-specific asset delivery
- **Monitoring**: Per-organization performance tracking

### Scaling Strategy
- **Horizontal Scaling**: Organization-specific service instances
- **Database Sharding**: By organization type or region
- **Analytics Pipeline**: Separate analytics processing per organization
- **Load Balancing**: Organization-aware request routing

## Conclusion

The multi-organization architecture transforms HalalCheck AI from a single-purpose tool into a comprehensive B2B SaaS platform serving the entire halal certification ecosystem. Each organization type receives a tailored experience while sharing the powerful core analysis engine, creating value for certification bodies, manufacturers, and traders alike.

The architecture is designed for scalability, maintainability, and extensibility, allowing for easy addition of new organization types and features as the platform grows to serve the €2.3 trillion global halal market.