#!/usr/bin/env node

/**
 * Quick Fix für .env.local
 * Setzt automatisch Docker PostgreSQL URL
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('\n⚡ Quick Fix: .env.local\n');

// Default Docker PostgreSQL URL
const databaseUrl = 'postgresql://postgres:zhort123@localhost:5432/zhort';

// Generate NEXTAUTH_SECRET
const nextauthSecret = require('crypto').randomBytes(32).toString('base64');

const envContent = `# PostgreSQL Database Connection (Docker)
DATABASE_URL=${databaseUrl}

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextauthSecret}
`;

try {
  // Backup existing file
  if (fs.existsSync(envPath)) {
    const backup = envPath + '.backup-' + Date.now();
    fs.copyFileSync(envPath, backup);
    console.log(`✓ Backup erstellt: ${path.basename(backup)}`);
  }

  // Write new file
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('✓ .env.local erstellt/aktualisiert\n');
  console.log('📄 Konfiguration:\n');
  console.log(`DATABASE_URL=${databaseUrl}`);
  console.log(`NEXTAUTH_URL=http://localhost:3000`);
  console.log(`NEXTAUTH_SECRET=${nextauthSecret}\n`);

  console.log('🐳 Starten Sie PostgreSQL mit Docker:\n');
  console.log('docker run -d \\');
  console.log('  --name zhort-postgres \\');
  console.log('  -e POSTGRES_PASSWORD=zhort123 \\');
  console.log('  -e POSTGRES_DB=zhort \\');
  console.log('  -p 5432:5432 \\');
  console.log('  postgres:15-alpine\n');

  console.log('📊 Erstellen Sie die Datenbank-Tabellen:\n');
  console.log('npm run db:push\n');

  console.log('🚀 Starten Sie den Dev-Server:\n');
  console.log('npm run dev\n');

  console.log('✅ Fertig!\n');
} catch (error) {
  console.error('❌ Fehler:', error.message);
  process.exit(1);
}

