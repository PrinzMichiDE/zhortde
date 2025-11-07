import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const stats = pgTable('stats', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: integer('value').notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  shortCode: text('short_code').notNull().unique(),
  longUrl: text('long_url').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isPublic: boolean('is_public').notNull().default(true),
  hits: integer('hits').notNull().default(0),
  passwordHash: text('password_hash'), // Optional password protection
  expiresAt: timestamp('expires_at'), // Optional expiration
  
  // 📅 UTM Parameters
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pastes = pgTable('pastes', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  syntaxHighlightingLanguage: text('syntax_highlighting_language'),
  isPublic: boolean('is_public').notNull().default(true),
  passwordHash: text('password_hash'), // Optional password protection
  expiresAt: timestamp('expires_at'), // Optional expiration
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const blockedDomains = pgTable('blocked_domains', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(), // IP address or user ID
  action: text('action').notNull(), // 'create_link', 'create_paste', etc.
  count: integer('count').notNull().default(1),
  windowStart: timestamp('window_start').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 📊 Analytics: Detailed click tracking
export const linkClicks = pgTable('link_clicks', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  
  // Request metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referer: text('referer'),
  
  // Parsed metadata
  country: text('country'),
  city: text('city'),
  deviceType: text('device_type'), // 'mobile', 'tablet', 'desktop'
  browser: text('browser'), // 'chrome', 'firefox', 'safari', etc.
  os: text('os'), // 'windows', 'macos', 'linux', 'ios', 'android'
  
  clickedAt: timestamp('clicked_at').notNull().defaultNow(),
});

// 🎯 Smart Redirects Configuration
export const smartRedirects = pgTable('smart_redirects', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  
  // Redirect rules
  ruleType: text('rule_type').notNull(), // 'device', 'geo', 'time', 'ab_test'
  condition: text('condition').notNull(), // e.g., 'ios', 'android', 'DE', 'US'
  targetUrl: text('target_url').notNull(),
  priority: integer('priority').notNull().default(0), // For rule ordering
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🎭 Link Masking/Cloaking Configuration
export const linkMasking = pgTable('link_masking', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().unique().references(() => links.id, { onDelete: 'cascade' }),
  
  enableFrame: boolean('enable_frame').notNull().default(false),
  enableSplash: boolean('enable_splash').notNull().default(false),
  splashDurationMs: integer('splash_duration_ms').default(3000),
  splashHtml: text('splash_html'), // Custom HTML for splash screen
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🤖 API Keys for programmatic access
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(), // User-friendly name
  keyHash: text('key_hash').notNull().unique(), // Hashed API key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🔔 Webhooks
export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  url: text('url').notNull(),
  secret: text('secret').notNull(), // For HMAC signature verification
  events: text('events').notNull(), // JSON array: ['link.created', 'link.clicked']
  
  isActive: boolean('is_active').notNull().default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;

export type Paste = typeof pastes.$inferSelect;
export type NewPaste = typeof pastes.$inferInsert;

export type BlockedDomain = typeof blockedDomains.$inferSelect;
export type NewBlockedDomain = typeof blockedDomains.$inferInsert;

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;

export type LinkClick = typeof linkClicks.$inferSelect;
export type NewLinkClick = typeof linkClicks.$inferInsert;

export type SmartRedirect = typeof smartRedirects.$inferSelect;
export type NewSmartRedirect = typeof smartRedirects.$inferInsert;

export type LinkMasking = typeof linkMasking.$inferSelect;
export type NewLinkMasking = typeof linkMasking.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

// Relations
export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  linkClicks: many(linkClicks),
  smartRedirects: many(smartRedirects),
  linkMasking: one(linkMasking),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(links, {
    fields: [linkClicks.linkId],
    references: [links.id],
  }),
}));

export const smartRedirectsRelations = relations(smartRedirects, ({ one }) => ({
  link: one(links, {
    fields: [smartRedirects.linkId],
    references: [links.id],
  }),
}));

export const linkMaskingRelations = relations(linkMasking, ({ one }) => ({
  link: one(links, {
    fields: [linkMasking.linkId],
    references: [links.id],
  }),
}));

