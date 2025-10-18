# Deployment Guide for Mafende Estate Management System

## Coolify Deployment Instructions

This application is configured for deployment on Coolify with the domain: **www.maest.streamlinexperts.rw**

### Prerequisites

1. Coolify instance set up and running
2. GitHub repository: https://github.com/Mafende-III/maestms
3. Domain configured: www.maest.streamlinexperts.rw

### Deployment Steps

#### 1. Create New Project in Coolify

1. Log into your Coolify dashboard
2. Click "New Project"
3. Select "Public Repository"
4. Enter repository URL: `https://github.com/Mafende-III/maestms`

#### 2. Configure Environment Variables

In Coolify, set the following environment variables:

```env
# Required Variables
DATABASE_URL=file:/app/data/prod.db
NEXTAUTH_URL=https://www.maest.streamlinexperts.rw
NEXTAUTH_SECRET=[generate-a-secure-random-string]
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.maest.streamlinexperts.rw

# Optional Variables
SEED_DATABASE=true  # Set to true only for first deployment
```

**Important:** Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

#### 3. Configure Build Settings

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Port:** 3000
- **Health Check Path:** `/api/health`

#### 4. Configure Domain & SSL

1. In Coolify, go to your application settings
2. Add domain: `www.maest.streamlinexperts.rw`
3. Enable "Force HTTPS"
4. Enable "Auto-generate SSL certificate" (Let's Encrypt)

#### 5. Configure Persistent Storage

Add a persistent volume for the SQLite database:
- **Container Path:** `/app/data`
- **Volume Name:** `mafende-estate-data`

#### 6. Deploy

1. Click "Deploy" in Coolify
2. Monitor the deployment logs
3. Wait for the health check to pass

### Post-Deployment

#### First-Time Setup

1. Access the application at https://www.maest.streamlinexperts.rw
2. Log in with default credentials:
   - Email: admin@mafende.com
   - Password: Admin@123

3. **IMPORTANT:** Change the admin password immediately

#### Database Backup

Set up regular backups for the SQLite database:
- The database is located at `/app/data/prod.db`
- Configure Coolify's backup feature or use external backup solution

### Troubleshooting

#### Application Not Starting
- Check Coolify logs for errors
- Verify all environment variables are set correctly
- Ensure the health check endpoint is accessible

#### Database Issues
- Verify the persistent volume is mounted correctly
- Check file permissions on `/app/data` directory
- Run migrations manually if needed: `npx prisma migrate deploy`

#### Authentication Issues
- Verify `NEXTAUTH_URL` matches your domain exactly
- Ensure `NEXTAUTH_SECRET` is set and consistent
- Check browser console for CORS errors

### Maintenance

#### Updating the Application

1. Push changes to GitHub repository
2. In Coolify, click "Redeploy" or enable auto-deploy
3. Monitor deployment logs

#### Database Migrations

For schema changes:
1. Update Prisma schema
2. Generate migration: `npx prisma migrate dev`
3. Commit and push changes
4. Coolify will run migrations during deployment

### Security Considerations

1. **Environment Variables:** Never commit sensitive data to repository
2. **Database:** Regular backups are essential
3. **SSL:** Always use HTTPS in production
4. **Updates:** Keep dependencies updated for security patches
5. **Access Control:** Implement proper user roles and permissions

### Support

For issues specific to:
- **Application:** Check logs in Coolify dashboard
- **Domain/SSL:** Verify DNS settings and SSL certificate status
- **Database:** Check persistent volume and file permissions

### Features Available

After deployment, the following features will be available:

- ✅ Estate Management (Tenants, Leases, Payments)
- ✅ Shop Sales Tracking (Cinema, Mobile Money, Charcoal, etc.)
- ✅ Expense Management (Shop & Household Expenses)
- ✅ Asset Management
- ✅ Role-based Access Control
- ✅ UGX Currency Support
- ✅ Comprehensive Reporting

### Default User Roles

The system includes the following roles with specific permissions:
- **Admin:** Full system access
- **Manager:** Estate operations management
- **Accountant:** Financial transactions
- **Shop Manager:** Shop operations
- **Field Staff:** Livestock audits
- **Read Only:** View-only access

---

**Production URL:** https://www.maest.streamlinexperts.rw

**Repository:** https://github.com/Mafende-III/maestms