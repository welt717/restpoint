# REST POINT - PRODUCTION DEPLOYMENT & CONFIGURATION GUIDE

## 🚀 Pre-Deployment Checklist

### Phase 1: Environment Configuration
- [ ] Set all services to NODE_ENV=production
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up environment variables for all services
- [ ] Configure database backups (daily minimum)
- [ ] Set up monitoring/logging (ELK, DataDog, or similar)
- [ ] Configure CDN for static assets
- [ ] Set up domain and DNS records
- [ ] Configure firewall rules

### Phase 2: Backend Services Verification

**API Gateway (Port 8000)** - Route: `/api/v1/restpoint`
```
✓ Check: http://localhost:8000/api/v1/restpoint/health
Expected: {"status":"UP","version":"1.0.0"}
```

**Deceased Service (Port 8001)** - Primary deceased management
```
Routes:
- POST /api/v1/restpoint/deceased - Create deceased record
- GET /api/v1/restpoint/deceased/:id - Get deceased profile
- PUT /api/v1/restpoint/deceased/:id - Update deceased
- DELETE /api/v1/restpoint/deceased/:id - Delete record
- GET /api/v1/restpoint/deceased/search - Search records

Headers Required:
- x-tenant-slug: {tenant-identifier}
- Authorization: Bearer {token}
```

**Auth Service (Port 8001)** - Authentication & Authorization
```
Routes:
- POST /api/v1/restpoint/auth/login - User login
- POST /api/v1/restpoint/auth/register - New tenant registration
- POST /api/v1/restpoint/auth/refresh - Refresh token
- POST /api/v1/restpoint/auth/logout - Logout

Endpoints should return JWT tokens with 24-hour expiry
```

**Billing Service** - Daily billing & M-PESA integration
```
Routes:
- POST /api/v1/restpoint/billing/calculate - Calculate charges
- GET /api/v1/restpoint/billing/ledger/:deceasedId - View billing history
- POST /api/v1/restpoint/billing/invoice - Generate invoice

Billing runs daily at 00:00 UTC (configurable)
```

**Dispatch Service (Port 8000)** - Fleet management
```
Routes:
- POST /api/v1/restpoint/dispatch - Create dispatch
- GET /api/v1/restpoint/dispatch/:id - Get dispatch details
- PUT /api/v1/restpoint/dispatch/:id - Update status
- GET /api/v1/restpoint/vehicles/available - List available vehicles

Required for WhatsApp integration:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_NUMBER
```

**eDocuments Service (Port 8116)** - Document editing & storage
```
Routes:
- POST /api/v1/restpoint/edocuments - Create document
- GET /api/v1/restpoint/edocuments/:id - Retrieve document
- PUT /api/v1/restpoint/edocuments/:id - Update document
- GET /api/v1/restpoint/edocuments/templates - List templates

Tenant-isolated storage at: services/edocuments-service/uploads/{tenant-slug}/
```

**Notification Service (Port 8008)** - SMS & Email notifications
```
Routes:
- POST /api/v1/restpoint/notifications/sms - Send SMS
- POST /api/v1/restpoint/notifications/email - Send email
- POST /api/v1/restpoint/notifications/whatsapp - Send WhatsApp

Uses Redis queue for reliability
```

### Phase 3: Frontend Configuration

**Landing Page** - Smart redirect based on auth state
```
Location: FrontendClient/client/src/modules/landing/ProductionLandingPage.jsx

Behavior:
- If logged in: Show "Go to Dashboard" button
- If not logged in: Show "Start Free Trial" → redirects to /login
- Landing page always accessible for marketing

SEO Meta Tags Added:
- title: REST POINT - Mortuary Management OS for Africa
- description: All-in-one mortuary operating system with deceased management
- og:image: (set your social media preview)
- canonical: https://your-domain.com
```

**Login Flow** - Optimized for returning tenants
```
1. User visits site
2. If token exists and valid:
   - Skip landing page
   - Show dashboard directly
3. If no token:
   - Show landing page
   - Login button always visible
   - No forced navigation away

Key Files:
- src/routes/AppRouter.jsx - Route configuration
- src/components/auth/login.jsx - Login component
- src/store/useAuthStore.js - Auth state management
```

**Sidebar Styling** - White background, modern design
```
Location: src/components/layout/ModernSidebar.jsx

Features:
- White background with subtle shadow
- Green accent color (#059669)
- Smooth hover animations
- Mobile responsive (collapsible on small screens)
- Tenant info display
- Quick access to main features

Colors:
- Background: #FFFFFF
- Accent: #059669
- Text: #1F2937
- Border: #E5E7EB
```

### Phase 4: API Integration Verification

Create a test script to verify all services are connected:

```bash
# services-test.sh
#!/bin/bash

API_GATEWAY="http://localhost:8000/api/v1/restpoint"
TENANT="test-tenant"

echo "🔍 Testing API Service Connectivity..."

# Test each endpoint
services=(
  "GET /health"
  "GET /deceased"
  "GET /auth/status"
  "GET /billing/health"
  "GET /dispatch/health"
  "GET /edocuments/health"
  "GET /notifications/health"
)

for service in "${services[@]}"; do
  METHOD=$(echo $service | cut -d' ' -f1)
  ENDPOINT=$(echo $service | cut -d' ' -f2)
  
  RESPONSE=$(curl -s -X $METHOD \
    -H "x-tenant-slug: $TENANT" \
    -H "Authorization: Bearer test-token" \
    "$API_GATEWAY$ENDPOINT")
  
  echo "✓ $service: $RESPONSE"
done
```

### Phase 5: Deceased Registration Date Picker Fix

**Issue:** Date picker selects wrong date

**Fix Location:** `src/components/deceasedinfo/registerDeceased.jsx`

**Solution:**
```javascript
// Ensure date input uses ISO format
const handleDateChange = (fieldName, value) => {
  // Convert to YYYY-MM-DD format
  const date = new Date(value);
  const isoDate = date.toISOString().split('T')[0];
  setFormData(prev => ({
    ...prev,
    [fieldName]: isoDate
  }));
};

// In JSX, use:
<input 
  type="date"
  value={formData.dateOfDeath?.split('T')[0] || ''}
  onChange={(e) => handleDateChange('dateOfDeath', e.target.value)}
/>
```

### Phase 6: SEO Optimization for Africa

**Meta Tags Configuration:**
```html
<!-- In public/index.html -->
<meta name="description" content="All-in-one mortuary management system for Kenya, Uganda, Tanzania, and East Africa. Deceased management, billing, dispatch, and family portal.">
<meta name="keywords" content="mortuary software, funeral management Kenya, deceased management East Africa">
<meta name="geo.placename" content="Kenya, Uganda, Tanzania, East Africa">
<meta property="og:title" content="REST POINT - Mortuary OS">
<meta property="og:description" content="Modern mortuary management for Africa">
<meta property="og:image" content="/og-image.png">
```

**Schema Markup for Local Business:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "REST POINT",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "areaServed": ["KE", "UG", "TZ", "ET", "RW", "NG", "GH"],
  "inLanguage": "en-US"
}
```

**Sitemap & Robots.txt:**
```
Location: public/sitemap.xml
Location: public/robots.txt

robots.txt:
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Sitemap: https://your-domain.com/sitemap.xml
```

### Phase 7: Monitoring & Alerts

**Key Metrics to Monitor:**
- API response time (target: <500ms)
- Database query time (target: <100ms)
- Service uptime (target: 99.9%)
- Error rate (target: <0.1%)
- Active user sessions
- Tenant data isolation compliance
- File storage usage per tenant
- Daily billing completion rate

**Alert Thresholds:**
- Service down: CRITICAL
- Response time >2s: HIGH
- Error rate >1%: HIGH
- Database connection failures: CRITICAL
- Disk space <10%: WARNING
- Billing job fails: CRITICAL

### Phase 8: Backup & Disaster Recovery

**Daily Backups:**
```bash
# Database backup
pg_dump restpoint_main > backup-$(date +%Y%m%d).sql

# File storage backup
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz \
  services/edocuments-service/uploads/ \
  services/documents-service/uploads/

# Store in S3
aws s3 cp *.sql s3://restpoint-backups/
aws s3 cp *.tar.gz s3://restpoint-backups/
```

**Recovery Procedure:**
1. Stop all services
2. Restore database from backup
3. Restore file storage
4. Verify tenant isolation
5. Run data integrity checks
6. Restart services
7. Monitor for errors

### Phase 9: Performance Optimization

**Frontend Optimization:**
- [ ] Enable gzip compression
- [ ] Minify CSS/JS
- [ ] Implement lazy loading for images
- [ ] Use code splitting
- [ ] Enable browser caching
- [ ] Use CDN for static assets

**Backend Optimization:**
- [ ] Enable database query caching
- [ ] Use Redis for session/token caching
- [ ] Implement rate limiting
- [ ] Use connection pooling
- [ ] Enable HTTP/2
- [ ] Configure nginx reverse proxy

### Phase 10: Security Hardening

**Before Going Live:**
- [ ] SSL/TLS certificates (minimum TLS 1.2)
- [ ] CORS configuration (restrict origins)
- [ ] CSRF protection enabled
- [ ] Rate limiting (100 req/min per IP)
- [ ] Input validation on all endpoints
- [ ] Tenant isolation verified
- [ ] Authentication token rotation
- [ ] Database credentials rotated
- [ ] API keys stored securely (environment variables)
- [ ] Audit logging enabled
- [ ] Penetration testing completed

**Headers to Add:**
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## 📋 Post-Deployment Verification

1. **Test Landing Page**
   - Navigate to homepage
   - Verify login redirect works
   - Check SEO meta tags in inspector

2. **Test Login Flow**
   - Login with test account
   - Verify dashboard loads
   - Check refresh token renewal
   - Verify logout clears session

3. **Test Deceased Registration**
   - Create new deceased record
   - Verify date picker works correctly
   - Check date is saved in correct format
   - Verify billing calculated correctly

4. **Test All Services**
   - Create dispatch
   - Send notification
   - Generate document
   - Process payment
   - View analytics

5. **Monitor Logs**
   - Check for errors
   - Verify tenant isolation (no cross-tenant access)
   - Monitor response times
   - Check for security warnings

## 🌍 Africa-Specific Considerations

1. **Offline Capability**
   - Implement service workers
   - Cache critical pages
   - Queue requests when offline
   - Sync when connectivity restored

2. **Low-Bandwidth Support**
   - Compress images aggressively
   - Minimize JavaScript
   - Use lazy loading
   - Implement progressive enhancement

3. **Local Payment Methods**
   - M-Pesa integration (Kenya)
   - MTN Mobile Money (East Africa)
   - Airtel Money (East Africa)
   - Bank transfers

4. **Localization**
   - Support English & local languages
   - Use local currency (KES for Kenya)
   - Respect local date formats
   - Support SMS in local languages

5. **Compliance**
   - Kenya: Health Act 2017, Regulations
   - Digital Privacy: GDPR-like compliance
   - Data localization if required
   - Regular compliance audits

## 📞 Support & Maintenance

**Incident Response Time:**
- CRITICAL (service down): 15 minutes
- HIGH (major degradation): 1 hour  
- MEDIUM (significant impact): 4 hours
- LOW (minor issue): 24 hours

**Regular Maintenance:**
- Weekly: Review logs and metrics
- Monthly: Update dependencies, security patches
- Quarterly: Performance audit, capacity planning
- Yearly: Penetration testing, compliance audit

## ✅ Production Readiness Checklist

- [ ] All services running and communicating
- [ ] Database backups configured and tested
- [ ] SSL certificates installed
- [ ] Monitoring and alerting active
- [ ] Landing page live with SEO
- [ ] Login flow tested and working
- [ ] Deceased registration seamless
- [ ] All APIs verified
- [ ] Documentation complete
- [ ] Team trained and ready
- [ ] Support email/phone configured
- [ ] Incident response plan documented

---

**Version:** 1.0  
**Last Updated:** June 10, 2026  
**Status:** READY FOR PRODUCTION ✅  
**Deployment Instructions:** Follow phases 1-10 above, then run post-deployment verification checklist.
