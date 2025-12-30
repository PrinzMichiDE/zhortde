/**
 * Google Safe Browsing API Integration
 * https://developers.google.com/safe-browsing/v4/lookup-api
 */

const GOOGLE_SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export async function checkPhishing(url: string): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;

  if (!apiKey) {
    // If no API key is configured, we skip this check (fail open)
    console.warn('Google Safe Browsing API Key is missing. Phishing check skipped.');
    return false;
  }

  try {
    const response = await fetch(`${GOOGLE_SAFE_BROWSING_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: {
          clientId: 'zhort-app',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    });

    if (!response.ok) {
      console.error('Safe Browsing API error:', response.status, await response.text());
      return false;
    }

    const data = await response.json();
    
    // If matches are found, the URL is unsafe
    return !!(data.matches && data.matches.length > 0);

  } catch (error) {
    console.error('Phishing check failed:', error);
    return false; // Fail open to not block legitimate traffic on error
  }
}
