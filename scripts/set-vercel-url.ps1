# Set Vercel Postgres URL in .env.local
# Usage: .\scripts\set-vercel-url.ps1 "your-postgres-url"

param(
    [Parameter(Mandatory=$false)]
    [string]$PostgresUrl
)

$envPath = Join-Path $PSScriptRoot ".." ".env.local"

Write-Host "`n🔧 Vercel Postgres URL Setup`n" -ForegroundColor Cyan

# If no URL provided, ask for it
if (-not $PostgresUrl) {
    Write-Host "Fügen Sie Ihre Vercel POSTGRES_URL ein:" -ForegroundColor Yellow
    Write-Host "(Zu finden in: Vercel Dashboard → Storage → Ihre DB → .env.local Tab)`n" -ForegroundColor Gray
    $PostgresUrl = Read-Host "POSTGRES_URL"
}

# Validate URL
if (-not $PostgresUrl.StartsWith("postgres://") -and -not $PostgresUrl.StartsWith("postgresql://")) {
    Write-Host "❌ Ungültige URL! Muss mit postgres:// oder postgresql:// beginnen" -ForegroundColor Red
    exit 1
}

# Generate NEXTAUTH_SECRET
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$nextauthSecret = [Convert]::ToBase64String($bytes)

# Create backup if file exists
if (Test-Path $envPath) {
    $backupPath = "$envPath.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item $envPath $backupPath
    Write-Host "✓ Backup erstellt: $(Split-Path $backupPath -Leaf)" -ForegroundColor Green
}

# Create .env.local content
$envContent = @"
# PostgreSQL Database Connection (Vercel Postgres)
DATABASE_URL="$PostgresUrl"
POSTGRES_URL="$PostgresUrl"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$nextauthSecret
"@

# Write file
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host "✓ .env.local erstellt/aktualisiert`n" -ForegroundColor Green

# Show redacted URL
$redactedUrl = $PostgresUrl -replace ':[^:@]+@', ':****@'
Write-Host "`n📄 Konfiguration:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=$redactedUrl" -ForegroundColor Gray
Write-Host "NEXTAUTH_URL=http://localhost:3000" -ForegroundColor Gray
Write-Host "NEXTAUTH_SECRET=$nextauthSecret`n" -ForegroundColor Gray

Write-Host "🎯 Nächste Schritte:`n" -ForegroundColor Cyan
Write-Host "1. Schema zur Datenbank pushen:" -ForegroundColor White
Write-Host "   npm run db:push`n" -ForegroundColor Gray

Write-Host "2. Dev-Server starten:" -ForegroundColor White
Write-Host "   npm run dev`n" -ForegroundColor Gray

Write-Host "✅ Fertig!`n" -ForegroundColor Green

