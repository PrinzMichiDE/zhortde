import { db } from './db';
import { smartRedirects } from './db/schema';
import { eq } from 'drizzle-orm';
import { parseUserAgent } from './analytics';

export type RedirectRule = {
  ruleType: 'device' | 'geo' | 'time' | 'ab_test';
  condition: string;
  targetUrl: string;
  priority: number;
};

/**
 * Get the appropriate redirect URL based on smart redirect rules
 */
export async function getSmartRedirectUrl(
  linkId: number,
  userAgent: string | null,
  country: string | null
): Promise<string | null> {
  // Fetch all rules for this link, ordered by priority
  const rules = await db
    .select()
    .from(smartRedirects)
    .where(eq(smartRedirects.linkId, linkId))
    .orderBy(smartRedirects.priority);

  if (rules.length === 0) {
    return null; // No smart redirects configured
  }

  // Parse user agent for device detection
  const { deviceType, os } = parseUserAgent(userAgent);

  // Evaluate rules in priority order
  for (const rule of rules) {
    switch (rule.ruleType) {
      case 'device':
        if (
          rule.condition === deviceType ||
          (rule.condition === 'ios' && os.toLowerCase().includes('ios')) ||
          (rule.condition === 'android' && os.toLowerCase().includes('android'))
        ) {
          return rule.targetUrl;
        }
        break;

      case 'geo':
        if (country && country.toLowerCase() === rule.condition.toLowerCase()) {
          return rule.targetUrl;
        }
        break;

      case 'time':
        // Example: "weekday" or "weekend" or "9-17" (business hours)
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();

        if (rule.condition === 'weekday' && day >= 1 && day <= 5) {
          return rule.targetUrl;
        }
        if (rule.condition === 'weekend' && (day === 0 || day === 6)) {
          return rule.targetUrl;
        }
        // Business hours (9-17)
        if (rule.condition.includes('-')) {
          const [start, end] = rule.condition.split('-').map(Number);
          if (hour >= start && hour < end) {
            return rule.targetUrl;
          }
        }
        break;

      case 'ab_test':
        // Simple A/B test: 50/50 split based on random
        if (rule.condition === 'A' && Math.random() < 0.5) {
          return rule.targetUrl;
        }
        if (rule.condition === 'B' && Math.random() >= 0.5) {
          return rule.targetUrl;
        }
        break;
    }
  }

  return null; // No matching rule
}

