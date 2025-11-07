/**
 * UTM Builder Utility
 * 
 * Helps construct URLs with UTM parameters for marketing campaigns.
 */

export type UtmParameters = {
  source?: string;      // utm_source: Identifies which site sent the traffic (e.g., google, newsletter)
  medium?: string;      // utm_medium: Identifies what type of link was used (e.g., cpc, email, social)
  campaign?: string;    // utm_campaign: Identifies a specific product promotion or campaign (e.g., spring_sale)
  term?: string;        // utm_term: Identifies paid search keywords
  content?: string;     // utm_content: Identifies what specifically was clicked (e.g., logo_link, text_link)
};

/**
 * Build a URL with UTM parameters
 */
export function buildUtmUrl(baseUrl: string, params: UtmParameters): string {
  try {
    const url = new URL(baseUrl);
    
    if (params.source) url.searchParams.set('utm_source', params.source);
    if (params.medium) url.searchParams.set('utm_medium', params.medium);
    if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
    if (params.term) url.searchParams.set('utm_term', params.term);
    if (params.content) url.searchParams.set('utm_content', params.content);
    
    return url.toString();
  } catch (error) {
    console.error('Error building UTM URL:', error);
    return baseUrl;
  }
}

/**
 * Parse UTM parameters from a URL
 */
export function parseUtmUrl(url: string): UtmParameters {
  try {
    const urlObj = new URL(url);
    return {
      source: urlObj.searchParams.get('utm_source') || undefined,
      medium: urlObj.searchParams.get('utm_medium') || undefined,
      campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      term: urlObj.searchParams.get('utm_term') || undefined,
      content: urlObj.searchParams.get('utm_content') || undefined,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Validate UTM parameters
 */
export function validateUtmParameters(params: UtmParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // UTM Source and Medium are recommended
  if (!params.source && !params.medium && !params.campaign) {
    errors.push('At least one UTM parameter is recommended');
  }
  
  // Check for invalid characters (spaces, special chars)
  const invalidCharsRegex = /[^a-zA-Z0-9._\-]/;
  
  if (params.source && invalidCharsRegex.test(params.source)) {
    errors.push('utm_source contains invalid characters (use only letters, numbers, dots, dashes, underscores)');
  }
  
  if (params.medium && invalidCharsRegex.test(params.medium)) {
    errors.push('utm_medium contains invalid characters');
  }
  
  if (params.campaign && invalidCharsRegex.test(params.campaign)) {
    errors.push('utm_campaign contains invalid characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * UTM Templates for common use cases
 */
export const UTM_TEMPLATES = {
  email: {
    name: 'Email Campaign',
    description: 'Track email newsletter clicks',
    params: {
      source: 'newsletter',
      medium: 'email',
      campaign: 'monthly_newsletter',
    },
  },
  social_facebook: {
    name: 'Facebook Post',
    description: 'Track Facebook social media posts',
    params: {
      source: 'facebook',
      medium: 'social',
      campaign: 'product_launch',
    },
  },
  social_twitter: {
    name: 'Twitter/X Post',
    description: 'Track Twitter/X posts',
    params: {
      source: 'twitter',
      medium: 'social',
      campaign: 'announcement',
    },
  },
  social_instagram: {
    name: 'Instagram',
    description: 'Track Instagram bio link or story',
    params: {
      source: 'instagram',
      medium: 'social',
      campaign: 'bio_link',
    },
  },
  social_linkedin: {
    name: 'LinkedIn',
    description: 'Track LinkedIn posts',
    params: {
      source: 'linkedin',
      medium: 'social',
      campaign: 'company_update',
    },
  },
  paid_google: {
    name: 'Google Ads',
    description: 'Track Google Ads campaigns',
    params: {
      source: 'google',
      medium: 'cpc',
      campaign: 'brand_keywords',
    },
  },
  paid_facebook: {
    name: 'Facebook Ads',
    description: 'Track Facebook advertising',
    params: {
      source: 'facebook',
      medium: 'cpc',
      campaign: 'conversion_campaign',
    },
  },
  referral: {
    name: 'Referral Program',
    description: 'Track referral links',
    params: {
      source: 'referral',
      medium: 'partner',
      campaign: 'affiliate_program',
    },
  },
  qr_code: {
    name: 'QR Code',
    description: 'Track QR code scans',
    params: {
      source: 'qr_code',
      medium: 'offline',
      campaign: 'poster_campaign',
    },
  },
  blog: {
    name: 'Blog Post',
    description: 'Track blog internal links',
    params: {
      source: 'blog',
      medium: 'content',
      campaign: 'tutorial_series',
    },
  },
};

/**
 * Common UTM Medium values
 */
export const UTM_MEDIUMS = [
  { value: 'cpc', label: 'CPC (Cost Per Click)', description: 'Paid search ads' },
  { value: 'email', label: 'Email', description: 'Email campaigns' },
  { value: 'social', label: 'Social', description: 'Social media posts' },
  { value: 'organic', label: 'Organic', description: 'Organic search' },
  { value: 'referral', label: 'Referral', description: 'Referral links' },
  { value: 'display', label: 'Display', description: 'Display ads' },
  { value: 'affiliate', label: 'Affiliate', description: 'Affiliate marketing' },
  { value: 'video', label: 'Video', description: 'Video ads' },
  { value: 'banner', label: 'Banner', description: 'Banner ads' },
  { value: 'content', label: 'Content', description: 'Content marketing' },
  { value: 'offline', label: 'Offline', description: 'Offline campaigns (QR codes, print)' },
];

/**
 * Common UTM Source values
 */
export const UTM_SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'blog', label: 'Blog' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'qr_code', label: 'QR Code' },
];

