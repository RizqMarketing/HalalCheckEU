# HalalCheck AI Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the HalalCheck AI multi-organization platform across different environments, from development setup to production deployment with full scalability and monitoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Database Setup](#database-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling Strategies](#scaling-strategies)
10. [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

#### Development Environment
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)

#### Production Environment
- **CPU**: 4+ cores for backend, 2+ cores for frontend
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB+ for logs and data
- **Network**: Stable internet connection with HTTPS support

#### External Services
- **OpenAI API**: GPT-4o access with sufficient quota
- **Database**: PostgreSQL 15+ (production) or file-based (development)
- **Redis**: v7+ for caching (production)
- **SMTP**: Email service for notifications

### Required API Keys

Before deployment, obtain the following API keys:

```bash
# Required
OPENAI_API_KEY="sk-..."              # OpenAI GPT-4o API key
JWT_SECRET="your-jwt-secret-key"      # JWT token signing key

# Optional (Production)
DATABASE_URL="postgresql://..."       # PostgreSQL connection string
REDIS_URL="redis://..."              # Redis connection string
STRIPE_SECRET_KEY="sk_..."           # Stripe payment processing
SENDGRID_API_KEY="SG...."           # Email service API key
```

## Development Setup

### Quick Start (Current Active Setup)

The platform currently runs on a simplified setup optimized for development and testing:

#### 1. Clone Repository
```bash
git clone <repository-url>
cd "HalalCheck AI"
```

#### 2. Start Backend Server
```bash
# Navigate to root directory
cd "C:\Users\mazin\HalalCheck AI"

# Start simple backend server (Port 3003)
node simple-server.js
```

#### 3. Start Frontend Server
```bash
# Navigate to frontend directory
cd "C:\Users\mazin\HalalCheck AI\halalcheck-app"

# Install dependencies (first time only)
npm install

# Start development server (Port 3004)
npm run dev -- --port 3004
```

#### 4. Verify Services
```bash
# Test backend health
curl http://localhost:3003/health

# Test frontend availability
curl -I http://localhost:3004
```

### Development Environment Variables

Create environment files for development:

#### Backend Environment (`.env`)
```bash
# API Configuration
PORT=3003
NODE_ENV=development
CORS_ORIGIN=http://localhost:3004

# OpenAI Integration
OPENAI_API_KEY=sk-your-openai-key-here

# Authentication
JWT_SECRET=your-development-jwt-secret
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=debug
```

#### Frontend Environment (`halalcheck-app/.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3003

# Application Settings
NEXT_PUBLIC_APP_NAME="HalalCheck AI"
NEXT_PUBLIC_APP_VERSION="2.0.0"

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
```

## Environment Configuration

### Environment Types

#### Development
- **Purpose**: Local development and testing
- **Database**: File-based or local PostgreSQL
- **Caching**: In-memory or local Redis
- **Authentication**: Mock JWT tokens
- **Logging**: Console output with debug level

#### Staging
- **Purpose**: Pre-production testing and QA
- **Database**: Staging PostgreSQL instance
- **Caching**: Shared Redis instance
- **Authentication**: Full JWT implementation
- **Logging**: File-based with info level

#### Production
- **Purpose**: Live customer environment
- **Database**: Production PostgreSQL cluster
- **Caching**: Production Redis cluster
- **Authentication**: Secure JWT with refresh tokens
- **Logging**: Centralized logging with monitoring

### Configuration Management

#### Environment-Specific Settings
```javascript
// config/environments.js
const environments = {
  development: {
    api: {
      port: 3003,
      cors: ['http://localhost:3004'],
      rateLimit: false
    },
    database: {
      type: 'file',
      path: './data/dev.db'
    }
  },
  
  production: {
    api: {
      port: process.env.PORT || 8080,
      cors: process.env.CORS_ORIGINS?.split(',') || [],
      rateLimit: true
    },
    database: {
      type: 'postgresql',
      url: process.env.DATABASE_URL
    }
  }
}
```

## Production Deployment

### Traditional Server Deployment

#### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url> /opt/halalcheck
cd /opt/halalcheck

# Install backend dependencies
npm install --production

# Install frontend dependencies
cd halalcheck-app
npm install --production
npm run build

# Create production environment files
cp .env.example .env
nano .env  # Configure production values
```

#### 3. Process Management with PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'halalcheck-backend',
      script: 'simple-server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'halalcheck-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3004',
      cwd: './halalcheck-app',
      instances: 2,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

#### 4. Start Services
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Nginx Configuration

#### Reverse Proxy Setup
```nginx
# /etc/nginx/sites-available/halalcheck
server {
    listen 80;
    server_name api.halalcheck.eu;
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3003;
    }
}

server {
    listen 80;
    server_name app.halalcheck.eu;
    
    # Frontend Application
    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d api.halalcheck.eu -d app.halalcheck.eu

# Test automatic renewal
sudo certbot renew --dry-run
```

## Docker Deployment

### Docker Configuration

#### Backend Dockerfile
```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start application
CMD ["node", "simple-server.js"]
```

#### Frontend Dockerfile
```dockerfile
# Dockerfile (Frontend)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY halalcheck-app/package*.json ./
RUN npm ci

# Copy source code
COPY halalcheck-app/ .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3004

# Start application
CMD ["npm", "start"]
```

### Docker Compose

#### Development Compose
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build: ./halalcheck-app
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3003
    depends_on:
      - backend
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### Production Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./halalcheck-app
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Docker Deployment Commands

```bash
# Development deployment
docker-compose -f docker-compose.dev.yml up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS with Fargate
```json
{
  "family": "halalcheck-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/halalcheck-backend",
      "portMappings": [
        {
          "containerPort": 3003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/halalcheck-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### CloudFormation Template
```yaml
# cloudformation/infrastructure.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'HalalCheck AI Infrastructure'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true

  # Add more infrastructure resources...
  
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: halalcheck-cluster

  BackendService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref BackendTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
```

### Vercel Deployment (Frontend)

#### Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "halalcheck-app/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.halalcheck.eu/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/halalcheck-app/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.halalcheck.eu"
  }
}
```

#### Deployment Commands
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
cd halalcheck-app
vercel --prod
```

### Railway Deployment (Backend)

#### Configuration
```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node simple-server.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"

[[services]]
name = "halalcheck-backend"

[services.variables]
NODE_ENV = "production"
PORT = "3003"
```

## Database Setup

### PostgreSQL Configuration

#### Database Schema
```sql
-- database/schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('certification-body', 'food-manufacturer', 'import-export')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analyses table
CREATE TABLE analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    product_name VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    results JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications/Products table (organization-specific)
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    analysis_id UUID REFERENCES analyses(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    pipeline_stage VARCHAR(100) NOT NULL,
    client_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    organization_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_analyses_organization ON analyses(organization_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_applications_organization ON applications(organization_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_org_type ON analytics_events(organization_type);
```

#### Database Migration
```javascript
// database/migrations/001_initial_schema.js
exports.up = function(knex) {
  return knex.schema
    .createTable('organizations', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 255).notNullable();
      table.enu('type', ['certification-body', 'food-manufacturer', 'import-export']).notNullable();
      table.jsonb('settings').defaultTo('{}');
      table.timestamps(true, true);
    })
    .createTable('users', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 255).notNullable();
      table.string('last_name', 255).notNullable();
      table.uuid('organization_id').references('id').inTable('organizations');
      table.string('role', 50).defaultTo('user');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('users')
    .dropTable('organizations');
};
```

### Redis Configuration

#### Cache Strategy
```javascript
// lib/cache.js
const redis = require('redis');

class CacheManager {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
  }

  async setAnalysisCache(key, data, ttl = 3600) {
    return this.client.setex(`analysis:${key}`, ttl, JSON.stringify(data));
  }

  async getAnalysisCache(key) {
    const data = await this.client.get(`analysis:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async setOrganizationConfig(orgType, config, ttl = 86400) {
    return this.client.setex(`org:${orgType}`, ttl, JSON.stringify(config));
  }

  async getOrganizationConfig(orgType) {
    const data = await this.client.get(`org:${orgType}`);
    return data ? JSON.parse(data) : null;
  }
}

module.exports = new CacheManager();
```

## Monitoring & Logging

### Application Monitoring

#### Health Check Endpoints
```javascript
// health-check.js
const healthChecks = {
  async database() {
    try {
      // Test database connection
      const result = await db.query('SELECT 1');
      return { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async redis() {
    try {
      const start = Date.now();
      await redis.ping();
      return { status: 'healthy', response_time: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async openai() {
    try {
      const start = Date.now();
      // Test OpenAI API connection
      await openaiClient.models.list();
      return { status: 'healthy', response_time: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};

app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    healthChecks.database(),
    healthChecks.redis(),
    healthChecks.openai()
  ]);

  const overallStatus = checks.every(check => check.status === 'healthy') 
    ? 'healthy' : 'unhealthy';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status,
      redis: checks[1].status,
      openai: checks[2].status
    },
    version: process.env.APP_VERSION || '2.0.0'
  });
});
```

#### Prometheus Metrics
```javascript
// metrics.js
const promClient = require('prom-client');

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const analysisCounter = new promClient.Counter({
  name: 'analysis_requests_total',
  help: 'Total number of analysis requests',
  labelNames: ['organization_type', 'status']
});

const organizationActiveUsers = new promClient.Gauge({
  name: 'organization_active_users',
  help: 'Number of active users per organization type',
  labelNames: ['organization_type']
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

### Logging Configuration

#### Winston Logger Setup
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'halalcheck-api',
    version: process.env.APP_VERSION 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Log analysis requests
logger.logAnalysis = (organizationType, action, data) => {
  logger.info('Analysis request', {
    type: 'analysis',
    organizationType,
    action,
    ...data
  });
};

module.exports = logger;
```

## Scaling Strategies

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
# Load balancer configuration
upstream backend_servers {
    least_conn;
    server backend1:3003 max_fails=3 fail_timeout=30s;
    server backend2:3003 max_fails=3 fail_timeout=30s;
    server backend3:3003 max_fails=3 fail_timeout=30s;
}

upstream frontend_servers {
    least_conn;
    server frontend1:3004 max_fails=3 fail_timeout=30s;
    server frontend2:3004 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location / {
        proxy_pass http://frontend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Auto-Scaling Configuration
```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: halalcheck-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: halalcheck-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

#### Read Replicas
```javascript
// database/connection.js
const { Pool } = require('pg');

class DatabaseManager {
  constructor() {
    // Master database for writes
    this.masterPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Read replica for read operations
    this.replicaPool = new Pool({
      connectionString: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query(text, params, useReplica = false) {
    const pool = useReplica ? this.replicaPool : this.masterPool;
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.info('Database query executed', {
        duration,
        rows: result.rowCount,
        replica: useReplica
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed', { error: error.message, query: text });
      throw error;
    }
  }

  // Read operations use replica
  async getAnalyses(organizationId) {
    return this.query(
      'SELECT * FROM analyses WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId],
      true // Use read replica
    );
  }

  // Write operations use master
  async createAnalysis(data) {
    return this.query(
      'INSERT INTO analyses (organization_id, product_name, ingredients, results) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.organizationId, data.productName, data.ingredients, data.results],
      false // Use master database
    );
  }
}

module.exports = new DatabaseManager();
```

## Security Considerations

### HTTPS and SSL/TLS

#### SSL Certificate Management
```bash
# Automatic certificate renewal
0 2 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

#### Security Headers
```javascript
// security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://api.openai.com"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Authentication & Authorization

#### JWT Security
```javascript
// auth/jwt.js
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  issuer: 'halalcheck-api',
  audience: 'halalcheck-app'
};

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      organizationType: user.organizationType,
      role: user.role
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

app.use('/api/auth', authLimiter);
```

### Data Protection

#### Encryption at Rest
```javascript
// encryption.js
const crypto = require('crypto');

class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = new EncryptionManager();
```

### Backup & Disaster Recovery

#### Database Backup Strategy
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DATABASE_NAME="halalcheck"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DATABASE_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://halalcheck-backups/database/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

#### Disaster Recovery Plan
```yaml
# disaster-recovery.yaml
recovery_procedures:
  database_failure:
    - Stop application services
    - Restore from latest backup
    - Verify data integrity
    - Restart services
    - Validate functionality
  
  application_failure:
    - Check system resources
    - Review application logs
    - Restart failed services
    - Monitor recovery
  
  complete_infrastructure_failure:
    - Deploy infrastructure from code
    - Restore database from backup
    - Deploy application code
    - Configure DNS and load balancers
    - Validate all services
```

## Conclusion

This deployment guide provides comprehensive instructions for deploying HalalCheck AI across different environments and scales. The platform is designed to be flexible and scalable, supporting everything from development setups to large-scale production deployments.

Key considerations for successful deployment:

1. **Start Simple**: Begin with the development setup and gradually add complexity
2. **Monitor Everything**: Implement comprehensive monitoring from day one
3. **Security First**: Never compromise on security, especially for religious compliance
4. **Plan for Scale**: Design your deployment to handle growth from the beginning
5. **Backup Strategy**: Implement robust backup and disaster recovery procedures

For additional deployment support or questions about specific environments, contact the HalalCheck AI technical team.