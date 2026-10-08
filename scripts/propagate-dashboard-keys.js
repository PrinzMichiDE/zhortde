/* eslint-disable @typescript-eslint/no-require-imports */
// Propagates keys missing from each locale's `dashboard` namespace using
// English as the source of truth (kept in sync with add-dashboard-all-langs.js).
const fs = require('fs');
const path = require('path');

const enData = JSON.parse(fs.readFileSync(path.join(__dirname, '../i18n/messages/en.json'), 'utf8'));
const enDashboard = enData.dashboard;

const languages = ['de', 'zh', 'ar', 'bn', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'pt', 'ru', 'tr', 'vi'];

for (const lang of languages) {
  const filePath = path.join(__dirname, `../i18n/messages/${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const dashboard = data.dashboard || {};
  let changed = false;

  for (const [key, value] of Object.entries(enDashboard)) {
    if (!(key in dashboard)) {
      dashboard[key] = value;
      changed = true;
    }
  }

  if (changed) {
    data.dashboard = dashboard;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
}

console.log('Dashboard keys propagated.');