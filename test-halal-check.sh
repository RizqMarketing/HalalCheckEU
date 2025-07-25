#!/bin/bash

# Simple test script for halal check functionality

echo "🧪 Testing HalalCheck EU - Halal Analysis Function"

API_URL="http://localhost:3001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if services are running
check_services() {
    info "Checking if services are running..."
    
    if curl -f -s "$API_URL/health" > /dev/null; then
        log "Backend is running"
    else
        error "Backend is not running. Please start it first."
        exit 1
    fi
    
    if curl -f -s "http://localhost:3000" > /dev/null; then
        log "Frontend is running"
    else
        error "Frontend is not running. Please start it first."
        exit 1
    fi
}

# Test halal ingredient analysis
test_halal_analysis() {
    info "Testing halal ingredient analysis..."
    
    # Test 1: Halal ingredients
    echo "Test 1: Halal ingredients (wheat flour, sugar, salt)"
    response=$(curl -s -X POST "$API_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -d '{
            "productName": "Halal Test Cookies",
            "ingredientList": "wheat flour, sugar, vegetable oil, salt, baking powder",
            "category": "FOOD_BEVERAGE",
            "region": "EU"
        }')
    
    if echo "$response" | grep -q "success.*true"; then
        status=$(echo "$response" | grep -o '"overallStatus":"[^"]*' | cut -d'"' -f4)
        log "Analysis successful - Status: $status"
    else
        error "Halal analysis failed"
        echo "Response: $response"
    fi
    
    echo ""
    
    # Test 2: Haram ingredients  
    echo "Test 2: Haram ingredients (pork)"
    response=$(curl -s -X POST "$API_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -d '{
            "productName": "Pork Test Product",
            "ingredientList": "pork meat, salt, spices",
            "category": "FOOD_BEVERAGE", 
            "region": "EU"
        }')
    
    if echo "$response" | grep -q "success.*true"; then
        status=$(echo "$response" | grep -o '"overallStatus":"[^"]*' | cut -d'"' -f4)
        log "Analysis successful - Status: $status"
    else
        error "Haram analysis failed"
        echo "Response: $response"
    fi
    
    echo ""
    
    # Test 3: Mixed/Doubtful ingredients
    echo "Test 3: Doubtful ingredients (cheese with rennet)"
    response=$(curl -s -X POST "$API_URL/api/analysis/analyze" \
        -H "Content-Type: application/json" \
        -d '{
            "productName": "Cheese Test Product",
            "ingredientList": "milk, cheese culture, rennet, salt",
            "category": "FOOD_BEVERAGE",
            "region": "EU"
        }')
    
    if echo "$response" | grep -q "success.*true"; then
        status=$(echo "$response" | grep -o '"overallStatus":"[^"]*' | cut -d'"' -f4)
        log "Analysis successful - Status: $status"
    else
        error "Doubtful analysis failed"
        echo "Response: $response"
    fi
}

# Main execution
main() {
    check_services
    test_halal_analysis
    
    echo ""
    log "🎉 Halal check testing completed!"
    echo ""
    info "You can now test manually at: http://localhost:3000/analysis"
}

main "$@"