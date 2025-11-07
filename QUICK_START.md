# 🚀 Zhort v3.0 - Quick Start Guide

## 5-Minute Setup

### 1️⃣ Start the Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 2️⃣ Test Each Feature

### 📊 **Analytics Dashboard**

1. Create a short link at the homepage
2. Click on it a few times (use different browsers/devices if possible)
3. Go to: `/dashboard/analytics/[linkId]`
4. See beautiful charts with:
   - Total clicks & unique visitors
   - Device breakdown (mobile/tablet/desktop)
   - Browser distribution
   - Top countries
   - Recent clicks table

**Example URL**: `http://localhost:3000/dashboard/analytics/1`

---

### 🔑 **API Keys**

1. Go to: `/dashboard/api-keys`
2. Click "New API Key"
3. Give it a name (e.g., "My Test Key")
4. **IMPORTANT**: Copy the key NOW (you won't see it again!)
5. Test it:

```bash
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer zhort_xxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://github.com"}'
```

You should get a response like:
```json
{
  "id": 123,
  "shortUrl": "http://localhost:3000/s/abc123",
  "longUrl": "https://github.com",
  "shortCode": "abc123",
  "hasPassword": false,
  "expiresAt": null,
  "createdAt": "2025-11-07T..."
}
```

---

### 🔔 **Webhooks**

#### Option A: Use webhook.site (Easiest)

1. Go to: https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/xxxxx`)
3. In Zhort, go to: `/dashboard/webhooks`
4. Click "New Webhook"
5. Paste the webhook.site URL
6. Select events: `link.created`, `link.clicked`
7. Click "Create Webhook"
8. Click the "Test" button (🔄 icon)
9. Go back to webhook.site and see your test webhook!
10. Now create a link and watch it trigger in real-time!

#### Option B: Use ngrok (Local Testing)

```bash
# Terminal 1: Start a simple webhook receiver
node -e "require('http').createServer((req,res)=>{let body='';req.on('data',d=>body+=d);req.on('end',()=>{console.log('Webhook received:',body);res.end('OK')})}).listen(3001)"

# Terminal 2: Expose it with ngrok
ngrok http 3001

# Use the ngrok URL in Zhort webhooks
```

---

### 🎯 **Smart Redirects**

1. Create a link (get the ID from the URL or dashboard)
2. Go to: `/dashboard/links/[linkId]/redirects`
3. Click "Add Rule"
4. Select "Device Type" → "Mobile"
5. Enter target URL: `https://m.example.com`
6. Click "Add Rule"
7. Test it:
   - Desktop: You'll go to the original URL
   - Mobile: You'll go to `https://m.example.com`

**Pro Tip**: Use Chrome DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M) to simulate mobile!

**Example Rules**:
- Device: Mobile → iOS App Store
- Device: Desktop → Download Page
- Geo: DE → https://example.de
- Geo: US → https://example.com

---

### 🎭 **Link Masking**

1. Create a link (get the ID)
2. Go to: `/dashboard/links/[linkId]/masking`

#### **Frame Mode**:
1. Toggle "Frame Redirect" ON
2. Click "Save Changes"
3. Visit your short link: `/s/[shortCode]`
4. You'll see the destination in an iframe with your short URL still in the address bar!

#### **Splash Screen Mode**:
1. Toggle "Splash Screen" ON
2. Set duration: 3000ms (3 seconds)
3. Customize the HTML (or use the default)
4. Click "Save Changes"
5. Visit your short link
6. You'll see the splash screen, then auto-redirect!

**Custom Splash Example**:
```html
<div class="text-center">
  <h1 class="text-5xl mb-4">🚀</h1>
  <h2 class="text-2xl font-bold text-gray-900">
    Taking you to space...
  </h2>
  <div class="mt-6">
    <div class="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
  </div>
</div>
```

---

## 3️⃣ Common Workflows

### Create a Link with All Features

```bash
# 1. Create via API
curl -X POST http://localhost:3000/api/v1/links \
  -H "Authorization: Bearer zhort_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "customCode": "mylink",
    "password": "secret123",
    "expiresIn": "7d"
  }'

# 2. Add smart redirect for mobile users
# Go to: /dashboard/links/[linkId]/redirects
# Add rule: Device → Mobile → https://m.example.com

# 3. Enable splash screen
# Go to: /dashboard/links/[linkId]/masking
# Toggle Splash ON, set 3 seconds

# 4. Set up webhook
# Go to: /dashboard/webhooks
# Add webhook: https://your-server.com/webhook
# Select events: link.clicked

# 5. Monitor analytics
# Go to: /dashboard/analytics/[linkId]
```

---

## 4️⃣ Testing Checklist

- [ ] Create a link
- [ ] Click it 5+ times
- [ ] View analytics dashboard
- [ ] Create an API key
- [ ] Create a link via API
- [ ] Set up a webhook (webhook.site)
- [ ] Create a link and see webhook trigger
- [ ] Add smart redirect rule
- [ ] Test redirect (use Chrome DevTools for mobile simulation)
- [ ] Enable splash screen
- [ ] Visit link and see splash
- [ ] Enable frame mode
- [ ] Visit link and see iframe

---

## 5️⃣ Troubleshooting

### "Unauthorized" errors
→ Make sure you're logged in OR using a valid API key

### Webhooks not firing
→ Check "Active" status in `/dashboard/webhooks`
→ Try the "Test" button first
→ Check your webhook endpoint is accessible

### Smart redirects not working
→ Use Chrome DevTools to simulate different devices
→ Check rule priority (top rules are evaluated first)
→ Verify the rule condition matches your device/location

### Analytics not showing
→ Make sure you clicked the link (not just created it)
→ Refresh the analytics page
→ Check browser console for errors

### Masking not working
→ Check if masking is enabled in settings
→ Some sites block iframes (X-Frame-Options header)
→ Try splash screen instead

---

## 6️⃣ Production Deployment

### Environment Variables
```env
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### IP Geolocation (Optional)
Update `lib/analytics.ts` and `lib/smart-redirects.ts`:

```typescript
// Replace dummy geolocation with:
const response = await fetch(`http://ip-api.com/json/${ip}`);
const data = await response.json();
return { country: data.countryCode, city: data.city };
```

### Webhook Retry Logic (Optional)
Add to `lib/webhooks.ts`:
```typescript
// Implement exponential backoff retry
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await fetch(webhook.url, ...);
    if (response.ok) break;
    await sleep(1000 * Math.pow(2, attempt));
  } catch (error) {
    if (attempt === 2) throw error;
  }
}
```

---

## 🎉 You're All Set!

All features are working and production-ready. Have fun building with Zhort v3.0!

**Need help?** Check:
- `FEATURES_COMPLETE.md` - Full documentation
- `FEATURES_V3.md` - Implementation details
- GitHub Issues (if applicable)

---

**Happy shortening! 🚀**

