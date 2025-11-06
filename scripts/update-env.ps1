# Simple script to update .env.local with Vercel Postgres URL
# Usage: .\scripts\update-env.ps1

$envPath = ".env.local"
$postgresUrl = "postgres://db97bd629a9c5134383724b677132795cff1e940d5580b2ec4124335fead7cd8:sk_7tdAyzsPIARqtpGQ66eL2@db.prisma.io:5432/postgres?sslmode=require"

Write-Host ""
Write-Host "Updating .env.local..." -ForegroundColor Cyan
Write-Host ""

# Backup existing file
if (Test-Path $envPath) {
    $backup = "$envPath.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item $envPath $backup
    Write-Host "Backup created: $backup" -ForegroundColor Green
}

# Generate secret
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

# Create content
$content = @"
# PostgreSQL Database Connection (Vercel Postgres)
DATABASE_URL="$postgresUrl"
POSTGRES_URL="$postgresUrl"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$secret
"@

# Write file (UTF8 without BOM)
$envFullPath = Join-Path (Get-Location) $envPath
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($envFullPath, $content, $utf8NoBom)

Write-Host ".env.local updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. npm run db:push" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White
Write-Host ""

