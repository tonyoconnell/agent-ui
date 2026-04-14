# Domain Management Quick Reference

Fast reference for managing one.ie and subdomains in Cloudflare.

---

## Check Domain Health

```bash
# Verify all three domains resolve
nslookup one.ie && nslookup app.one.ie && nslookup api.one.ie

# Check response times
curl -I https://one.ie/
curl -I https://app.one.ie/
curl -I https://api.one.ie/health

# Certificate validity
echo | openssl s_client -servername one.ie -connect one.ie:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Domain Routing Matrix

| Domain | Service | Config File | Deploy Command |
|--------|---------|-------------|-----------------|
| `one.ie` | Pages (frontend) | `wrangler.toml` | `bun wrangler pages deploy` |
| `app.one.ie` | Pages (frontend) | `wrangler.toml` | `bun wrangler pages deploy` |
| `api.one.ie` | Gateway Worker | `gateway/wrangler.toml` | `cd gateway && bun wrangler deploy` |

---

## Add a New Subdomain

### Option 1: Subdomain to Pages (e.g., docs.one.ie)

1. Deploy Pages normally:
   ```bash
   NODE_ENV=production bun run build
   bun wrangler pages deploy dist/ --project-name=one-substrate
   ```

2. Add domain in Cloudflare Pages UI:
   - https://dash.cloudflare.com → Pages → one-substrate
   - Settings → Custom domains → Add custom domain
   - Enter: `docs.one.ie`
   - Click Deploy

3. Cloudflare auto-provisions DNS + SSL

### Option 2: Subdomain to Worker (e.g., worker.one.ie)

1. Create new worker or add to existing:
   ```bash
   bun wrangler init my-worker
   ```

2. Add route to `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "worker.one.ie/*"
   custom_domain = true
   ```

3. Deploy:
   ```bash
   cd my-worker && bun wrangler deploy
   ```

4. Cloudflare auto-provisions DNS + SSL

---

## SSL Certificate Management

Cloudflare handles all SSL/TLS automatically:

- **Renewal**: Automatic every 90 days
- **Protocol**: TLS 1.3
- **Key Type**: EC P-256 (modern, efficient)
- **Authority**: Google Trust Services (CN=WE1)
- **Cost**: Included in free tier

No manual renewal needed. Check expiry:

```bash
echo | openssl s_client -servername one.ie -connect one.ie:443 2>/dev/null | \
  openssl x509 -noout -text | grep "Not After"
```

Expected output: `May 23 10:30:25 2026 GMT` (89+ days remaining as of April 2026)

---

## DNS Records (Read-Only from CLI)

View current DNS via Cloudflare dashboard: https://dash.cloudflare.com → DNS

Expected records:
```
one.ie          CNAME  one-substrate.pages.dev
app.one.ie      CNAME  one-substrate.pages.dev
api.one.ie      CNAME  one-gateway.oneie.workers.dev
```

Cloudflare manages these automatically. Don't edit manually.

---

## Troubleshooting

### Domain returns 404
```bash
# Check where it points
curl -v https://subdomain.one.ie/ 2>&1 | grep -A 2 "Server:"

# If 404 from Pages, domain not added to project
# → Add via Pages dashboard → Custom domains

# If 404 from Worker, check routes in wrangler.toml
# → Redeploy with correct [[routes]] pattern
```

### Certificate error (ERR_CERT_INVALID)
```bash
# Check certificate chain
openssl s_client -servername subdomain.one.ie -connect subdomain.one.ie:443 -showcerts

# If no certificate found:
# → Wait 5 minutes for Cloudflare to provision
# → Or check domain was added to Cloudflare zone
```

### DNS not resolving
```bash
# Force refresh (OS-level)
# macOS: sudo dscacheutil -flushcache
# Linux: sudo systemctl restart systemd-resolved
# Windows: ipconfig /flushdns

# Check propagation globally
# → https://mxtoolbox.com/mxlookup/ (search one.ie)
```

### Subdomain doesn't reach correct service
```bash
# Verify wrangler.toml routes pattern
cat gateway/wrangler.toml | grep -A 2 "routes"

# Pattern must match exactly:
# ✅ pattern = "api.one.ie"           (exact subdomain)
# ✅ pattern = "api.one.ie/*"         (subdomain + paths)
# ❌ pattern = "*.one.ie"             (wildcards not supported)
# ❌ pattern = "api.one.ie/admin/*"   (path-based routing)

# Fix and redeploy
cd gateway && bun wrangler deploy
```

---

## Monitoring

### Weekly checklist

```bash
#!/bin/bash
echo "=== Domain Health Check ==="
for domain in one.ie app.one.ie api.one.ie; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://$domain/)
  echo "$domain: HTTP $status"
done

echo ""
echo "=== Certificate Status ==="
for domain in one.ie api.one.ie; do
  expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | \
    openssl x509 -noout -text | grep "Not After" | cut -d= -f2)
  echo "$domain expires: $expiry"
done
```

Save as `check-domains.sh` and run weekly.

---

## Costs

- **Custom domains**: Free (Cloudflare free tier)
- **SSL certificates**: Free (auto-provisioned by Cloudflare)
- **DNS**: Free (included with Cloudflare zone)
- **Workers**: Free tier covers 100k requests/day per worker
- **Pages**: Free tier unlimited builds + deployments

---

## References

- Cloudflare Dashboard: https://dash.cloudflare.com
- Pages Custom Domains: https://developers.cloudflare.com/pages/how-to/add-a-custom-domain/
- Worker Routes: https://developers.cloudflare.com/workers/platform/routing/routes/
- DNS Management: https://developers.cloudflare.com/dns/

---

*Domain management is automated by Cloudflare. These commands are for verification only.*
