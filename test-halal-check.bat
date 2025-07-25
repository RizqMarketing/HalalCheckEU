@echo off
echo 🧪 Testing HalalCheck EU - Halal Analysis Function

set API_URL=http://localhost:3001

echo ℹ️  Checking if services are running...

:: Check backend
curl -f -s %API_URL%/health > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running. Please start it first.
    pause
    exit /b 1
)

:: Check frontend
curl -f -s http://localhost:3000 > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not running. Please start it first.
    pause
    exit /b 1
)

echo.
echo ℹ️  Testing halal ingredient analysis...

:: Test 1: Halal ingredients
echo Test 1: Halal ingredients (wheat flour, sugar, salt)
curl -s -X POST "%API_URL%/api/analysis/analyze" ^
    -H "Content-Type: application/json" ^
    -d "{\"productName\":\"Halal Test Cookies\",\"ingredientList\":\"wheat flour, sugar, vegetable oil, salt, baking powder\",\"category\":\"FOOD_BEVERAGE\",\"region\":\"EU\"}" > temp_response.json

findstr "success.*true" temp_response.json > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Halal analysis successful
    findstr "overallStatus" temp_response.json
) else (
    echo ❌ Halal analysis failed
    type temp_response.json
)

echo.

:: Test 2: Haram ingredients  
echo Test 2: Haram ingredients (pork)
curl -s -X POST "%API_URL%/api/analysis/analyze" ^
    -H "Content-Type: application/json" ^
    -d "{\"productName\":\"Pork Test Product\",\"ingredientList\":\"pork meat, salt, spices\",\"category\":\"FOOD_BEVERAGE\",\"region\":\"EU\"}" > temp_response.json

findstr "success.*true" temp_response.json > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Haram analysis successful  
    findstr "overallStatus" temp_response.json
) else (
    echo ❌ Haram analysis failed
    type temp_response.json
)

echo.

:: Test 3: Doubtful ingredients
echo Test 3: Doubtful ingredients (cheese with rennet)
curl -s -X POST "%API_URL%/api/analysis/analyze" ^
    -H "Content-Type: application/json" ^
    -d "{\"productName\":\"Cheese Test Product\",\"ingredientList\":\"milk, cheese culture, rennet, salt\",\"category\":\"FOOD_BEVERAGE\",\"region\":\"EU\"}" > temp_response.json

findstr "success.*true" temp_response.json > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Doubtful analysis successful
    findstr "overallStatus" temp_response.json
) else (
    echo ❌ Doubtful analysis failed
    type temp_response.json
)

:: Cleanup
del temp_response.json > nul 2>&1

echo.
echo ✅ 🎉 Halal check testing completed!
echo.
echo ℹ️  You can now test manually at: http://localhost:3000/analysis