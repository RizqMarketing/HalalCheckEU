@echo off
echo Testing AI Analysis with curl...
curl -v -X POST http://localhost:3001/api/analysis/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"productName\":\"Test Halal Cookies\",\"ingredientList\":\"wheat flour, sugar, vegetable oil, salt, baking powder, natural vanilla extract\",\"category\":\"FOOD_BEVERAGE\",\"region\":\"EU\"}"
pause