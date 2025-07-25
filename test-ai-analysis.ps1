Write-Host "Testing AI Analysis..." -ForegroundColor Green

$body = @{
    productName = "Test Halal Cookies"
    ingredientList = "wheat flour, sugar, vegetable oil, salt, baking powder, natural vanilla extract"
    category = "FOOD_BEVERAGE"
    region = "EU"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/analysis/analyze' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "✅ Analysis successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Analysis failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Read-Host "Press Enter to close"