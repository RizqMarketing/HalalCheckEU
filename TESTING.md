# HalalCheck EU - Complete Testing Guide

## 🧪 How to Test the Entire Platform

This guide walks you through testing the complete HalalCheck EU platform from frontend to backend.

## Prerequisites

Before you start testing, make sure you have:

- **Docker & Docker Compose** installed
- **Node.js 18+** installed
- **Git** installed
- **API Keys** configured (OpenAI, Stripe Test Keys)
- **Email Service** configured (Mailtrap for development)

## 🚀 Quick Start Testing

### 1. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd "HalalCheck AI"

# Copy environment configuration
cp .env.development .env

# Edit .env file with your API keys
nano .env
```

### 2. Configure API Keys

Edit the `.env` file and add your keys:

```bash
# OpenAI API Key (Required for ingredient analysis)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Test Keys (Required for payment testing)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Email Testing (Mailtrap recommended for development)
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
```

### 3. Start the Platform

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start (about 2-3 minutes)
docker-compose -f docker-compose.dev.yml logs -f
```

### 4. Run Automated Tests

```bash
# Make test script executable (if not already)
chmod +x scripts/test-full-stack.sh

# Run comprehensive tests
./scripts/test-full-stack.sh
```

## 📋 Manual Testing Workflows

### Test 1: User Registration and Authentication

1. **Open the platform**: http://localhost:3000
2. **Register a new user**:
   - Click "Register"
   - Fill in all required fields
   - Use format: `test+{timestamp}@example.com`
   - Choose organization type: "Food Manufacturer"
   - Select country: "Netherlands"
   - Accept terms and conditions
3. **Verify registration**:
   - Should redirect to dashboard
   - Check welcome message
   - Verify user menu appears

### Test 2: Ingredient Analysis - Halal Product

1. **Navigate to Analysis**: Click "New Analysis" or go to `/analysis`
2. **Enter product details**:
   ```
   Product Name: Halal Cookies
   Ingredients: wheat flour, sugar, vegetable oil, salt, baking powder, natural vanilla extract
   Category: Food & Beverage
   Region: EU
   ```
3. **Submit analysis** and wait for results
4. **Verify results**:
   - Overall Status should be "HALAL"
   - Risk Level should be "LOW" or "VERY_LOW"
   - Each ingredient should show individual status
   - Confidence scores should be displayed

### Test 3: Ingredient Analysis - Haram Product

1. **Create new analysis**:
   ```
   Product Name: Pork Sausage
   Ingredients: pork meat, beef, salt, spices, sodium nitrite
   Category: Food & Beverage
   Region: EU
   ```
2. **Verify results**:
   - Overall Status should be "HARAM"
   - Risk Level should be "VERY_HIGH"
   - Pork should be flagged as problematic
   - Warning messages should appear

### Test 4: Ingredient Analysis - Doubtful Product

1. **Create new analysis**:
   ```
   Product Name: Cheese Product
   Ingredients: milk, cheese culture, rennet, salt, natural flavors
   Category: Food & Beverage
   Region: EU
   ```
2. **Verify results**:
   - Overall Status might be "MASHBOOH" (doubtful)
   - Expert review should be recommended
   - Alternative suggestions should appear
   - Detailed explanations should be provided

### Test 5: Image Upload and OCR

1. **Go to Analysis page**
2. **Click "Image Upload" tab**
3. **Upload an image**:
   - Use any food product label image
   - Supported formats: JPG, PNG, GIF, WebP
   - Max size: 10MB
4. **Verify OCR processing**:
   - Text should be extracted from image
   - Extracted text should populate ingredient list
   - Edit extracted text if needed
   - Proceed with analysis

### Test 6: Dashboard and Statistics

1. **Go to Dashboard**: `/dashboard`
2. **Verify statistics**:
   - Total analyses count
   - Halal/Haram/Mashbooh breakdown
   - Monthly analysis chart
   - Usage statistics
3. **Check recent analyses**:
   - Recent analyses should be listed
   - Click on analysis to view details
4. **Test refresh functionality**:
   - Click refresh button
   - Statistics should update

### Test 7: Analysis History

1. **Navigate to**: `/analysis/history`
2. **Verify analysis list**:
   - All your analyses should be listed
   - Correct status colors and icons
   - Proper sorting by date
3. **Test filtering**:
   - Filter by status (Halal, Haram, Mashbooh)
   - Filter by date range
   - Search by product name
4. **Test actions**:
   - View analysis details
   - Generate report
   - Delete analysis

### Test 8: Report Generation

1. **From analysis results or history**
2. **Click "Generate Report"**
3. **Select report options**:
   - Format: PDF, Excel, or JSON
   - Include detailed breakdown
   - Include ingredient analysis
   - Include recommendations
4. **Verify report**:
   - Download should start automatically
   - Report should contain all requested data
   - Professional formatting and branding

### Test 9: Settings and Profile

1. **Go to Settings**: `/settings`
2. **Test profile update**:
   - Update name, phone, language
   - Change timezone
   - Update notification preferences
3. **Test password change**:
   - Enter current password
   - Set new secure password
   - Confirm password change
4. **Test organization settings** (if admin):
   - Update organization details
   - Manage users (if applicable)
   - View subscription information

### Test 10: Error Handling

1. **Test invalid inputs**:
   - Submit empty forms
   - Enter invalid email formats
   - Use weak passwords
   - Upload invalid file types
2. **Test network errors**:
   - Disconnect network during analysis
   - Submit multiple requests rapidly
   - Test with expired authentication

## 🔧 API Testing with cURL

### Authentication
```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org",
    "organizationType": "FOOD_MANUFACTURER",
    "country": "Netherlands",
    "phone": "+31612345678",
    "acceptTerms": true
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Ingredient Analysis
```bash
# Analyze ingredients (use token from login)
curl -X POST http://localhost:3001/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "productName": "Test Product",
    "ingredientList": "wheat flour, sugar, salt",
    "category": "FOOD_BEVERAGE",
    "region": "EU",
    "language": "en"
  }'
```

### Dashboard Data
```bash
# Get dashboard statistics
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3001/api/dashboard/stats

# Get recent analyses
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3001/api/dashboard/recent-analyses
```

## 🧪 Running Automated Tests

### Backend Unit Tests
```bash
cd backend
npm test
```

### Backend Integration Tests
```bash
cd backend
npm run test:integration
```

### Frontend Component Tests
```bash
cd frontend
npm test
```

### End-to-End Tests
```bash
# Install Playwright
npm install -g @playwright/test
playwright install

# Run E2E tests
playwright test
```

### Performance Tests
```bash
# Install k6
# Run load tests
k6 run tests/performance/load-test.js
```

## 📊 Testing Checklist

### ✅ Frontend Testing
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] Dashboard displays correctly
- [ ] Analysis form accepts input
- [ ] Results display properly
- [ ] Image upload works
- [ ] History page loads
- [ ] Report generation works
- [ ] Settings page functions
- [ ] Responsive design works
- [ ] Error messages display
- [ ] Loading states show

### ✅ Backend Testing
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Database connections
- [ ] Redis cache works
- [ ] File uploads process
- [ ] Email notifications send
- [ ] Rate limiting functions
- [ ] Input validation works
- [ ] Error handling proper
- [ ] Logging captures events
- [ ] Health checks pass

### ✅ Integration Testing
- [ ] Frontend connects to backend
- [ ] Database operations work
- [ ] Cache invalidation works
- [ ] File storage works
- [ ] Email delivery works
- [ ] Payment processing works
- [ ] Real-time updates work
- [ ] Session management works
- [ ] Security measures work

### ✅ Performance Testing
- [ ] Page load times < 3s
- [ ] API response times < 1s
- [ ] Analysis completion < 30s
- [ ] Concurrent user handling
- [ ] Memory usage reasonable
- [ ] Database query optimization
- [ ] Caching effectiveness

## 🐛 Common Issues and Solutions

### Issue: Services won't start
**Solution**: Check Docker logs and ensure ports aren't already in use
```bash
docker-compose -f docker-compose.dev.yml logs
netstat -tulpn | grep :3000
```

### Issue: Database connection fails
**Solution**: Ensure PostgreSQL is running and credentials are correct
```bash
docker-compose -f docker-compose.dev.yml ps
docker exec -it halalcheck-postgres-dev psql -U halalcheck -d halalcheck_dev
```

### Issue: OpenAI API fails
**Solution**: Check API key and account credits
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Issue: Frontend build fails
**Solution**: Clear cache and reinstall dependencies
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

## 📈 Performance Benchmarks

### Expected Performance
- **Frontend load time**: < 3 seconds
- **API response time**: < 1 second
- **Analysis processing**: < 30 seconds
- **Report generation**: < 10 seconds
- **Database queries**: < 100ms
- **Cache hit rate**: > 80%

### Load Testing Results
- **Concurrent users**: 100+
- **Requests per second**: 1000+
- **Memory usage**: < 512MB per service
- **CPU usage**: < 70% under load

## 🔒 Security Testing

### Authentication Tests
- [ ] Password complexity enforced
- [ ] JWT tokens expire properly
- [ ] Session management secure
- [ ] Rate limiting active
- [ ] CSRF protection works

### Input Validation Tests
- [ ] SQL injection prevented
- [ ] XSS attacks blocked
- [ ] File upload restricted
- [ ] Input sanitization works
- [ ] Error messages don't leak info

## 📝 Test Reports

After running tests, you'll find reports in:
- `backend/coverage/` - Backend test coverage
- `frontend/coverage/` - Frontend test coverage
- `test-results/` - E2E test results
- `playwright-report/` - Playwright test reports

## 🎯 Next Steps

1. **Run the automated test script**: `./scripts/test-full-stack.sh`
2. **Perform manual testing workflows**
3. **Check all items in testing checklist**
4. **Review test reports and coverage**
5. **Fix any issues found**
6. **Re-run tests to verify fixes**

The platform is ready for production when all tests pass successfully! 🚀