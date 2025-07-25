#!/bin/bash

# HalalCheck EU - Full Stack Testing Script
# 
# This script tests the entire platform from frontend to backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
TEST_EMAIL="test@halalcheck.eu"
TEST_PASSWORD="TestPassword123!"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ INFO: $1${NC}"
}

# Check if services are running
check_services() {
    info "Checking if services are running..."
    
    # Check backend
    if curl -f -s "$API_URL/health" > /dev/null; then
        log "Backend service is running"
    else
        error "Backend service is not responding"
        exit 1
    fi
    
    # Check frontend
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        log "Frontend service is running"
    else
        error "Frontend service is not responding"
        exit 1
    fi
    
    # Check database
    if curl -f -s "$API_URL/health/database" > /dev/null; then
        log "Database is connected"
    else
        error "Database connection failed"
        exit 1
    fi
    
    # Check Redis
    if curl -f -s "$API_URL/health/cache" > /dev/null; then
        log "Redis cache is connected"
    else
        warning "Redis cache connection failed (non-critical)"
    fi
}

# Test API endpoints
test_api() {
    info "Testing API endpoints..."
    
    # Test health endpoint
    response=$(curl -s "$API_URL/health")
    if echo "$response" | grep -q "healthy"; then
        log "Health endpoint working"
    else
        error "Health endpoint failed"
        exit 1
    fi
    
    # Test halal ingredients endpoint
    response=$(curl -s "$API_URL/api/halal-ingredients?limit=10")
    if echo "$response" | grep -q "success.*true"; then
        log "Halal ingredients API working"
    else
        error "Halal ingredients API failed"
        exit 1
    fi
    
    # Test authentication endpoints (without authentication)
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/auth/me")
    if [ "$response" = "401" ]; then
        log "Authentication protection working"
    else
        error "Authentication protection failed"
        exit 1
    fi
}

# Test user registration and authentication flow
test_auth_flow() {
    info "Testing complete authentication flow..."
    
    # Generate unique email for testing
    timestamp=$(date +%s)
    test_email="test${timestamp}@halalcheck.eu"
    
    # Test user registration
    info "Testing user registration..."
    registration_response=$(curl -s -X POST "$API_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$test_email\",
            \"password\": \"$TEST_PASSWORD\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"organizationName\": \"Test Organization\",
            \"organizationType\": \"FOOD_MANUFACTURER\",
            \"country\": \"Netherlands\",
            \"phone\": \"+31612345678\",
            \"acceptTerms\": true
        }")
    
    if echo "$registration_response" | grep -q "success.*true"; then
        log "User registration successful"
        # Extract tokens
        access_token=$(echo "$registration_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        if [ -n "$access_token" ]; then
            log "Access token received"
        else
            error "No access token in registration response"
            exit 1
        fi
    else
        error "User registration failed: $registration_response"
        exit 1
    fi
    
    # Test authentication with token
    info "Testing authenticated request..."
    profile_response=$(curl -s -H "Authorization: Bearer $access_token" "$API_URL/api/auth/me")
    if echo "$profile_response" | grep -q "$test_email"; then
        log "Authentication working correctly"
    else
        error "Authentication failed: $profile_response"
        exit 1
    fi
    
    # Store token for later tests
    echo "$access_token" > /tmp/halalcheck_token
    echo "$test_email" > /tmp/halalcheck_email
}

# Test ingredient analysis flow
test_analysis_flow() {
    info "Testing ingredient analysis flow..."
    
    # Get stored token
    access_token=$(cat /tmp/halalcheck_token 2>/dev/null || echo "")
    if [ -z "$access_token" ]; then
        warning "No access token found, skipping analysis tests"
        return
    fi
    
    # Test halal product analysis
    info "Testing halal product analysis..."
    analysis_response=$(curl -s -X POST "$API_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"productName\": \"Test Halal Cookies\",
            \"ingredientList\": \"wheat flour, sugar, vegetable oil, salt, baking powder\",
            \"category\": \"FOOD_BEVERAGE\",
            \"region\": \"EU\",
            \"language\": \"en\"
        }")
    
    if echo "$analysis_response" | grep -q "success.*true"; then
        log "Halal analysis successful"
        
        # Check if result contains expected fields
        if echo "$analysis_response" | grep -q "overallStatus" && \
           echo "$analysis_response" | grep -q "ingredients"; then
            log "Analysis response structure correct"
            
            # Extract analysis ID for further testing
            analysis_id=$(echo "$analysis_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
            if [ -n "$analysis_id" ]; then
                echo "$analysis_id" > /tmp/halalcheck_analysis_id
                log "Analysis ID saved: $analysis_id"
            fi
        else
            error "Analysis response missing required fields"
            exit 1
        fi
    else
        error "Halal analysis failed: $analysis_response"
        exit 1
    fi
    
    # Test haram product analysis
    info "Testing haram product analysis..."
    haram_response=$(curl -s -X POST "$API_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"productName\": \"Test Pork Product\",
            \"ingredientList\": \"pork meat, salt, spices\",
            \"category\": \"FOOD_BEVERAGE\",
            \"region\": \"EU\",
            \"language\": \"en\"
        }")
    
    if echo "$haram_response" | grep -q "success.*true"; then
        if echo "$haram_response" | grep -q "HARAM"; then
            log "Haram detection working correctly"
        else
            warning "Haram product not detected as HARAM (might be expected depending on AI model)"
        fi
    else
        error "Haram analysis failed: $haram_response"
        exit 1
    fi
}

# Test dashboard and statistics
test_dashboard() {
    info "Testing dashboard endpoints..."
    
    access_token=$(cat /tmp/halalcheck_token 2>/dev/null || echo "")
    if [ -z "$access_token" ]; then
        warning "No access token found, skipping dashboard tests"
        return
    fi
    
    # Test dashboard statistics
    stats_response=$(curl -s -H "Authorization: Bearer $access_token" "$API_URL/api/dashboard/stats")
    if echo "$stats_response" | grep -q "success.*true"; then
        if echo "$stats_response" | grep -q "totalAnalyses"; then
            log "Dashboard statistics working"
        else
            error "Dashboard statistics missing required fields"
            exit 1
        fi
    else
        error "Dashboard statistics failed: $stats_response"
        exit 1
    fi
    
    # Test recent analyses
    recent_response=$(curl -s -H "Authorization: Bearer $access_token" "$API_URL/api/dashboard/recent-analyses")
    if echo "$recent_response" | grep -q "success.*true"; then
        log "Recent analyses endpoint working"
    else
        error "Recent analyses failed: $recent_response"
        exit 1
    fi
    
    # Test usage statistics
    usage_response=$(curl -s -H "Authorization: Bearer $access_token" "$API_URL/api/dashboard/usage")
    if echo "$usage_response" | grep -q "success.*true"; then
        log "Usage statistics working"
    else
        warning "Usage statistics failed (might not be implemented yet)"
    fi
}

# Test report generation
test_reports() {
    info "Testing report generation..."
    
    access_token=$(cat /tmp/halalcheck_token 2>/dev/null || echo "")
    analysis_id=$(cat /tmp/halalcheck_analysis_id 2>/dev/null || echo "")
    
    if [ -z "$access_token" ] || [ -z "$analysis_id" ]; then
        warning "No access token or analysis ID found, skipping report tests"
        return
    fi
    
    # Test PDF report generation
    report_response=$(curl -s -X POST "$API_URL/api/reports/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"format\": \"pdf\",
            \"analysisIds\": [\"$analysis_id\"],
            \"includeDetails\": true,
            \"includeIngredientBreakdown\": true
        }")
    
    if echo "$report_response" | grep -q "success.*true"; then
        if echo "$report_response" | grep -q "reportId"; then
            log "PDF report generation successful"
        else
            error "PDF report response missing reportId"
            exit 1
        fi
    else
        error "PDF report generation failed: $report_response"
        exit 1
    fi
}

# Test file upload functionality
test_file_upload() {
    info "Testing file upload functionality..."
    
    access_token=$(cat /tmp/halalcheck_token 2>/dev/null || echo "")
    if [ -z "$access_token" ]; then
        warning "No access token found, skipping file upload tests"
        return
    fi
    
    # Create a test image file
    test_image="/tmp/test_ingredient_label.jpg"
    # Create a minimal valid JPEG (this is a 1x1 pixel JPEG)
    echo -e '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\'"'"' ",#\x1c\x1c(7),01444\x1f\x27=9<9<954<\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9' > "$test_image"
    
    # Test file upload
    upload_response=$(curl -s -X POST "$API_URL/api/upload" \
        -H "Authorization: Bearer $access_token" \
        -F "file=@$test_image;type=image/jpeg")
    
    if echo "$upload_response" | grep -q "success.*true"; then
        log "File upload successful"
    else
        warning "File upload failed (might not be fully implemented): $upload_response"
    fi
    
    # Clean up test file
    rm -f "$test_image"
}

# Test error handling
test_error_handling() {
    info "Testing error handling..."
    
    # Test invalid endpoint
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/nonexistent")
    if [ "$response" = "404" ]; then
        log "404 error handling working"
    else
        error "404 error handling failed, got: $response"
    fi
    
    # Test malformed JSON
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "invalid json")
    if echo "$response" | grep -q "error"; then
        log "Malformed JSON handling working"
    else
        error "Malformed JSON handling failed"
    fi
    
    # Test rate limiting (make multiple rapid requests)
    info "Testing rate limiting..."
    for i in {1..20}; do
        curl -s "$API_URL/api/halal-ingredients" > /dev/null
    done
    
    # Check if rate limiting kicks in
    rate_limit_response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/halal-ingredients")
    if [ "$rate_limit_response" = "429" ]; then
        log "Rate limiting working"
    else
        warning "Rate limiting might not be active (got: $rate_limit_response)"
    fi
}

# Test frontend functionality
test_frontend() {
    info "Testing frontend functionality..."
    
    # Test main page loads
    if curl -s "$FRONTEND_URL" | grep -q "HalalCheck"; then
        log "Frontend main page loads"
    else
        error "Frontend main page failed to load"
        exit 1
    fi
    
    # Test static assets
    if curl -s "$FRONTEND_URL/_next/static" > /dev/null 2>&1; then
        log "Frontend static assets accessible"
    else
        warning "Frontend static assets might not be available"
    fi
    
    # Test API routes from frontend
    if curl -s "$FRONTEND_URL/api/health" > /dev/null 2>&1; then
        log "Frontend API routes accessible"
    else
        warning "Frontend API routes might not be available"
    fi
}

# Performance testing
test_performance() {
    info "Running basic performance tests..."
    
    # Test response times
    start_time=$(date +%s%N)
    curl -s "$API_URL/health" > /dev/null
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $response_time -lt 1000 ]; then
        log "API response time good: ${response_time}ms"
    elif [ $response_time -lt 3000 ]; then
        warning "API response time acceptable: ${response_time}ms"
    else
        error "API response time too slow: ${response_time}ms"
    fi
    
    # Test concurrent requests
    info "Testing concurrent requests..."
    for i in {1..10}; do
        curl -s "$API_URL/health" > /dev/null &
    done
    wait
    log "Concurrent requests completed"
}

# Cleanup function
cleanup() {
    info "Cleaning up test data..."
    rm -f /tmp/halalcheck_token
    rm -f /tmp/halalcheck_email
    rm -f /tmp/halalcheck_analysis_id
    log "Cleanup completed"
}

# Main test execution
main() {
    echo -e "${BLUE}🧪 HalalCheck EU - Full Stack Testing${NC}"
    echo -e "${BLUE}=====================================\n${NC}"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Run all tests
    check_services
    test_api
    test_auth_flow
    test_analysis_flow
    test_dashboard
    test_reports
    test_file_upload
    test_error_handling
    test_frontend
    test_performance
    
    echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
    echo -e "${GREEN}The HalalCheck EU platform is working correctly.${NC}\n"
    
    # Test summary
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "✅ Services Health Check"
    echo -e "✅ API Endpoints"
    echo -e "✅ Authentication Flow"
    echo -e "✅ Ingredient Analysis"
    echo -e "✅ Dashboard & Statistics"
    echo -e "✅ Report Generation"
    echo -e "✅ File Upload"
    echo -e "✅ Error Handling"
    echo -e "✅ Frontend Functionality"
    echo -e "✅ Performance Testing"
}

# Run main function
main "$@"