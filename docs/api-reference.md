# HalalCheck AI API Reference

## Overview

The HalalCheck AI API provides comprehensive halal ingredient analysis and certification management capabilities for different organization types. The API is designed to support certification bodies, food manufacturers, and import/export companies with organization-specific features and terminology.

## Base URL

```
Development: http://localhost:3003
Production: https://api.halalcheck.eu
```

## Authentication

Currently using mock JWT authentication for development. In production, use Bearer token authentication:

```http
Authorization: Bearer <your-jwt-token>
```

## Content Types

All API requests and responses use JSON:

```http
Content-Type: application/json
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ingredient format",
    "details": {
      "field": "ingredients",
      "reason": "Required field missing"
    }
  }
}
```

## API Endpoints

### Analysis API

#### Analyze Ingredients

Performs AI-powered halal compliance analysis on ingredient lists.

**Endpoint**: `POST /api/analysis/analyze`

**Request Body**:
```json
{
  "productName": "Organic Energy Bar",
  "ingredients": "organic oats, organic dates, organic almond butter, organic coconut oil, organic chia seeds, natural vanilla extract, sea salt"
}
```

**Parameters**:
- `productName` (string, required): Name of the product being analyzed
- `ingredients` (string, required): Comma-separated list of ingredients

**Response** (200 OK):
```json
{
  "product": "Organic Energy Bar",
  "overall": "APPROVED",
  "ingredients": [
    {
      "name": "organic oats",
      "status": "APPROVED",
      "reason": "Oats are a plant-based ingredient and are halal.",
      "risk": "VERY_LOW",
      "category": "grain"
    },
    {
      "name": "natural vanilla extract",
      "status": "QUESTIONABLE", 
      "reason": "Vanilla extract may contain alcohol, which requires verification.",
      "risk": "MEDIUM",
      "category": "flavoring"
    }
  ],
  "warnings": [],
  "recommendations": [
    "Verify the source of the natural vanilla extract to ensure it is alcohol-free or contains permissible levels of alcohol."
  ]
}
```

**Status Values**:
- `APPROVED`: Ingredient is halal
- `PROHIBITED`: Ingredient is haram (forbidden)
- `QUESTIONABLE`: Ingredient requires verification
- `VERIFY_SOURCE`: Source verification needed

**Risk Levels**:
- `VERY_LOW`: Minimal compliance risk
- `LOW`: Low compliance risk  
- `MEDIUM`: Moderate compliance risk
- `HIGH`: High compliance risk
- `VERY_HIGH`: Very high compliance risk

**Categories**:
- `grain`, `fruit`, `nut`, `oil`, `seed`, `mineral`, `dairy`, `meat`, `flavoring`, `preservative`, `emulsifier`, `sweetener`, `vitamin`, `additive`

### Dashboard API

#### Get Dashboard Statistics

Returns organization-specific dashboard statistics and metrics.

**Endpoint**: `GET /api/dashboard/stats`

**Query Parameters**:
- `organizationType` (optional): Filter stats by organization type
- `dateRange` (optional): Date range for statistics (7d, 30d, 90d, 1y)

**Response** (200 OK):
```json
{
  "totalAnalyses": 107,
  "halalCount": 81,
  "haramCount": 12, 
  "mashboohCount": 30,
  "costSavings": 6266,
  "avgProcessingTime": 18,
  "organizationMetrics": {
    "certificatesGenerated": 45,
    "applicationsProcessed": 89,
    "averageProcessingTime": 24
  }
}
```

#### Get Recent Analyses

Returns recent analysis history with pagination.

**Endpoint**: `GET /api/dashboard/recent-analyses`

**Query Parameters**:
- `limit` (optional, default: 10): Number of results to return
- `offset` (optional, default: 0): Pagination offset
- `organizationType` (optional): Filter by organization type

**Response** (200 OK):
```json
{
  "analyses": [
    {
      "id": "analysis_123",
      "productName": "Organic Energy Bar",
      "overall": "APPROVED",
      "createdAt": "2024-07-26T10:30:00Z",
      "organizationType": "food-manufacturer",
      "clientName": "ABC Foods Ltd"
    }
  ],
  "pagination": {
    "total": 107,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Authentication API (Mock)

#### Register User

Creates a new user account with organization type selection.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@company.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "ABC Certification Body",
  "organizationType": "CERTIFICATION_BODY",
  "country": "Germany",
  "phone": "+49123456789",
  "acceptTerms": true
}
```

**Parameters**:
- `email` (string, required): User email address
- `password` (string, required): Password (min 8 characters)
- `firstName` (string, required): User first name
- `lastName` (string, required): User last name
- `organizationName` (string, required): Organization name
- `organizationType` (string, required): Organization type enum
- `country` (string, optional): User country
- `phone` (string, optional): Phone number
- `acceptTerms` (boolean, required): Terms acceptance

**Organization Types**:
- `CERTIFICATION_BODY`: Halal certification authority
- `FOOD_MANUFACTURER`: Food production company
- `IMPORT_EXPORT`: Import/export trading company
- `RESTAURANT`: Restaurant/food service
- `CONSULTANT`: Halal compliance consultant
- `OTHER`: Other organization type

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "user_123",
    "email": "user@company.com",
    "organizationType": "CERTIFICATION_BODY"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

#### Login User

Authenticates user and returns access token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@company.com", 
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@company.com",
    "organizationType": "CERTIFICATION_BODY",
    "organizationName": "ABC Certification Body"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Health Check API

#### System Health

Returns system health status and version information.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "2.0-with-pdf",
  "timestamp": "2024-07-26T10:30:00Z",
  "services": {
    "database": "connected",
    "openai": "connected",
    "redis": "connected"
  }
}
```

## Organization-Specific Features

### Certification Bodies

Additional endpoints and features for halal certification authorities:

#### Generate Certificate

**Endpoint**: `POST /api/certificates/generate`

**Request Body**:
```json
{
  "applicationId": "app_123",
  "certificateType": "halal_certificate",
  "clientName": "ABC Foods Ltd",
  "productName": "Organic Energy Bar",
  "analysisResults": { /* analysis data */ },
  "islamicReferences": true
}
```

**Response**:
```json
{
  "certificate": {
    "id": "HC-2024-001234",
    "type": "halal_certificate",
    "status": "generated",
    "pdfUrl": "/certificates/HC-2024-001234.pdf",
    "generatedAt": "2024-07-26T10:30:00Z"
  }
}
```

### Food Manufacturers

#### Generate Development Report

**Endpoint**: `POST /api/reports/development`

**Request Body**:
```json
{
  "productId": "product_123",
  "reportType": "pre_certification",
  "developmentStage": "testing",
  "analysisResults": { /* analysis data */ },
  "recommendations": true
}
```

**Response**:
```json
{
  "report": {
    "id": "PCR-2024-001234",
    "type": "pre_certification",
    "status": "generated", 
    "pdfUrl": "/reports/PCR-2024-001234.pdf",
    "certificationReadiness": 85,
    "nextSteps": ["Verify vanilla extract source", "Update ingredient documentation"]
  }
}
```

### Import/Export Companies

#### Generate Trade Certificate

**Endpoint**: `POST /api/certificates/trade`

**Request Body**:
```json
{
  "tradeItemId": "trade_123",
  "certificateType": "trade_compliance",
  "destinationCountry": "Malaysia",
  "standards": ["MS_1500_2019", "OIC_SMIIC"],
  "analysisResults": { /* analysis data */ }
}
```

**Response**:
```json
{
  "certificate": {
    "id": "CC-2024-001234",
    "type": "trade_compliance",
    "status": "generated",
    "pdfUrl": "/certificates/CC-2024-001234.pdf",
    "validCountries": ["Malaysia", "Indonesia", "UAE"],
    "expirationDate": "2025-07-26T00:00:00Z"
  }
}
```

## Analytics API

### Track Events

Records user interactions and system events for analytics.

**Endpoint**: `POST /api/analytics/events`

**Request Body**:
```json
{
  "events": [
    {
      "eventType": "analysis",
      "organizationType": "food-manufacturer",
      "userId": "user_123",
      "sessionId": "session_456",
      "timestamp": "2024-07-26T10:30:00Z",
      "data": {
        "action": "completed",
        "productName": "Organic Energy Bar",
        "overallStatus": "APPROVED",
        "analysisTimeMs": 8500
      }
    }
  ]
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "eventsProcessed": 1
}
```

### Get Usage Metrics

Returns organization-specific usage analytics.

**Endpoint**: `GET /api/analytics/metrics`

**Query Parameters**:
- `organizationType` (required): Organization type to analyze
- `dateRange` (optional): Time period for metrics
- `includeDetails` (optional): Include detailed breakdowns

**Response** (200 OK):
```json
{
  "organizationType": "food-manufacturer",
  "totalSessions": 45,
  "totalEvents": 234,
  "uniqueUsers": 12,
  "averageSessionDuration": 1245,
  "topFeatures": [
    {
      "feature": "ingredient_analysis",
      "usage": 89,
      "percentage": 38
    }
  ],
  "organizationSpecificMetrics": {
    "productsAnalyzed": 67,
    "preCertReportsGenerated": 23,
    "developmentStagesCompleted": 145
  }
}
```

## Rate Limiting

API requests are rate-limited based on subscription tier:

- **Professional**: 200 requests/hour
- **Enterprise**: 1000 requests/hour  
- **Enterprise Plus**: Unlimited

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150
X-RateLimit-Reset: 1627846800
```

## Webhooks

Configure webhooks to receive real-time notifications about analysis completion, certificate generation, and system events.

### Webhook Endpoints

Configure webhook URLs in your organization settings. HalalCheck AI will send POST requests to your endpoints when events occur.

**Webhook Payload Example**:
```json
{
  "event": "analysis.completed",
  "timestamp": "2024-07-26T10:30:00Z",
  "organizationType": "food-manufacturer",
  "data": {
    "analysisId": "analysis_123",
    "productName": "Organic Energy Bar",
    "overall": "APPROVED",
    "clientName": "ABC Foods Ltd"
  }
}
```

**Supported Events**:
- `analysis.completed`: Analysis finished
- `analysis.failed`: Analysis failed
- `certificate.generated`: Certificate created
- `report.generated`: Report created
- `user.registered`: New user registration

## SDK Examples

### JavaScript/Node.js

```javascript
const HalalCheckAPI = require('@halalcheck/api-client');

const client = new HalalCheckAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.halalcheck.eu'
});

// Analyze ingredients
const analysis = await client.analyze({
  productName: 'Organic Energy Bar',
  ingredients: 'oats, dates, almonds, coconut oil'
});

console.log('Analysis result:', analysis.overall);
```

### Python

```python
import halalcheck

client = halalcheck.Client(
    api_key='your-api-key',
    base_url='https://api.halalcheck.eu'
)

# Analyze ingredients
analysis = client.analyze(
    product_name='Organic Energy Bar',
    ingredients='oats, dates, almonds, coconut oil'
)

print(f'Analysis result: {analysis.overall}')
```

### cURL Examples

**Analyze Ingredients**:
```bash
curl -X POST http://localhost:3003/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Organic Energy Bar",
    "ingredients": "oats, dates, almonds, coconut oil"
  }'
```

**Get Dashboard Stats**:
```bash
curl -X GET http://localhost:3003/api/dashboard/stats \
  -H "Authorization: Bearer your-jwt-token"
```

**Register User**:
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe",
    "organizationName": "ABC Foods Ltd",
    "organizationType": "FOOD_MANUFACTURER",
    "acceptTerms": true
  }'
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `ANALYSIS_FAILED` | 422 | Analysis processing failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Support

For API support and technical questions:

- **Documentation**: https://docs.halalcheck.eu
- **Support Email**: api-support@halalcheck.eu
- **Developer Portal**: https://developers.halalcheck.eu
- **Status Page**: https://status.halalcheck.eu