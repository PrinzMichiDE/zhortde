/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Load English as source
const enPath = path.join(__dirname, '../i18n/messages/en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Get the new namespaces from English
const newNamespaces = ['analytics', 'apiKeys', 'webhooks', 'teams', 'bulk', 'integrations', 'sso', 'schedule', 'history', 'masking', 'redirects'];

// Languages to update (excluding en, de, zh which are already done)
const languages = ['es', 'fr', 'hi', 'ar', 'bn', 'pt', 'ru', 'ja', 'ko', 'vi', 'tr', 'it'];

// Simple translations map for dashboard key values
const dashboardTranslations = {
  es: {
    welcomeBack: "Bienvenido de nuevo,",
    myPastes: "Mis Pastes",
    link: "Enlace",
    paste: "Paste",
    pastes: "Pastes",
    noLinks: "Aún no has creado ningún enlace.",
    noPastes: "Aún no has creado ningún paste.",
    createFirstLink: "Crea tu primer enlace",
    createFirstPaste: "Crea tu primer paste",
    shortCode: "Código Corto",
    targetUrl: "URL de Destino",
    clicks: "Clics",
    status: "Estado",
    actions: "Acciones",
    public: "Público",
    private: "Privado",
    view: "Ver",
    deleteConfirm: "¿Realmente quieres eliminar este enlace?",
    deleteError: "Error al eliminar el enlace",
    deletePasteConfirm: "¿Realmente quieres eliminar este paste?",
    deletePasteError: "Error al eliminar el paste",
    slug: "Slug",
    preview: "Vista previa",
    language: "Idioma",
    rawView: "Ver raw",
    editPaste: "Editar paste",
    content: "Contenido",
    syntaxLanguage: "Idioma (Resaltado de sintaxis)",
    publicVisible: "Visible públicamente",
    saveChanges: "Guardar",
    bulkShorten: "Acortar en lote",
    bulkDescription: "Acorta muchos enlaces a la vez",
    apiKeysDescription: "Gestionar claves de acceso",
    webhooksDescription: "Notificaciones de eventos",
    teamsDescription: "Trabajo en equipo",
    integrationsDescription: "Conectar agentes AI",
    integrations: "Integraciones (MCP)",
    backToDashboard: "Volver al Dashboard",
    backToOverview: "Volver a la vista general"
  },
  fr: {
    welcomeBack: "Bienvenue,",
    myPastes: "Mes Pastes",
    link: "Lien",
    paste: "Paste",
    pastes: "Pastes",
    noLinks: "Vous n'avez pas encore créé de liens.",
    noPastes: "Vous n'avez pas encore créé de pastes.",
    createFirstLink: "Créez votre premier lien",
    createFirstPaste: "Créez votre premier paste",
    shortCode: "Code Court",
    targetUrl: "URL de Destination",
    clicks: "Clics",
    status: "Statut",
    actions: "Actions",
    public: "Public",
    private: "Privé",
    view: "Voir",
    deleteConfirm: "Voulez-vous vraiment supprimer ce lien ?",
    deleteError: "Erreur lors de la suppression du lien",
    deletePasteConfirm: "Voulez-vous vraiment supprimer ce paste ?",
    deletePasteError: "Erreur lors de la suppression du paste",
    slug: "Slug",
    preview: "Aperçu",
    language: "Langue",
    rawView: "Voir brut",
    editPaste: "Modifier paste",
    content: "Contenu",
    syntaxLanguage: "Langue (Coloration syntaxique)",
    publicVisible: "Visible publiquement",
    saveChanges: "Enregistrer",
    bulkShorten: "Raccourcir en lot",
    bulkDescription: "Raccourcir plusieurs liens à la fois",
    apiKeysDescription: "Gérer les clés d'accès",
    webhooksDescription: "Notifications d'événements",
    teamsDescription: "Travail d'équipe",
    integrationsDescription: "Connecter des agents AI",
    integrations: "Intégrations (MCP)",
    backToDashboard: "Retour au Dashboard",
    backToOverview: "Retour à la vue d'ensemble"
  }
};

languages.forEach(lang => {
  const filePath = path.join(__dirname, `../i18n/messages/${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Update dashboard with additional keys
  if (dashboardTranslations[lang]) {
    data.dashboard = { ...data.dashboard, ...dashboardTranslations[lang] };
  } else {
    // For languages without specific translations, use English as fallback
    data.dashboard = { ...data.dashboard, ...enData.dashboard };
  }
  
  // Add missing namespaces from English (as fallback)
  newNamespaces.forEach(ns => {
    if (!data[ns]) {
      data[ns] = enData[ns];
    }
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
});

console.log('All language files updated!');
