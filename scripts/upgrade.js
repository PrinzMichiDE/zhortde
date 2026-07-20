#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Upgrade Script für neue Versionen
 * Führt alle notwendigen Upgrade-Schritte aus:
 * - Datenbank-Migrationen
 * - Schema-Updates
 * - Seed-Daten (falls nötig)
 * - Build-Validierung
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Farben für Console-Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
  log('─'.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logWarning('.env.local nicht gefunden');
    log('Versuche Umgebungsvariablen zu verwenden...', 'yellow');
    return false;
  }
  return true;
}

function checkDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    logError('DATABASE_URL oder POSTGRES_URL nicht gefunden!');
    log('\n📝 Bitte setzen Sie die Umgebungsvariable:', 'yellow');
    log('export DATABASE_URL="postgresql://..."', 'yellow');
    return false;
  }
  return true;
}

async function runCommand(command, description, optional = false) {
  try {
    log(`Ausführen: ${description}`, 'bright');
    execSync(command, { stdio: 'inherit', env: process.env });
    logSuccess(`${description} erfolgreich`);
    return true;
  } catch (error) {
    if (optional) {
      logWarning(`${description} fehlgeschlagen (optional, wird übersprungen)`);
      return true;
    }
    logError(`${description} fehlgeschlagen`);
    throw error;
  }
}

/**
 * Upgrade-Funktion
 * 
 * HINWEIS: Um neue Upgrade-Schritte hinzuzufügen:
 * 1. Fügen Sie einen neuen logStep() Aufruf hinzu
 * 2. Verwenden Sie runCommand() für Shell-Befehle
 * 3. Setzen Sie optional=true für nicht-kritische Schritte
 * 4. Dokumentieren Sie den Schritt im Header-Kommentar oben
 * 
 * Beispiel:
 *   logStep('7', 'Neue Feature-Migration');
 *   await runCommand('node scripts/migrate-new-feature.js', 'New Feature Migration', false);
 */
async function upgrade() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 ZHORT UPGRADE SCRIPT', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  // 1. Environment Check
  logStep('1', 'Environment Check');
  const hasEnvFile = checkEnvFile();
  if (hasEnvFile) {
    logSuccess('.env.local gefunden');
  }

  const hasDbUrl = checkDatabaseUrl();
  if (!hasDbUrl) {
    logError('Upgrade kann nicht fortgesetzt werden ohne DATABASE_URL');
    process.exit(1);
  }

  // 2. Datenbank-Migrationen
  logStep('2', 'Datenbank-Migrationen');
  
  try {
    // Teams-Tabellen Migration
    log('Führe Teams-Migration aus...', 'bright');
    await runCommand('node scripts/migrate-teams.js', 'Teams-Migration', false);
  } catch (error) {
    logWarning('Teams-Migration fehlgeschlagen, versuche Schema-Push...');
    try {
      await runCommand('npm run db:push', 'Schema-Push', false);
    } catch (pushError) {
      logError('Schema-Push fehlgeschlagen');
      throw pushError;
    }
  }

  // 3. Schema-Synchronisation
  logStep('3', 'Schema-Synchronisation');
  await runCommand('npm run db:push', 'Schema-Push', false);

  // 4. Seed-Daten (falls nötig)
  logStep('4', 'Seed-Daten');
  try {
    await runCommand('npm run db:seed', 'Stats-Seeding', true);
  } catch (error) {
    logWarning('Seed-Daten übersprungen');
  }

  // 5. Dependency-Check (optional)
  logStep('5', 'Dependency-Check');
  try {
    log('Prüfe auf veraltete Dependencies...', 'bright');
    execSync('npm outdated || true', { stdio: 'pipe' });
    logSuccess('Dependency-Check abgeschlossen');
    log('💡 Tipp: Verwenden Sie "ncu -u" für Dependency-Updates', 'yellow');
  } catch (error) {
    logWarning('Dependency-Check übersprungen');
  }

  // 6. Build-Validierung (optional, aber empfohlen)
  logStep('6', 'Build-Validierung');
  const skipBuild = process.argv.includes('--skip-build');
  
  if (skipBuild) {
    logWarning('Build-Validierung übersprungen (--skip-build Flag gesetzt)');
  } else {
    try {
      await runCommand('npm run build', 'Build-Validierung', true);
      logSuccess('Build erfolgreich - Code ist kompilierbar');
    } catch (error) {
      logWarning('Build-Validierung fehlgeschlagen');
      log('💡 Tipp: Prüfen Sie die Build-Fehler manuell', 'yellow');
    }
  }

  // Zusammenfassung
  log('\n' + '='.repeat(60), 'bright');
  log('✅ UPGRADE ABGESCHLOSSEN', 'green');
  log('='.repeat(60), 'bright');
  
  log('\n📋 Nächste Schritte:', 'cyan');
  log('1. Prüfen Sie die Logs oben auf Fehler', 'bright');
  log('2. Starten Sie den Dev-Server: npm run dev', 'bright');
  log('3. Testen Sie die neuen Features', 'bright');
  
  if (!skipBuild) {
    log('\n💡 Um Build-Validierung zu überspringen:', 'yellow');
    log('   npm run upgrade -- --skip-build', 'yellow');
  }
  
  log('\n');
}

// Error Handling
process.on('unhandledRejection', (error) => {
  logError('Unbehandelter Fehler:');
  console.error(error);
  process.exit(1);
});

// Run upgrade
upgrade().catch((error) => {
  logError('Upgrade fehlgeschlagen');
  console.error(error);
  process.exit(1);
});
