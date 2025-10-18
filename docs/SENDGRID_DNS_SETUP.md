# SendGrid DNS Setup Guide - AWS Route 53

## Overview

SendGrid requires DNS records to verify your domain and enable email sending. This guide walks you through adding these records to AWS Route 53.

---

## What DNS Records Does SendGrid Require?

SendGrid typically asks you to add **3 types of DNS records**:

### 1. **Domain Authentication (CNAME records)**
   - Verifies you own the domain
   - Improves email deliverability
   - Prevents emails from being marked as spam
   - Usually 3 CNAME records with names like:
     - `s1._domainkey.yourdomain.com`
     - `s2._domainkey.yourdomain.com`
     - `em1234.yourdomain.com`

### 2. **Link Branding (CNAME record)**
   - Makes tracking links use your domain instead of SendGrid's
   - Usually 1 CNAME record like:
     - `url1234.yourdomain.com`

### 3. **Automated Security (TXT record)** *(Optional but recommended)*
   - SPF record to prevent email spoofing
   - DMARC record for email authentication policy

---

## Step-by-Step: Get Your DNS Records from SendGrid

### 1. Log in to SendGrid Dashboard

Go to [SendGrid Dashboard](https://app.sendgrid.com/)

### 2. Navigate to Sender Authentication

1. Click **Settings** → **Sender Authentication**
2. Click **Get Started** under "Authenticate Your Domain"

### 3. Choose Your DNS Host

1. Select **"Other Host (not listed)"** or **"Amazon Route 53"**
2. Enter your domain: `aspiretowards.com` (or your custom domain)
3. Click **Next**

### 4. Copy the DNS Records

SendGrid will show you a list of DNS records to add. They'll look something like this:

```
Type: CNAME
Host: s1._domainkey
Value: s1.domainkey.u12345.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey
Value: s2.domainkey.u12345.wl123.sendgrid.net

Type: CNAME
Host: em1234
Value: u12345.wl123.sendgrid.net

Type: CNAME
Host: url1234
Value: sendgrid.net
```

**Important:** Keep this page open or screenshot the records. You'll need these exact values.

---

## Step-by-Step: Add Records to AWS Route 53

### Method 1: Via AWS Console (Recommended for Beginners)

#### 1. Open AWS Route 53

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Search for **"Route 53"** in the search bar
3. Click **"Hosted zones"** in the left sidebar

#### 2. Select Your Domain

1. Click on your domain name (e.g., `aspiretowards.com`)
2. You'll see a list of existing DNS records

#### 3. Create Each CNAME Record

For **each CNAME record** SendGrid provided (usually 3-4 records):

1. Click **"Create record"** button
2. Fill in the form:
   - **Record name:** Enter the `Host` value from SendGrid
     - Example: `s1._domainkey` (Route 53 will auto-append `.aspiretowards.com`)
   - **Record type:** Select **CNAME**
   - **Value:** Enter the `Value` from SendGrid
     - Example: `s1.domainkey.u12345.wl123.sendgrid.net`
   - **TTL:** Leave default (300 seconds is fine)
3. Click **"Create records"**

**Repeat this process for all CNAME records SendGrid provided.**

#### Visual Example for Domain Authentication:

| Record Type | Record Name | Value |
|-------------|-------------|-------|
| CNAME | `s1._domainkey` | `s1.domainkey.u12345.wl123.sendgrid.net` |
| CNAME | `s2._domainkey` | `s2.domainkey.u12345.wl123.sendgrid.net` |
| CNAME | `em1234` | `u12345.wl123.sendgrid.net` |

#### Visual Example for Link Branding:

| Record Type | Record Name | Value |
|-------------|-------------|-------|
| CNAME | `url1234` | `sendgrid.net` |

#### 4. Add SPF Record (Optional but Recommended)

If you don't already have an SPF record:

1. Click **"Create record"**
2. Fill in:
   - **Record name:** Leave blank (applies to root domain)
   - **Record type:** Select **TXT**
   - **Value:** `v=spf1 include:sendgrid.net ~all`
   - **TTL:** 300
3. Click **"Create records"**

**If you already have an SPF record:**
1. Find the existing TXT record with `v=spf1`
2. Click **Edit**
3. Add `include:sendgrid.net` before `~all` or `-all`
   - Example: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`

#### 5. Add DMARC Record (Optional but Recommended)

1. Click **"Create record"**
2. Fill in:
   - **Record name:** `_dmarc`
   - **Record type:** Select **TXT**
   - **Value:** `v=DMARC1; p=none; rua=mailto:YOUR_EMAIL@aspiretowards.com`
   - **TTL:** 300
3. Click **"Create records"**

---

### Method 2: Via AWS CLI (Advanced)

If you prefer using the command line:

#### 1. Install AWS CLI

```bash
brew install awscli
# or
pip install awscli

# Configure credentials
aws configure
```

#### 2. Create a JSON File

Create a file `sendgrid-dns-records.json`:

```json
{
  "Comment": "SendGrid DNS records for email authentication",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "s1._domainkey.aspiretowards.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "s1.domainkey.u12345.wl123.sendgrid.net"
          }
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "s2._domainkey.aspiretowards.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "s2.domainkey.u12345.wl123.sendgrid.net"
          }
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "em1234.aspiretowards.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "u12345.wl123.sendgrid.net"
          }
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "url1234.aspiretowards.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "sendgrid.net"
          }
        ]
      }
    }
  ]
}
```

**Important:** Replace the values with the actual records SendGrid provided.

#### 3. Get Your Hosted Zone ID

```bash
aws route53 list-hosted-zones
```

Find your domain's `Id` (looks like `/hostedzone/Z1234567890ABC`)

#### 4. Apply the DNS Records

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://sendgrid-dns-records.json
```

---

## Step-by-Step: Verify DNS Records in SendGrid

### 1. Wait for DNS Propagation

DNS changes can take **5 minutes to 48 hours** to propagate. Usually:
- Route 53 internal: ~60 seconds
- Global propagation: 15-30 minutes

### 2. Check DNS Propagation (Optional)

Use online tools to verify:
- [DNSChecker](https://dnschecker.org/)
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx)

Example check:
```bash
# Check CNAME record
dig s1._domainkey.aspiretowards.com CNAME

# Should return the SendGrid value
```

### 3. Verify in SendGrid

1. Go back to SendGrid → **Settings** → **Sender Authentication**
2. Find your domain in the list
3. Click **"Verify"** or **"Check DNS"**
4. If successful, you'll see ✓ checkmarks next to each record
5. Status will change to **"Verified"**

**If verification fails:**
- Wait 10-15 minutes and try again
- Double-check record names and values match exactly
- Ensure no extra spaces or typos
- Check Route 53 for the records

---

## Step-by-Step: Set Up Sender Email

### 1. Create a Verified Sender

SendGrid requires a verified "From" email address:

1. Go to **Settings** → **Sender Authentication**
2. Click **"Create New Sender"** or **"Single Sender Verification"**
3. Fill in details:
   - **From Name:** A&A RentFlow
   - **From Email Address:** `noreply@aspiretowards.com` or `bookings@aspiretowards.com`
   - **Reply To:** Your support email (e.g., `support@aspiretowards.com`)
   - **Company Address:** Your business address
4. Click **"Create"**

### 2. Verify the Sender Email

1. SendGrid will send a verification email to `noreply@aspiretowards.com`
2. **Important:** You need to receive this email. Options:
   - Set up a catch-all email for your domain
   - Create a forwarding rule in Route 53 (requires AWS SES)
   - Use a real mailbox like `bookings@aspiretowards.com`
3. Click the verification link in the email

### 3. Update Your `.env` File

Once verified, update your backend `.env`:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@aspiretowards.com
FROM_NAME=A&A RentFlow
REPLY_TO_EMAIL=support@aspiretowards.com
```

---

## Common DNS Record Types Explained

### CNAME (Canonical Name)
- **Purpose:** Points one domain to another
- **Example:** `s1._domainkey.aspiretowards.com` → `s1.domainkey.sendgrid.net`
- **Used for:** Domain authentication, link branding

### TXT (Text)
- **Purpose:** Stores text information for various services
- **Example:** `v=spf1 include:sendgrid.net ~all`
- **Used for:** SPF, DMARC, domain verification

### MX (Mail Exchange)
- **Purpose:** Directs email to mail servers
- **Example:** `mail.aspiretowards.com` (Priority: 10)
- **Used for:** Receiving emails (not needed for SendGrid sending)

---

## Troubleshooting

### Issue: "DNS records not found"

**Solution:**
1. Check that records are in the correct hosted zone
2. Verify record names don't have typos
3. Wait 15-30 minutes for propagation
4. Use `dig` to manually check:
   ```bash
   dig s1._domainkey.aspiretowards.com CNAME
   ```

### Issue: "CNAME already exists"

**Solution:**
- Route 53 doesn't allow duplicate CNAMEs
- Edit the existing record instead of creating a new one
- Or delete the old record first

### Issue: "Verification email not received"

**Solution:**
1. Check spam/junk folder
2. Use a real email address you can access
3. Set up email forwarding or use Amazon SES + Route 53
4. Temporarily use a personal email for testing

### Issue: "SPF record too long"

**Solution:**
- SPF records have a 255-character limit
- Use `include:` mechanism to reference other SPF records
- Example: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`

### Issue: "Emails going to spam"

**Solution:**
1. Ensure all DNS records are verified
2. Add DMARC record
3. Warm up your sending domain (start with low volume)
4. Use authenticated sender email
5. Avoid spam trigger words in subject/body

---

## Quick Reference: Example DNS Records

For domain `aspiretowards.com`, here's what your Route 53 records should look like:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `s1._domainkey` | `s1.domainkey.u12345.wl123.sendgrid.net` | 300 |
| CNAME | `s2._domainkey` | `s2.domainkey.u12345.wl123.sendgrid.net` | 300 |
| CNAME | `em1234` | `u12345.wl123.sendgrid.net` | 300 |
| CNAME | `url1234` | `sendgrid.net` | 300 |
| TXT | (blank/root) | `v=spf1 include:sendgrid.net ~all` | 300 |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@aspiretowards.com` | 300 |

**Note:** The actual values (`em1234`, `url1234`, `u12345`) will be different for your account. Use the exact values SendGrid provides.

---

## Testing Email Sending

### 1. Test via SendGrid Dashboard

1. Go to **Email API** → **Integration Guide**
2. Choose **Web API**
3. Select **Node.js**
4. Click **"Send Test Email"**
5. Enter your email address
6. Check your inbox

### 2. Test via Your Application

Once DNS is verified and sender is authenticated:

```bash
# Start your backend
cd backend
npm run dev
```

Trigger a booking to test email notifications:
1. Go through the booking flow on your site
2. Check console logs for: `"Email sent successfully"`
3. Check host email inbox for booking notification

### 3. Monitor Email Activity

1. Go to **Activity** in SendGrid dashboard
2. View real-time email delivery status
3. Check for bounces, blocks, or spam reports

---

## Security Best Practices

### 1. Protect Your API Key

```bash
# In .env (never commit this file)
SENDGRID_API_KEY=SG.xxxxxx

# In .gitignore
.env
.env.local
.env.production
```

### 2. Use Environment-Specific Keys

- **Development:** Use SendGrid test mode or separate API key
- **Production:** Use production API key with limited permissions

### 3. Set Up API Key Permissions

In SendGrid:
1. Go to **Settings** → **API Keys**
2. Create key with **restricted access**:
   - ✓ Mail Send (Full Access)
   - ✗ Unsubscribe Groups (No Access)
   - ✗ Stats (No Access)
   - etc.

### 4. Rotate API Keys Regularly

- Change API keys every 90 days
- Immediately rotate if compromised
- Keep a backup key for zero-downtime rotation

---

## Next Steps

After setting up DNS and verifying your domain:

1. ✅ **Test email sending** - Send a test booking request
2. ✅ **Monitor deliverability** - Check SendGrid activity dashboard
3. ✅ **Set up email templates** (optional) - Create branded HTML templates
4. ✅ **Configure webhooks** (optional) - Track bounces, opens, clicks
5. ✅ **Add unsubscribe handling** - Comply with CAN-SPAM Act
6. ✅ **Set up alerts** - Get notified of delivery issues

---

## Additional Resources

- **SendGrid Documentation:** https://docs.sendgrid.com/
- **Route 53 Documentation:** https://docs.aws.amazon.com/route53/
- **DNS Checker Tool:** https://dnschecker.org/
- **SPF Record Checker:** https://mxtoolbox.com/spf.aspx
- **DMARC Guide:** https://dmarc.org/

---

## Support

If you encounter issues:

1. **SendGrid Support:** https://support.sendgrid.com/
2. **AWS Support:** https://console.aws.amazon.com/support/
3. **Check SendGrid Status:** https://status.sendgrid.com/

---

**Last Updated:** October 18, 2025
**Version:** 1.0.0
