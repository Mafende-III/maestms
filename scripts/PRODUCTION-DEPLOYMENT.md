# Production Deployment Guide

## Overview
This guide outlines the process for deploying Ngoma Business Center data to production.

## Deployment Order (CRITICAL)
**⚠️ IMPORTANT: Follow this exact order to ensure data integrity**

### 1. Deploy Assets First
Assets must be created before sales data since sales records link to assets.

```bash
# Deploy assets to production
node scripts/import-assets-to-production.js
```

### 2. Deploy Sales Data Second
Only after assets are successfully created:

```bash
# Deploy sales data to production
node scripts/import-sales-to-production.js
```

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Production server is running and accessible
- [ ] Database is properly configured
- [ ] Admin user exists in production
- [ ] Production URL is correctly set in scripts

### ✅ Data Verification
- [ ] Assets export contains 2 properties:
  - Ngoma Business Center (UGX 60M value)
  - Nakasongola Ranch (UGX 2.5B value)
- [ ] Sales CSV contains 57 records (Oct 1-16, 2025)
- [ ] All scripts are tested locally

## Production Configuration

### Update Production URLs
Before deployment, update these files with your actual production URL:

1. `scripts/import-assets-to-production.js` - Line 12
2. `scripts/import-sales-to-production.js` - Line 12

```javascript
const PRODUCTION_URL = 'https://your-actual-domain.com';
```

### Environment Variables
Set these in production:
```bash
ADMIN_PASSWORD=your_secure_admin_password
```

## Data Summary

### Assets (2 records)
- **Ngoma Business Center**: Multi-business facility (UGX 60M value)
- **Nakasongola Ranch**: Agricultural ranch (UGX 2.5B value)

### Sales (57 records)
- **Total Revenue**: UGX 19,370,235
- **Date Range**: October 1-16, 2025
- **Categories**: Shop, Charcoal, Salon, Cinema, Mobile Money
- **Top Category**: Charcoal (67% of revenue)

## Deployment Commands

### Step 1: Deploy Assets
```bash
cd scripts
node import-assets-to-production.js
```

**Expected Output:**
```
🚀 Starting Asset Import to Production...
📍 Target: https://your-domain.com
📊 Assets to import: 2

🔐 Logging into production...
✅ Login successful
📝 Creating asset: Ngoma Business Center...
   ✅ Created: Ngoma Business Center (ID: cmh2iqi9y0000ttaxuvz4ynaj)
📝 Creating asset: Nakasongola Ranch...
   ✅ Created: Nakasongola Ranch (ID: cmh2iqia00001ttaxe2o8g4f8)

📈 Import Summary:
✅ Successfully imported: 2 assets
❌ Errors: 0 assets

🎉 All assets imported successfully!
🔗 Assets are now available for sales data import.
```

### Step 2: Deploy Sales Data
```bash
node import-sales-to-production.js
```

**Expected Output:**
```
🚀 Starting Sales Import to Production...
📍 Target: https://your-domain.com
📖 Reading sales data...
📊 Found 57 sales records to import

🔐 Logging into production...
✅ Login successful
📝 Creating sale: Daily Shop Sales - UGX 465,400...
   ✅ Created: Daily Shop Sales
[... 57 records processed ...]

📈 Import Summary:
✅ Successfully imported: 57 sales
❌ Errors: 0 sales

🎉 All sales imported successfully!
💰 Ngoma Business Center sales data is now live in production.
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify admin credentials are correct
   - Check production server is accessible
   - Ensure admin user exists in production

2. **Asset Creation Failed**
   - Check database permissions
   - Verify asset API endpoints are working
   - Ensure proper database schema

3. **Sales Import Failed**
   - Verify assets were created first
   - Check asset IDs match between environments
   - Verify sales API endpoints are working

### Verification Commands

After deployment, verify data in production:

```bash
# Check assets in production
curl https://your-domain.com/api/assets

# Check sales in production
curl https://your-domain.com/api/sales
```

## Rollback Procedure

If deployment fails:

1. **Assets**: Delete created assets via admin panel
2. **Sales**: Delete imported sales via admin panel
3. **Database**: Restore from backup if available

## Security Notes

- Never commit production passwords to git
- Use environment variables for sensitive data
- Rotate admin password after deployment
- Monitor logs for any security issues

## Contact

For deployment issues, contact the development team.

---
*Last Updated: October 23, 2025*
*Generated with Claude Code*