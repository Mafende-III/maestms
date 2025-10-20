# Production Setup Guide

## Environment Variables for Coolify

For your custom domain preference, update these variables in Coolify:

```bash
# Primary domain (your preferred subdomain)
NEXTAUTH_URL=http://maestms.streamlinexperts.rw
NEXT_PUBLIC_APP_URL=http://maestms.streamlinexperts.rw

# Production environment
NODE_ENV=production

# Database
DATABASE_URL=file:/app/data/prod.db

# Auth
NEXTAUTH_SECRET=your-secret-here-32-chars-min

# Prisma settings
PRISMA_ENABLE_TRACING=false
PRISMA_DISABLE_WARNINGS=true
```

## Manual Database Seeding Commands

If automatic seeding fails, run these commands in the Coolify container terminal:

### 1. Check Database Status
```bash
curl -s http://localhost:3000/api/db-diagnostics | jq
```

### 2. Force Create Admin User
```bash
curl -s -X POST http://localhost:3000/api/force-seed
```

### 3. Verify Admin User Created
```bash
# Check user count and details
curl -s http://localhost:3000/api/db-diagnostics | jq '.database.userCount'
curl -s http://localhost:3000/api/db-diagnostics | jq '.database.users'
```

## Test Authentication

### Login Credentials
- **Email:** admin@mafende.com
- **Password:** Admin123!

### Test Endpoints
```bash
# Health check
curl -s http://localhost:3000/api/health

# Database diagnostics
curl -s http://localhost:3000/api/db-diagnostics

# Force seed admin user
curl -s -X POST http://localhost:3000/api/force-seed
```

## Supported Domains

The application now supports both domains:
- **Primary (preferred):** http://maestms.streamlinexperts.rw
- **Secondary:** http://mgws4gw88co0s88k0kscgow4.31.220.17.127.sslip.io

## Production Checklist

1. ✅ Update environment variables in Coolify
2. ✅ Deploy with updated NextAuth configuration
3. ✅ Run force-seed command to create admin user
4. ✅ Test login on both domains
5. ⏳ Remove debug endpoints (optional for security)

## Troubleshooting

### If login still fails:
1. Check server logs for NextAuth redirect messages
2. Verify NEXTAUTH_URL matches the domain you're accessing
3. Run force-seed command again
4. Clear browser cookies and try again

### If database issues:
1. Check `/app/data/prod.db` file exists and has proper permissions
2. Run `npx prisma db push` to recreate schema
3. Run force-seed command