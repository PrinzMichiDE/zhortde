# Zhort v2.0 Database Migration Script
# Führt die Migration von v1 zu v2 durch

Write-Host "🚀 Zhort v2.0 Database Migration" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob .env.local existiert
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local nicht gefunden!" -ForegroundColor Red
    Write-Host "Bitte erstellen Sie zuerst die .env.local Datei." -ForegroundColor Yellow
    exit 1
}

# Lade DATABASE_URL aus .env.local
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match 'DATABASE_URL\s*=\s*"?([^"\r\n]+)"?') {
    $DATABASE_URL = $matches[1]
} elseif ($envContent -match 'POSTGRES_URL\s*=\s*"?([^"\r\n]+)"?') {
    $DATABASE_URL = $matches[1]
} else {
    Write-Host "❌ DATABASE_URL nicht in .env.local gefunden!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Datenbank gefunden" -ForegroundColor Green
Write-Host ""

# Prüfe ob psql verfügbar ist
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlAvailable) {
    Write-Host "⚠️  PostgreSQL (psql) nicht im PATH gefunden" -ForegroundColor Yellow
    Write-Host "Verwende stattdessen Drizzle Push..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verwende npm run db:push
    Write-Host "📦 Pushing Schema mit Drizzle..." -ForegroundColor Cyan
    npm run db:push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration erfolgreich!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration fehlgeschlagen!" -ForegroundColor Red
        exit 1
    }
} else {
    # Verwende SQL-Script
    Write-Host "📝 Führe Migration aus..." -ForegroundColor Cyan
    
    $migrationScript = "scripts/add-new-features.sql"
    
    if (-not (Test-Path $migrationScript)) {
        Write-Host "❌ $migrationScript nicht gefunden!" -ForegroundColor Red
        exit 1
    }
    
    # Führe Migration aus
    $env:PGPASSWORD = ""
    psql $DATABASE_URL -f $migrationScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration erfolgreich!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration fehlgeschlagen!" -ForegroundColor Red
        Write-Host "Versuche es mit 'npm run db:push'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Zhort v2.0 ist bereit!" -ForegroundColor Green
Write-Host ""
Write-Host "Neue Features:" -ForegroundColor Cyan
Write-Host "  ✓ Rate Limiting (Spam-Schutz)" -ForegroundColor White
Write-Host "  ✓ Link-Ablaufdatum (1h, 24h, 7d, 30d)" -ForegroundColor White
Write-Host "  ✓ Passwortschutz für Links" -ForegroundColor White
Write-Host "  ✓ QR-Code Generation" -ForegroundColor White
Write-Host ""
Write-Host "Starte den Dev-Server mit:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

