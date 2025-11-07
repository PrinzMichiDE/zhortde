# 🔌 Zhort API Documentation v1.0

## Authentication

All API requests require an API key in the `Authorization` header:

```
Authorization: Bearer zhort_xxxxxxxxxxxxxxxxxxxxx
```

**Get your API key**: `/dashboard/api-keys`

---

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

---

## Endpoints

### 1. Create Link

**POST** `/api/v1/links`

Create a new short link.

#### Request

```bash
curl -X POST https://your-domain.com/api/v1/links \
  -H "Authorization: Bearer zhort_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "customCode": "mylink",
    "password": "secret123",
    "expiresIn": "7d",
    "isPublic": true
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `longUrl` | string | ✅ | The destination URL |
| `customCode` | string | ❌ | Custom short code (3-50 chars, lowercase, numbers, hyphens, underscores) |
| `password` | string | ❌ | Password protection |
| `expiresIn` | string | ❌ | Expiration time: `1h`, `24h`, `7d`, `30d` |
| `isPublic` | boolean | ❌ | Public visibility (default: true) |

#### Response (201 Created)

```json
{
  "id": 123,
  "shortUrl": "https://your-domain.com/s/abc123",
  "longUrl": "https://example.com",
  "shortCode": "abc123",
  "hasPassword": true,
  "expiresAt": "2025-11-14T12:00:00.000Z",
  "createdAt": "2025-11-07T12:00:00.000Z"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid or missing longUrl"
}
```

**409 Conflict**
```json
{
  "error": "Custom code already in use"
}
```

---

### 2. List Links

**GET** `/api/v1/links`

Get all links for the authenticated user.

#### Request

```bash
curl https://your-domain.com/api/v1/links \
  -H "Authorization: Bearer zhort_xxxxx"
```

#### Response (200 OK)

```json
[
  {
    "id": 123,
    "shortUrl": "https://your-domain.com/s/abc123",
    "longUrl": "https://example.com",
    "shortCode": "abc123",
    "hits": 42,
    "isPublic": true,
    "hasPassword": true,
    "expiresAt": "2025-11-14T12:00:00.000Z",
    "createdAt": "2025-11-07T12:00:00.000Z"
  },
  {
    "id": 124,
    "shortUrl": "https://your-domain.com/s/xyz789",
    "longUrl": "https://github.com",
    "shortCode": "xyz789",
    "hits": 15,
    "isPublic": true,
    "hasPassword": false,
    "expiresAt": null,
    "createdAt": "2025-11-06T10:00:00.000Z"
  }
]
```

---

### 3. Get Analytics

**GET** `/api/analytics/[linkId]`

Get detailed analytics for a specific link.

#### Request

```bash
curl https://your-domain.com/api/analytics/123 \
  -H "Cookie: next-auth.session-token=xxxxx"
```

> **Note**: This endpoint requires session authentication, not API key.

#### Response (200 OK)

```json
{
  "link": {
    "id": 123,
    "shortCode": "abc123",
    "longUrl": "https://example.com",
    "createdAt": "2025-11-07T12:00:00.000Z"
  },
  "analytics": {
    "totalClicks": 150,
    "uniqueIps": 87,
    "deviceBreakdown": {
      "mobile": 80,
      "desktop": 60,
      "tablet": 10
    },
    "countryBreakdown": {
      "US": 50,
      "DE": 30,
      "GB": 20,
      "FR": 15
    },
    "browserBreakdown": {
      "Chrome": 90,
      "Firefox": 30,
      "Safari": 20,
      "Edge": 10
    },
    "recentClicks": [
      {
        "id": 1001,
        "ipAddress": "192.168.1.1",
        "country": "US",
        "deviceType": "mobile",
        "browser": "Chrome",
        "clickedAt": "2025-11-07T15:30:00.000Z"
      }
    ]
  }
}
```

---

## Rate Limits

| User Type | Limit |
|-----------|-------|
| Anonymous | 10 requests/hour |
| Authenticated | 100 requests/hour |

**Rate limit headers** (included in response):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699368000
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (invalid/missing API key) |
| 403 | Forbidden (no access to resource) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Webhooks

### Subscribing to Events

Create webhooks at `/dashboard/webhooks` to receive real-time notifications.

### Available Events

- `link.created` - When a new link is created
- `link.clicked` - When a link is accessed
- `link.expired` - When a link expires
- `paste.created` - When a new paste is created

### Webhook Payload

```json
{
  "event": "link.created",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "data": {
    "linkId": 123,
    "shortCode": "abc123",
    "longUrl": "https://example.com"
  }
}
```

### Webhook Headers

```
Content-Type: application/json
X-Zhort-Signature: <hmac-sha256-hex>
X-Zhort-Event: link.created
User-Agent: Zhort-Webhooks/1.0
```

### Verifying Webhook Signatures

**Node.js Example**:
```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-zhort-signature'];
  const payload = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Usage in Express
app.post('/webhook', (req, res) => {
  if (!verifyWebhook(req, 'your_webhook_secret')) {
    return res.status(401).send('Invalid signature');
  }
  
  console.log('Webhook received:', req.body);
  res.send('OK');
});
```

**Python Example**:
```python
import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# Usage in Flask
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Zhort-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook(payload, signature, 'your_webhook_secret'):
        return 'Invalid signature', 401
    
    data = json.loads(payload)
    print('Webhook received:', data)
    return 'OK'
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const ZHORT_API_KEY = 'zhort_xxxxxxxxxxxxxxxxxxxxx';
const ZHORT_API_URL = 'https://your-domain.com/api/v1';

async function createShortLink(longUrl, options = {}) {
  const response = await fetch(`${ZHORT_API_URL}/links`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHORT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      longUrl,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

async function getLinks() {
  const response = await fetch(`${ZHORT_API_URL}/links`, {
    headers: {
      'Authorization': `Bearer ${ZHORT_API_KEY}`,
    },
  });

  return response.json();
}

// Usage
const link = await createShortLink('https://example.com', {
  customCode: 'mylink',
  expiresIn: '7d',
});

console.log('Short URL:', link.shortUrl);

const allLinks = await getLinks();
console.log('Total links:', allLinks.length);
```

### Python

```python
import requests

ZHORT_API_KEY = 'zhort_xxxxxxxxxxxxxxxxxxxxx'
ZHORT_API_URL = 'https://your-domain.com/api/v1'

def create_short_link(long_url, **options):
    response = requests.post(
        f'{ZHORT_API_URL}/links',
        headers={
            'Authorization': f'Bearer {ZHORT_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'longUrl': long_url,
            **options,
        }
    )
    response.raise_for_status()
    return response.json()

def get_links():
    response = requests.get(
        f'{ZHORT_API_URL}/links',
        headers={
            'Authorization': f'Bearer {ZHORT_API_KEY}',
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
link = create_short_link(
    'https://example.com',
    customCode='mylink',
    expiresIn='7d'
)

print('Short URL:', link['shortUrl'])

all_links = get_links()
print('Total links:', len(all_links))
```

### PHP

```php
<?php

define('ZHORT_API_KEY', 'zhort_xxxxxxxxxxxxxxxxxxxxx');
define('ZHORT_API_URL', 'https://your-domain.com/api/v1');

function createShortLink($longUrl, $options = []) {
    $data = array_merge(['longUrl' => $longUrl], $options);
    
    $ch = curl_init(ZHORT_API_URL . '/links');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . ZHORT_API_KEY,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

function getLinks() {
    $ch = curl_init(ZHORT_API_URL . '/links');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . ZHORT_API_KEY,
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$link = createShortLink('https://example.com', [
    'customCode' => 'mylink',
    'expiresIn' => '7d',
]);

echo 'Short URL: ' . $link['shortUrl'] . "\n";

$allLinks = getLinks();
echo 'Total links: ' . count($allLinks) . "\n";
```

---

## Best Practices

### Security
1. **Never expose API keys** in client-side code
2. Use environment variables: `process.env.ZHORT_API_KEY`
3. Rotate keys periodically
4. Use HTTPS only in production
5. Verify webhook signatures

### Performance
1. Cache API responses when appropriate
2. Use bulk operations when creating multiple links
3. Implement retry logic with exponential backoff
4. Monitor rate limits

### Error Handling
```javascript
async function createLinkSafe(longUrl) {
  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ longUrl }),
    });

    if (response.status === 429) {
      const reset = response.headers.get('X-RateLimit-Reset');
      throw new Error(`Rate limited. Reset at ${new Date(reset * 1000)}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unknown error');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create link:', error.message);
    // Implement retry or fallback logic
  }
}
```

---

## Support

- **Documentation**: `/docs` (web interface)
- **API Status**: Check response headers for rate limits
- **Issues**: GitHub Issues (if applicable)

---

**API Version**: 1.0  
**Last Updated**: November 7, 2025  
**Status**: ✅ Production Ready

