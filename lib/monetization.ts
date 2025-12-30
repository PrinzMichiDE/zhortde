/**
 * Helper functions to automatically monetize URLs
 */

const AMAZON_DOMAINS = [
  'amazon.de',
  'www.amazon.de',
  'amazon.com',
  'www.amazon.com',
  'amazon.co.uk',
  'www.amazon.co.uk',
  'amazon.fr',
  'www.amazon.fr',
  'amazon.it',
  'www.amazon.it',
  'amazon.es',
  'www.amazon.es',
  'amzn.to' // Careful with shortlinks, usually we shouldn't modify them without resolving, but let's stick to full domains for now
];

const AFFILIATE_TAG = 'michelfritzschde-21';

export function monetizeUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    
    // Check if it's an Amazon URL
    if (AMAZON_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) {
      return addAmazonAffiliateTag(url);
    }

    return originalUrl;
  } catch (e) {
    // Invalid URL, return original
    return originalUrl;
  }
}

function addAmazonAffiliateTag(url: URL): string {
  // Set Affiliate Parameters
  url.searchParams.set('tag', AFFILIATE_TAG);
  url.searchParams.set('linkCode', 'll2');
  
  // Set language only for .de if not present
  if (url.hostname.includes('amazon.de') && !url.searchParams.has('language')) {
    url.searchParams.set('language', 'de_DE');
  }

  // Preserve other params, but ensure ref is set if requested (though ref is often tracked internally)
  // The user example had ref_=as_li_ss_tl
  if (!url.searchParams.has('ref_')) {
    url.searchParams.set('ref_', 'as_li_ss_tl');
  }

  // Note: linkId is usually unique per generated link in Amazon's system. 
  // We can't generate a valid Amazon internal linkId. 
  // However, usually just 'tag' is enough for attribution.
  // The user provided a specific linkId in the example, but that might be specific to *that* generated link.
  // Re-using a static linkId might be flagged or ignored. 
  // For safety, we will NOT add a static linkId unless we are sure it's generic.
  // Let's stick to tag, linkCode, language and ref_.

  return url.toString();
}
