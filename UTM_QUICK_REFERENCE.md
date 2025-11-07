# 📅 UTM Builder - Quick Reference Card

## Was sind UTM-Parameter?

UTM (Urchin Tracking Module) Parameter sind Tags, die du an URLs anhängst, um Traffic-Quellen in Google Analytics zu tracken.

---

## 🎯 Die 5 UTM-Parameter

| Parameter | Required | Beschreibung | Beispiel |
|-----------|----------|--------------|----------|
| **utm_source** | ✅ | Quelle des Traffics | `google`, `facebook`, `newsletter` |
| **utm_medium** | ✅ | Art des Mediums | `cpc`, `email`, `social`, `banner` |
| **utm_campaign** | ✅ | Kampagnenname | `spring_sale`, `product_launch` |
| **utm_term** | ❌ | Suchbegriffe (für Ads) | `running+shoes`, `best+laptop` |
| **utm_content** | ❌ | Content-Variante | `header_link`, `sidebar_button` |

---

## 🚀 Schnellstart

### Basis-URL
```
https://example.com/product
```

### Mit UTM-Parametern
```
https://example.com/product?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale
```

### In Zhort
1. Gehe zur Link-Erstellung
2. Öffne "UTM Builder"
3. Wähle Template oder fülle Felder aus
4. Erstelle Link!

---

## 📋 Template-Übersicht

### 📧 Email Marketing
```
utm_source=newsletter
utm_medium=email
utm_campaign=monthly_newsletter
```
**Use Case**: Newsletter, Email-Kampagnen

### 📱 Facebook
```
utm_source=facebook
utm_medium=social
utm_campaign=product_launch
```
**Use Case**: Facebook Posts, Stories

### 🐦 Twitter/X
```
utm_source=twitter
utm_medium=social
utm_campaign=announcement
```
**Use Case**: Tweets, X Posts

### 📸 Instagram
```
utm_source=instagram
utm_medium=social
utm_campaign=bio_link
```
**Use Case**: Bio-Link, Stories

### 💼 LinkedIn
```
utm_source=linkedin
utm_medium=social
utm_campaign=company_update
```
**Use Case**: Business-Posts

### 💰 Google Ads
```
utm_source=google
utm_medium=cpc
utm_campaign=brand_keywords
utm_term=best+product
```
**Use Case**: Google Search Ads

### 💸 Facebook Ads
```
utm_source=facebook
utm_medium=cpc
utm_campaign=conversion_campaign
utm_content=image_ad_1
```
**Use Case**: Facebook/Instagram Ads

### 🤝 Referral
```
utm_source=referral
utm_medium=partner
utm_campaign=affiliate_program
```
**Use Case**: Partner-Links, Affiliates

### 📄 QR Code
```
utm_source=qr_code
utm_medium=offline
utm_campaign=poster_campaign
```
**Use Case**: Print-Material, Events

### 📝 Blog
```
utm_source=blog
utm_medium=content
utm_campaign=tutorial_series
```
**Use Case**: Blog-Posts, Content

---

## 💡 Best Practices

### ✅ DO's

✅ **Konsistente Namen**
```
✓ utm_source=facebook (immer lowercase)
✗ utm_source=Facebook (mixed case)
```

✅ **Unterstriche statt Spaces**
```
✓ utm_campaign=spring_sale
✗ utm_campaign=spring sale
```

✅ **Beschreibend sein**
```
✓ utm_content=header_cta_button
✗ utm_content=btn1
```

✅ **Hierarchie beachten**
```
Source → Medium → Campaign → Content
```

### ❌ DON'Ts

❌ **Keine Sonderzeichen**
```
✗ utm_campaign=sale!@#$%
✓ utm_campaign=sale_2025
```

❌ **Keine Leerzeichen**
```
✗ utm_source=google ads
✓ utm_source=google_ads
```

❌ **Keine inkonsistenten Namen**
```
✗ utm_source=fb (heute)
✗ utm_source=facebook (morgen)
✓ utm_source=facebook (immer)
```

---

## 🎨 Naming Conventions

### UTM Source
**Format**: `platform_name`

Beispiele:
- `google`
- `facebook`
- `instagram`
- `newsletter`
- `partner_xyz`

### UTM Medium
**Format**: `traffic_type`

Common Values:
- `cpc` - Cost Per Click (Paid Ads)
- `email` - Email Marketing
- `social` - Social Media (organic)
- `referral` - Referral Traffic
- `organic` - Organic Search
- `display` - Display Ads
- `affiliate` - Affiliate Links
- `video` - Video Ads

### UTM Campaign
**Format**: `descriptive_campaign_name`

Beispiele:
- `spring_sale_2025`
- `product_launch_q1`
- `webinar_series_jan`
- `holiday_promo`

### UTM Content
**Format**: `specific_identifier`

Beispiele:
- `header_button`
- `sidebar_link`
- `footer_cta`
- `image_ad_1`
- `text_ad_variant_a`

---

## 📊 Google Analytics

### Wo finde ich UTM-Daten?

**Google Analytics 4 (GA4)**:
```
Reports → Acquisition → Traffic acquisition
```

**Universal Analytics (UA)**:
```
Acquisition → Campaigns → All Campaigns
```

### Wichtige Metriken
- **Users**: Wie viele Benutzer kamen über diese Quelle?
- **Sessions**: Wie viele Sessions wurden gestartet?
- **Bounce Rate**: Wie viele verließen sofort wieder?
- **Conversions**: Wie viele konvertierten?
- **Revenue**: Wie viel Umsatz wurde generiert?

---

## 🔍 Debugging

### URL nicht getrackt?

**Checklist**:
- [ ] Google Analytics installiert?
- [ ] UTM-Parameter richtig formatiert?
- [ ] Keine Leerzeichen in Werten?
- [ ] Link wurde geklickt (nicht nur erstellt)?
- [ ] 24-48h gewartet für GA-Update?

### Häufige Fehler

**Problem**: Parameter werden nicht angezeigt
```
✗ https://example.com?source=google
✓ https://example.com?utm_source=google
```
**Lösung**: Prefix `utm_` nicht vergessen!

**Problem**: Sonderzeichen
```
✗ utm_campaign=50%-off
✓ utm_campaign=50_percent_off
```
**Lösung**: Nur Buchstaben, Zahlen, `-`, `_`

**Problem**: Spaces
```
✗ utm_source=google ads
✓ utm_source=google_ads
```
**Lösung**: Unterstriche verwenden

---

## 📈 Advanced Use Cases

### A/B Testing
```
utm_content=variant_a
utm_content=variant_b
```

### Multi-Channel Attribution
```
utm_source=facebook
utm_medium=social
utm_campaign=awareness_campaign
utm_content=video_ad

utm_source=google
utm_medium=cpc
utm_campaign=retargeting_campaign
utm_content=display_ad
```

### Influencer Tracking
```
utm_source=influencer_john_doe
utm_medium=social
utm_campaign=sponsored_post
```

### Event Tracking
```
utm_source=conference_2025
utm_medium=offline
utm_campaign=booth_qr_code
utm_content=flyer_front
```

---

## 🛠️ Tools

### Online UTM Builder
- Zhort UTM Builder (built-in)
- Google Campaign URL Builder
- UTM.io

### Validation
- Zhort Validator (automatic)
- URL Decoder
- Google Analytics Debugger

### Testing
- Google Analytics Real-Time Reports
- Chrome DevTools Network Tab
- UTM Parameter Stripper (for clean URLs)

---

## 📞 Quick Help

### Problem: Template passt nicht
**Lösung**: Verwende "Custom HTML" und passe an

### Problem: Zu viele Parameter
**Lösung**: Nutze nur Source + Medium + Campaign für den Start

### Problem: Keine Daten in Analytics
**Lösung**: Prüfe ob GA-Code auf Ziel-Website installiert ist

---

## 🎓 Resources

### Offizielle Docs
- [Google Analytics Help](https://support.google.com/analytics)
- [UTM Best Practices](https://support.google.com/analytics/answer/1033863)

### Zhort Docs
- `FEATURES_V4.md` - Full Documentation
- `API_DOCUMENTATION.md` - API Reference

---

**📅 UTM Builder Version**: 1.0  
**🔗 Zhort Version**: 4.0  
**📅 Last Updated**: November 2025

---

**Happy Tracking! 📊**

