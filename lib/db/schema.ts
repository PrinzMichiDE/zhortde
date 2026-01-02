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
  passwordHash: text('password_hash'), // Optional - can be null if using only Passkeys
  role: text('role').notNull().default('user'), // 'user', 'admin'
  ssoLoginToken: text('sso_login_token'),
  ssoLoginExpiresAt: timestamp('sso_login_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🔐 Passkeys (WebAuthn Credentials)
export const passkeys = pgTable('passkeys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // WebAuthn Credential Data
  credentialId: text('credential_id').notNull().unique(), // Base64URL encoded credential ID
  publicKey: text('public_key').notNull(), // Base64URL encoded public key
  counter: integer('counter').notNull().default(0), // Signature counter for replay protection
  
  // Device Information
  deviceName: text('device_name'), // User-friendly name (e.g., "iPhone 15", "Chrome on Windows")
  deviceType: text('device_type'), // 'platform' (TouchID/FaceID) or 'cross-platform' (USB key)
  
  // Metadata
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ✨ User Features: Link Collections (Folders) - Defined BEFORE links to avoid circular reference
export const linkCollections = pgTable('link_collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'), // Hex color for visual organization
  icon: text('icon'), // Emoji or icon name
  isDefault: boolean('is_default').notNull().default(false), // Default collection
  linkCount: integer('link_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  shortCode: text('short_code').notNull().unique(),
  longUrl: text('long_url').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }), // Enterprise: Team-owned links
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
  
  // 🏢 Enterprise Features
  customRedirectPage: text('custom_redirect_page'), // Custom branded redirect page HTML
  isReservedCode: boolean('is_reserved_code').notNull().default(false), // Reserved short code for enterprise
  priority: integer('priority').default(0), // Higher priority for enterprise links
  isArchived: boolean('is_archived').notNull().default(false), // Archived links
  archivedAt: timestamp('archived_at'), // When link was archived
  templateId: integer('template_id'), // Created from template - FK added in relations
  
  // ✨ User Features
  collectionId: integer('collection_id'), // Link collection/folder - FK added in relations
  suggestedShortCode: text('suggested_short_code'), // AI-suggested short code
  healthStatus: text('health_status').default('unknown'), // 'healthy', 'broken', 'redirecting', 'unknown'
  lastHealthCheck: timestamp('last_health_check'), // Last time link was checked
  expirationReminderSent: boolean('expiration_reminder_sent').notNull().default(false), // Reminder sent flag
  previewImage: text('preview_image'), // Auto-generated preview image URL
  smartTags: text('smart_tags'), // JSON array of auto-suggested tags
  
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
  
  // Masking config
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

// 🏷️ Link Tags & Categories
export const linkTags = pgTable('link_tags', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  color: text('color').default('#6366f1'), // Hex color
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🌐 Custom Domains
export const customDomains = pgTable('custom_domains', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull().unique(), // e.g., "links.example.com"
  verified: boolean('verified').notNull().default(false),
  dnsRecords: text('dns_records'), // JSON array of DNS records
  sslEnabled: boolean('ssl_enabled').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 📅 Link Scheduling
export const linkSchedules = pgTable('link_schedules', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  activeFrom: timestamp('active_from'),
  activeUntil: timestamp('active_until'),
  timezone: text('timezone').default('UTC'),
  fallbackUrl: text('fallback_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🧪 A/B Testing Variants
export const linkVariants = pgTable('link_variants', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  variantUrl: text('variant_url').notNull(),
  trafficPercentage: integer('traffic_percentage').notNull().default(50), // 0-100
  conversions: integer('conversions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  isWinner: boolean('is_winner').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 📊 Link Preview/Thumbnail Cache
export const linkPreviews = pgTable('link_previews', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().unique().references(() => links.id, { onDelete: 'cascade' }),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  thumbnailUrl: text('thumbnail_url'),
  siteName: text('site_name'),
  faviconUrl: text('favicon_url'),
  ogData: text('og_data'), // JSON with all Open Graph data
  lastFetched: timestamp('last_fetched').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🎯 Tracking Pixels
export const trackingPixels = pgTable('tracking_pixels', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  pixelType: text('pixel_type').notNull(), // 'facebook', 'google', 'custom'
  pixelId: text('pixel_id').notNull(),
  events: text('events'), // JSON array: ['pageview', 'conversion']
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 👥 Teams & Collaboration
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Enterprise Features
  isEnterprise: boolean('is_enterprise').notNull().default(false),
  customDomain: text('custom_domain'), // White-label domain
  customLogo: text('custom_logo'), // URL to custom logo
  customBranding: text('custom_branding'), // JSON: { primaryColor, secondaryColor, etc. }
  usageQuota: integer('usage_quota'), // Max links/clicks per month (null = unlimited)
  currentUsage: integer('current_usage').notNull().default(0), // Current month usage
  usageResetDate: timestamp('usage_reset_date'), // When to reset usage counter
  ipWhitelist: text('ip_whitelist'), // JSON array of allowed IPs/CIDR blocks
  reservedShortCodes: text('reserved_short_codes'), // JSON array of reserved codes
  slaLevel: text('sla_level').default('standard'), // 'standard', 'premium', 'enterprise'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner', 'admin', 'member', 'viewer'
  permissions: text('permissions'), // JSON object with granular permissions: { canCreateLinks, canEditLinks, canDeleteLinks, canViewAnalytics, canManageTeam, canExportData }
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const teamLinks = pgTable('team_links', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

// 💬 Link Comments & Notes
export const linkComments = pgTable('link_comments', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').notNull().default(true), // Internal note vs public comment
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 📝 Link History/Changelog
export const linkHistory = pgTable('link_history', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'created', 'updated', 'deleted', 'tagged', etc.
  changes: text('changes'), // JSON object with before/after
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🌿 Link-in-Bio Profiles
export const bioProfiles = pgTable('bio_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(), // e.g., "my/koch" -> "koch"
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  theme: text('theme').default('light'), // 'light', 'dark', 'custom'
  customColors: text('custom_colors'), // JSON { bg, text, button, buttonText }
  socialLinks: text('social_links'), // JSON { twitter, instagram, linkedin, etc. }
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Custom Redirect Pages
export const customRedirectPages = pgTable('custom_redirect_pages', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Template name
  htmlContent: text('html_content').notNull(), // Custom HTML for redirect page
  cssContent: text('css_content'), // Custom CSS
  logoUrl: text('logo_url'),
  backgroundColor: text('background_color'),
  textColor: text('text_color'),
  buttonColor: text('button_color'),
  buttonTextColor: text('button_text_color'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Usage Tracking
export const usageTracking = pgTable('usage_tracking', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull(), // 'link', 'click', 'api_call', 'export'
  resourceId: integer('resource_id'), // ID of the resource (link, etc.)
  count: integer('count').notNull().default(1),
  period: text('period').notNull(), // 'daily', 'monthly', 'yearly'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  metadata: text('metadata'), // JSON with additional info
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🏢 Enterprise: IP Whitelist
export const ipWhitelist = pgTable('ip_whitelist', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address').notNull(), // IP or CIDR block (e.g., "192.168.1.1" or "192.168.1.0/24")
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Scheduled Reports
// Note: Reports are generated and stored, but NO emails are sent
export const scheduledReports = pgTable('scheduled_reports', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  reportType: text('report_type').notNull(), // 'analytics', 'usage', 'compliance', 'custom'
  frequency: text('frequency').notNull(), // 'daily', 'weekly', 'monthly'
  recipients: text('recipients'), // JSON array - stored for reference only, NOT used for email sending
  format: text('format').notNull().default('pdf'), // 'pdf', 'csv', 'json', 'html'
  filters: text('filters'), // JSON object with filters
  isActive: boolean('is_active').notNull().default(true),
  lastGeneratedAt: timestamp('last_generated_at'), // Renamed from lastSentAt - no emails sent
  nextGenerateAt: timestamp('next_generate_at'), // Renamed from nextSendAt - no emails sent
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Link Approval Workflows
export const approvalWorkflows = pgTable('approval_workflows', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  approverIds: text('approver_ids'), // JSON array of user IDs who can approve
  autoApproveAfter: integer('auto_approve_after'), // Hours until auto-approval
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const linkApprovals = pgTable('link_approvals', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  workflowId: integer('workflow_id').references(() => approvalWorkflows.id, { onDelete: 'set null' }),
  requestedBy: integer('requested_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'auto_approved'
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
});

// 🏢 Enterprise: Link Templates
export const linkTemplates = pgTable('link_templates', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  longUrl: text('long_url').notNull(),
  shortCodePrefix: text('short_code_prefix'), // Optional prefix for generated codes
  defaultTags: text('default_tags'), // JSON array of default tags
  defaultUtmParams: text('default_utm_params'), // JSON object with default UTM params
  isPublic: boolean('is_public').notNull().default(false), // Can be used by team members
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Advanced Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'link.created', 'link.updated', 'link.deleted', 'team.member.added', etc.
  resourceType: text('resource_type').notNull(), // 'link', 'team', 'user', 'api_key', etc.
  resourceId: integer('resource_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  changes: text('changes'), // JSON object with before/after values
  metadata: text('metadata'), // JSON object with additional context
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Team Activity Feed
export const teamActivityFeed = pgTable('team_activity_feed', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  activityType: text('activity_type').notNull(), // 'link.created', 'link.clicked', 'member.joined', etc.
  title: text('title').notNull(),
  description: text('description'),
  linkId: integer('link_id').references(() => links.id, { onDelete: 'set null' }),
  metadata: text('metadata'), // JSON object
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 🏢 Enterprise: Link Archiving
export const archivedLinks = pgTable('archived_links', {
  id: serial('id').primaryKey(),
  originalLinkId: integer('original_link_id').notNull(), // Reference to original link
  shortCode: text('short_code').notNull(),
  longUrl: text('long_url').notNull(),
  archivedBy: integer('archived_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  archiveReason: text('archive_reason'),
  archivedAt: timestamp('archived_at').notNull().defaultNow(),
  restoreAt: timestamp('restore_at'), // Optional restore date
  isRestored: boolean('is_restored').notNull().default(false),
});


// ✨ User Features: Link Health Checks
export const linkHealthChecks = pgTable('link_health_checks', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'healthy', 'broken', 'redirecting', 'timeout', 'ssl_error'
  statusCode: integer('status_code'), // HTTP status code
  responseTime: integer('response_time'), // Response time in ms
  errorMessage: text('error_message'),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
});

// ✨ User Features: Quick Actions History
export const quickActions = pgTable('quick_actions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  linkId: integer('link_id').references(() => links.id, { onDelete: 'cascade' }),
  actionType: text('action_type').notNull(), // 'copy', 'share', 'qr', 'analytics', 'edit'
  metadata: text('metadata'), // JSON with additional info
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const bioLinks = pgTable('bio_links', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => bioProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  icon: text('icon'), // Emoji or icon name
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  clicks: integer('clicks').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type LinkTag = typeof linkTags.$inferSelect;
export type NewLinkTag = typeof linkTags.$inferInsert;

export type CustomDomain = typeof customDomains.$inferSelect;
export type NewCustomDomain = typeof customDomains.$inferInsert;

export type LinkSchedule = typeof linkSchedules.$inferSelect;
export type NewLinkSchedule = typeof linkSchedules.$inferInsert;

export type LinkVariant = typeof linkVariants.$inferSelect;
export type NewLinkVariant = typeof linkVariants.$inferInsert;

export type LinkPreview = typeof linkPreviews.$inferSelect;
export type NewLinkPreview = typeof linkPreviews.$inferInsert;

export type TrackingPixel = typeof trackingPixels.$inferSelect;
export type NewTrackingPixel = typeof trackingPixels.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type TeamLink = typeof teamLinks.$inferSelect;
export type NewTeamLink = typeof teamLinks.$inferInsert;

export type CustomRedirectPage = typeof customRedirectPages.$inferSelect;
export type NewCustomRedirectPage = typeof customRedirectPages.$inferInsert;

export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;

export type IpWhitelist = typeof ipWhitelist.$inferSelect;
export type NewIpWhitelist = typeof ipWhitelist.$inferInsert;

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;

export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type NewApprovalWorkflow = typeof approvalWorkflows.$inferInsert;

export type LinkApproval = typeof linkApprovals.$inferSelect;
export type NewLinkApproval = typeof linkApprovals.$inferInsert;

export type LinkTemplate = typeof linkTemplates.$inferSelect;
export type NewLinkTemplate = typeof linkTemplates.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type TeamActivity = typeof teamActivityFeed.$inferSelect;
export type NewTeamActivity = typeof teamActivityFeed.$inferInsert;

export type ArchivedLink = typeof archivedLinks.$inferSelect;
export type NewArchivedLink = typeof archivedLinks.$inferInsert;

export type LinkCollection = typeof linkCollections.$inferSelect;
export type NewLinkCollection = typeof linkCollections.$inferInsert;

export type LinkHealthCheck = typeof linkHealthChecks.$inferSelect;
export type NewLinkHealthCheck = typeof linkHealthChecks.$inferInsert;

export type QuickAction = typeof quickActions.$inferSelect;
export type NewQuickAction = typeof quickActions.$inferInsert;

export type LinkComment = typeof linkComments.$inferSelect;
export type NewLinkComment = typeof linkComments.$inferInsert;

export type LinkHistory = typeof linkHistory.$inferSelect;
export type NewLinkHistory = typeof linkHistory.$inferInsert;

export type SharedPassword = typeof sharedPasswords.$inferSelect;
export type NewSharedPassword = typeof sharedPasswords.$inferInsert;

export type P2PFileShare = typeof p2pFileShares.$inferSelect;
export type NewP2PFileShare = typeof p2pFileShares.$inferInsert;

export type BioProfile = typeof bioProfiles.$inferSelect;
export type NewBioProfile = typeof bioProfiles.$inferInsert;

export type BioLink = typeof bioLinks.$inferSelect;
export type NewBioLink = typeof bioLinks.$inferInsert;

// 🔐 End-to-End Encrypted Password Sharing
export const sharedPasswords = pgTable('shared_passwords', {
  id: serial('id').primaryKey(),
  shareId: text('share_id').notNull().unique(), // Public share ID (like short code)
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Encrypted data (client-side encrypted, server never sees plaintext)
  encryptedPassword: text('encrypted_password').notNull(), // Base64 encoded encrypted password
  encryptedMetadata: text('encrypted_metadata'), // Encrypted JSON: { title, username, notes, etc. }
  encryptionKeyHash: text('encryption_key_hash'), // Hash of the encryption key (for verification)
  
  // Access control
  accessKey: text('access_key').notNull(), // Hashed access key (password to decrypt)
  maxAccesses: integer('max_accesses'), // Max number of times password can be accessed
  currentAccesses: integer('current_accesses').notNull().default(0),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),
});

// 📁 P2P File Sharing (No server storage - metadata only)
export const p2pFileShares = pgTable('p2p_file_shares', {
  id: serial('id').primaryKey(),
  shareId: text('share_id').notNull().unique(), // Public share ID
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // File metadata (file never stored on server)
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // Bytes
  fileType: text('file_type'), // MIME type
  fileHash: text('file_hash'), // SHA-256 hash for integrity verification
  
  // P2P Configuration
  webrtcOffer: text('webrtc_offer'), // WebRTC offer (temporary, for signaling)
  webrtcAnswer: text('webrtc_answer'), // WebRTC answer (temporary)
  signalingToken: text('signaling_token').notNull().unique(), // Token for WebRTC signaling
  
  // Access control
  accessKey: text('access_key'), // Optional password protection
  maxAccesses: integer('max_accesses'),
  currentAccesses: integer('current_accesses').notNull().default(0),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  transferCompleted: boolean('transfer_completed').notNull().default(false),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),
});

// 🔑 Enterprise SSO
export const ssoDomains = pgTable('sso_domains', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(), // e.g., "acme.com"
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // Admin who claimed it
  verificationToken: text('verification_token').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  
  // Identity Provider Config
  providerType: text('provider_type').notNull(), // 'oidc', 'azure-ad', 'keycloak'
  clientId: text('client_id'),
  clientSecret: text('client_secret'),
  issuerUrl: text('issuer_url'), // For OIDC/Keycloak discovery
  authorizationUrl: text('authorization_url'),
  tokenUrl: text('token_url'),
  userInfoUrl: text('user_info_url'),
  tenantId: text('tenant_id'), // Specifically for Azure AD
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const ssoDomainAdmins = pgTable('sso_domain_admins', {
  id: serial('id').primaryKey(),
  domainId: integer('domain_id').notNull().references(() => ssoDomains.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type SsoDomain = typeof ssoDomains.$inferSelect;
export type NewSsoDomain = typeof ssoDomains.$inferInsert;
export type SsoDomainAdmin = typeof ssoDomainAdmins.$inferSelect;
export type NewSsoDomainAdmin = typeof ssoDomainAdmins.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  pastes: many(pastes),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
  ssoDomains: many(ssoDomains),
  ssoAdminDomains: many(ssoDomainAdmins),
  sharedPasswords: many(sharedPasswords),
  p2pFileShares: many(p2pFileShares),
  passkeys: many(passkeys),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;

export const ssoDomainsRelations = relations(ssoDomains, ({ one, many }) => ({
  user: one(users, {
    fields: [ssoDomains.userId],
    references: [users.id],
  }),
  admins: many(ssoDomainAdmins),
}));

export const ssoDomainAdminsRelations = relations(ssoDomainAdmins, ({ one }) => ({
  domain: one(ssoDomains, {
    fields: [ssoDomainAdmins.domainId],
    references: [ssoDomains.id],
  }),
  user: one(users, {
    fields: [ssoDomainAdmins.userId],
    references: [users.id],
  }),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  collection: one(linkCollections, {
    fields: [links.collectionId],
    references: [linkCollections.id],
  }),
  linkClicks: many(linkClicks),
  smartRedirects: many(smartRedirects),
  linkMasking: one(linkMasking),
  linkTags: many(linkTags),
  linkSchedules: many(linkSchedules),
  linkVariants: many(linkVariants),
  linkPreview: one(linkPreviews),
  trackingPixels: many(trackingPixels),
  linkComments: many(linkComments),
  linkHistory: many(linkHistory),
  teamLinks: many(teamLinks),
}));

export const bioProfilesRelations = relations(bioProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [bioProfiles.userId],
    references: [users.id],
  }),
  links: many(bioLinks),
}));

export const bioLinksRelations = relations(bioLinks, ({ one }) => ({
  profile: one(bioProfiles, {
    fields: [bioLinks.profileId],
    references: [bioProfiles.id],
  }),
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

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, {
    fields: [linkTags.linkId],
    references: [links.id],
  }),
}));

export const customDomainsRelations = relations(customDomains, ({ one }) => ({
  user: one(users, {
    fields: [customDomains.userId],
    references: [users.id],
  }),
}));

export const linkSchedulesRelations = relations(linkSchedules, ({ one }) => ({
  link: one(links, {
    fields: [linkSchedules.linkId],
    references: [links.id],
  }),
}));

export const linkVariantsRelations = relations(linkVariants, ({ one }) => ({
  link: one(links, {
    fields: [linkVariants.linkId],
    references: [links.id],
  }),
}));

export const linkPreviewsRelations = relations(linkPreviews, ({ one }) => ({
  link: one(links, {
    fields: [linkPreviews.linkId],
    references: [links.id],
  }),
}));

export const trackingPixelsRelations = relations(trackingPixels, ({ one }) => ({
  link: one(links, {
    fields: [trackingPixels.linkId],
    references: [links.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  teamLinks: many(teamLinks),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const teamLinksRelations = relations(teamLinks, ({ one }) => ({
  team: one(teams, {
    fields: [teamLinks.teamId],
    references: [teams.id],
  }),
  link: one(links, {
    fields: [teamLinks.linkId],
    references: [links.id],
  }),
}));

export const linkCommentsRelations = relations(linkComments, ({ one }) => ({
  link: one(links, {
    fields: [linkComments.linkId],
    references: [links.id],
  }),
  user: one(users, {
    fields: [linkComments.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [linkComments.teamId],
    references: [teams.id],
  }),
}));

export const linkHistoryRelations = relations(linkHistory, ({ one }) => ({
  link: one(links, {
    fields: [linkHistory.linkId],
    references: [links.id],
  }),
  user: one(users, {
    fields: [linkHistory.userId],
    references: [users.id],
  }),
}));

export const sharedPasswordsRelations = relations(sharedPasswords, ({ one }) => ({
  user: one(users, {
    fields: [sharedPasswords.userId],
    references: [users.id],
  }),
}));

export const p2pFileSharesRelations = relations(p2pFileShares, ({ one }) => ({
  user: one(users, {
    fields: [p2pFileShares.userId],
    references: [users.id],
  }),
}));

export const linkCollectionsRelations = relations(linkCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [linkCollections.userId],
    references: [users.id],
  }),
  links: many(links),
}));
