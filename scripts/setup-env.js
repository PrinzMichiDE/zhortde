#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Setup Script für .env.local
 * Hilft bei der Konfiguration der Environment-Variablen
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log('\n🔧 Zhort Environment Setup\n');
console.log('Dieser Assistent hilft Ihnen, die .env.local Datei zu konfigurieren.\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    // Check if .env.local exists
    let existingEnv = {};
    if (fs.existsSync(envPath)) {
      console.log('✓ .env.local gefunden\n');
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Parse existing values
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          existingEnv[match[1].trim()] = match[2].trim();
        }
      });
    } else {
      console.log('ℹ .env.local nicht gefunden - wird erstellt\n');
    }

    console.log('Wählen Sie eine Option:\n');
    console.log('1. Lokale PostgreSQL (Docker oder lokal installiert)');
    console.log('2. Vercel Postgres verwenden');
    console.log('3. Custom PostgreSQL URL eingeben');
    console.log('4. Nur für Production (kein lokales Dev)');
    console.log('');

    const choice = await question('Ihre Wahl (1-4): ');

    let databaseUrl = '';
    let postgresUrl = '';

    switch (choice.trim()) {
      case '1':
        console.log('\n📦 Docker PostgreSQL Setup');
        console.log('Führen Sie aus:');
        console.log('docker run -d --name zhort-postgres -e POSTGRES_PASSWORD=zhort123 -e POSTGRES_DB=zhort -p 5432:5432 postgres:15-alpine\n');
        
        const useDefault = await question('Standard-URL verwenden? (j/n): ');
        
        if (useDefault.toLowerCase() === 'j' || useDefault.toLowerCase() === 'y') {
          databaseUrl = 'postgresql://postgres:zhort123@localhost:5432/zhort';
        } else {
          const host = await question('Host (localhost): ') || 'localhost';
          const port = await question('Port (5432): ') || '5432';
          const user = await question('User (postgres): ') || 'postgres';
          const password = await question('Password: ');
          const database = await question('Database (zhort): ') || 'zhort';
          
          databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
        }
        break;

      case '2':
        console.log('\n☁️ Vercel Postgres');
        console.log('Holen Sie die URL aus: Vercel Dashboard → Storage → Ihre DB → .env.local Tab\n');
        
        postgresUrl = await question('POSTGRES_URL eingeben: ');
        databaseUrl = postgresUrl;
        break;

      case '3':
        console.log('\n🔧 Custom PostgreSQL');
        databaseUrl = await question('DATABASE_URL eingeben: ');
        break;

      case '4':
        console.log('\n⚠️ Production-Only Modus');
        console.log('Lokale Entwicklung wird nicht funktionieren!\n');
        databaseUrl = 'postgresql://mock:mock@localhost:5432/mock';
        break;

      default:
        console.log('❌ Ungültige Wahl');
        process.exit(1);
    }

    // NextAuth URL
    console.log('');
    const nextauthUrl = await question(`NEXTAUTH_URL (${existingEnv.NEXTAUTH_URL || 'http://localhost:3000'}): `) 
      || existingEnv.NEXTAUTH_URL 
      || 'http://localhost:3000';

    // NextAuth Secret
    console.log('');
    let nextauthSecret = existingEnv.NEXTAUTH_SECRET;
    if (!nextauthSecret) {
      const generateSecret = await question('NEXTAUTH_SECRET generieren? (j/n): ');
      if (generateSecret.toLowerCase() === 'j' || generateSecret.toLowerCase() === 'y') {
        nextauthSecret = require('crypto').randomBytes(32).toString('base64');
        console.log(`Generiert: ${nextauthSecret}\n`);
      } else {
        nextauthSecret = await question('NEXTAUTH_SECRET eingeben: ');
      }
    }

    // Build .env.local content
    const envContent = `# PostgreSQL Database Connection
DATABASE_URL=${databaseUrl}
${postgresUrl ? `POSTGRES_URL=${postgresUrl}` : ''}

# NextAuth Configuration
NEXTAUTH_URL=${nextauthUrl}
NEXTAUTH_SECRET=${nextauthSecret}

# Optional: Vercel Blob Storage (for file uploads)
${existingEnv.BLOB_READ_WRITE_TOKEN ? `BLOB_READ_WRITE_TOKEN=${existingEnv.BLOB_READ_WRITE_TOKEN}` : '# BLOB_READ_WRITE_TOKEN='}
`;

    // Write file
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    console.log('\n✅ .env.local erfolgreich erstellt!\n');
    console.log('📄 Inhalt:\n');
    console.log(envContent);
    console.log('\n🎯 Nächste Schritte:\n');
    console.log('1. Datenbank-Tabellen erstellen:');
    console.log('   npm run db:push');
    console.log('   ODER via SQL: scripts/create-all-tables.sql\n');
    console.log('2. Dev-Server starten:');
    console.log('   npm run dev\n');
    console.log('3. Testen Sie: http://localhost:3000\n');

    rl.close();
  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n❌ Abgebrochen');
  process.exit(0);
});

setup();

