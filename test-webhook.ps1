# Test BillStack Webhook Script for DanBaiwaH Data Plug
# This script sends a test webhook to your local or production endpoint

param(
    [string]$SecretKey = "",
    [string]$WebhookUrl = "https://danbaiwahdataplug.com/api/webhooks/billstack",
    [int]$Amount = 100,
    [string]$Reference = "TEST-$(Get-Random -Minimum 1000000 -Maximum 9999999)",
    [string]$UserId = "1816f487-7e80-4683-a9c0-88e70b57b833"
)

# If no secret key provided, display instructions
if ([string]::IsNullOrEmpty($SecretKey)) {
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host "BillStack Webhook Test Script" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANT: You need to provide your BILLSTACK_SECRET_KEY" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get it from Vercel:" -ForegroundColor Green
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project 'danbaiwahdataplug'" -ForegroundColor White
    Write-Host "3. Click Settings → Environment Variables" -ForegroundColor White
    Write-Host "4. Find 'BILLSTACK_SECRET_KEY'" -ForegroundColor White
    Write-Host "5. Copy the value (it starts with a few characters)" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Cyan
    Write-Host "  .\test-webhook.ps1 -SecretKey 'YOUR_SECRET_KEY_HERE'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Optional parameters:" -ForegroundColor Green
    Write-Host "  -Amount 500              # Set deposit amount in naira" -ForegroundColor White
    Write-Host "  -Reference 'R-ABC123'    # Set transaction reference" -ForegroundColor White
    Write-Host "  -WebhookUrl '...'        # Override webhook URL" -ForegroundColor White
    exit
}

# Calculate MD5 signature of secret key
$md5 = [System.Security.Cryptography.MD5]::Create()
$secretBytes = [System.Text.Encoding]::UTF8.GetBytes($SecretKey)
$hashBytes = $md5.ComputeHash($secretBytes)
$signature = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Sending Test Webhook" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Construct the webhook payload
$timestamp = [System.DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$payload = @{
    event = "PAYMENT_NOTIFICATION"
    data = @{
        type = "RESERVED_ACCOUNT_TRANSACTION"
        reference = $Reference
        merchant_reference = "DNBWH-$(Get-Date -Format 'yyyyMMddHHmmss')-57b833"
        wiaxy_ref = "WX-$(Get-Random -Minimum 100000 -Maximum 999999)"
        amount = $Amount
        created_at = $timestamp
        account = @{
            account_number = "0123456789"
            account_name = "DanBaiwaH Test Account"
            bank_name = "Access Bank"
            created_at = $timestamp
        }
        payer = @{
            account_number = "1234567890"
            first_name = "Test"
            last_name = "User"
            createdAt = $timestamp
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "📋 Payload Details:" -ForegroundColor Green
Write-Host "  Reference: $Reference"
Write-Host "  Amount: ₦$Amount"
Write-Host "  Timestamp: $timestamp"
Write-Host "  Signature: $($signature.Substring(0, 16))..." -ForegroundColor DarkGray
Write-Host ""
Write-Host "🌐 Sending to: $WebhookUrl" -ForegroundColor Cyan
Write-Host ""

# Send the webhook
try {
    $headers = @{
        "x-wiaxy-signature" = $signature
        "Content-Type" = "application/json; charset=utf-8"
    }

    $response = Invoke-WebRequest `
        -Uri $WebhookUrl `
        -Method POST `
        -Headers $headers `
        -Body $payload `
        -ContentType "application/json; charset=utf-8" `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $response.Content
}
catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host ""
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response Body:" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
        $reader.Close()
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
