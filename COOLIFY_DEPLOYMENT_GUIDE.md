# 🚀 Coolify Deployment Guide
*Mafende Estate Management System - Development & Production Environments*

## 🌟 **Multi-Environment Strategy**

This guide covers deployment of **two separate environments**:
- **🔧 Development Environment**: Testing and feature development
- **🚀 Production Environment**: Live system for end users

**Benefits:**
- ✅ Safe testing without affecting production
- ✅ Feature validation before production deployment
- ✅ Separate databases and configurations
- ✅ Independent scaling and monitoring

## 📋 **Pre-Deployment Checklist**

### **Repository Setup**
- ✅ Clean codebase with production Dockerfile
- ✅ Enhanced startup script with logging
- ✅ Production-ready environment configuration
- ✅ Debug logging disabled in production

### **Coolify Server Requirements**
- **Minimum**: 2GB CPU, 2GB RAM, 20GB Storage
- **Recommended**: 4GB CPU, 4GB RAM, 50GB Storage
- **OS**: Ubuntu 20.04+ or similar Linux distribution

---

## 🎯 **Step-by-Step Deployment**

### **Step 1: Create Applications in Coolify**

You'll create **TWO separate applications** in Coolify:

#### **🔧 Development Environment**
1. **Login to Coolify Dashboard**
2. **Click "Applications" → "New Application"**
3. **Name**: `estate-management-dev`
4. **Select "Git Repository"**
5. **Configure Repository:**
   ```
   Repository: https://github.com/Mafende-III/maestms.git
   Branch: main
   Build Pack: Dockerfile
   ```

#### **🚀 Production Environment**
1. **Click "Applications" → "New Application"**
2. **Name**: `estate-management-prod`
3. **Select "Git Repository"**
4. **Configure Repository:**
   ```
   Repository: https://github.com/Mafende-III/maestms.git
   Branch: main
   Build Pack: Dockerfile
   ```

> **Note**: Both environments use the same repository but different configurations

### **Step 2: Configure Build Settings**

#### **🔧 Development Environment**
1. **Dockerfile Configuration:**
   ```
   Dockerfile Location: ./Dockerfile
   Docker Build Context: .
   ```

2. **Build Arguments:**
   ```
   NODE_ENV=development
   ```

#### **🚀 Production Environment**
1. **Dockerfile Configuration:**
   ```
   Dockerfile Location: ./Dockerfile.production
   Docker Build Context: .
   ```

2. **Build Arguments:**
   ```
   NODE_ENV=production
   ```

### **Step 3: Configure Persistent Storage**

⚠️ **CRITICAL**: This prevents database loss on redeployments

#### **🔧 Development Environment**
1. **Go to "Storage" Tab**
2. **Click "Add Volume"**
3. **Database Volume Configuration:**
   ```
   Name: estate-dev-database
   Source Path: /data/estate-dev-db
   Destination Path: /app/data
   ```

4. **Logs Volume Configuration:**
   ```
   Name: estate-dev-logs
   Source Path: /data/estate-dev-logs
   Destination Path: /app/logs
   ```

#### **🚀 Production Environment**
1. **Go to "Storage" Tab**
2. **Click "Add Volume"**
3. **Database Volume Configuration:**
   ```
   Name: estate-prod-database
   Source Path: /data/estate-prod-db
   Destination Path: /app/data
   ```

4. **Logs Volume Configuration:**
   ```
   Name: estate-prod-logs
   Source Path: /data/estate-prod-logs
   Destination Path: /app/logs
   ```

> **Important**: Different source paths ensure complete data isolation between environments

### **Step 4: Environment Variables**

#### **🔧 Development Environment Variables**
```bash
# Application Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
NEXT_PRIVATE_STANDALONE=true

# Database Configuration
DATABASE_URL=file:/app/data/dev.db

# Prisma Configuration
PRISMA_ENABLE_TRACING=true
PRISMA_DISABLE_WARNINGS=false

# Authentication Configuration
NEXTAUTH_SECRET=dev-32-character-secret-for-testing
NEXTAUTH_URL=http://estate-dev.yourdomain.com
NEXT_PUBLIC_APP_URL=http://estate-dev.yourdomain.com

# Server Configuration
PORT=3000
HOSTNAME=0.0.0.0

# Debug Configuration (Development Only)
DEBUG=true
LOG_LEVEL=debug
```

#### **🚀 Production Environment Variables**
```bash
# Application Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PRIVATE_STANDALONE=true

# Database Configuration
DATABASE_URL=file:/app/data/prod.db

# Prisma Configuration
PRISMA_ENABLE_TRACING=false
PRISMA_DISABLE_WARNINGS=true

# Authentication Configuration
NEXTAUTH_SECRET=your-secure-32-character-secret-here
NEXTAUTH_URL=http://maestms.streamlinexperts.rw
NEXT_PUBLIC_APP_URL=http://maestms.streamlinexperts.rw

# Server Configuration
PORT=3000
HOSTNAME=0.0.0.0
```

**Important Notes:**
- **🔧 Development**: Use separate database file (`dev.db`) and different domain
- **🚀 Production**: Replace `NEXTAUTH_SECRET` with a secure 32+ character string
- **Domains**: Update URLs to match your actual domains for each environment
- **Security**: Never use development secrets in production
- **Runtime**: Set all variables as "Available at Runtime" in Coolify

### **Step 5: Configure Domains**

#### **🔧 Development Environment Domains**
1. **Primary Domain:**
   ```
   Domain: estate-dev.yourdomain.com
   ```

2. **Secondary Domain (if needed):**
   ```
   Domain: dev-your-sslip-io-domain.sslip.io
   ```

#### **🚀 Production Environment Domains**
1. **Primary Domain:**
   ```
   Domain: maestms.streamlinexperts.rw
   ```

2. **Secondary Domain (if needed):**
   ```
   Domain: your-sslip-io-domain.sslip.io
   ```

#### **SSL Configuration (Both Environments)**
- Enable "Auto SSL" for automatic HTTPS certificates
- Configure DNS settings to point to your Coolify server
- Ensure different subdomains for complete environment isolation

### **Step 6: Health Check Configuration**

**Health Check Settings:**
```
Health Check URL: /api/health
Health Check Interval: 30s
Health Check Timeout: 10s
Health Check Retries: 3
Start Period: 60s
```

### **Step 7: Resource Limits**

**Recommended Settings:**
```
CPU Limit: 1000m (1 CPU core)
Memory Limit: 1Gi
Memory Reservation: 512Mi
```

---

## 🔧 **Advanced Configuration**

### **Container User Access**
The production Dockerfile includes:
- ✅ `nextjs` user with sudo access for troubleshooting
- ✅ Root access available via `sudo` for debugging
- ✅ All necessary tools: `curl`, `jq`, `sqlite`, `nano`, `htop`

### **Logging Configuration**
- **Application Logs**: Available in Coolify dashboard
- **Startup Logs**: Written to `/app/logs/startup.log`
- **Server Logs**: Piped to startup log file
- **Access**: Use terminal to view logs: `tail -f /app/logs/startup.log`

### **Database Management**
- **Location**: `/app/data/prod.db` (persistent volume)
- **Backups**: Automatic backups created on startup
- **Backup Location**: `/app/data/backup_YYYYMMDD_HHMMSS.db`
- **Retention**: Last 3 backups automatically retained

### **Terminal Access**
```bash
# Access container terminal in Coolify UI
# User: nextjs (with sudo access)

# Check application status
sudo systemctl status
ps aux | grep node

# View logs
tail -f /app/logs/startup.log

# Database operations
sqlite3 /app/data/prod.db ".tables"

# System monitoring
htop
df -h
```

---

## ✅ **Post-Deployment Verification**

### **1. Health Check**
```bash
curl -f http://your-domain/api/health
# Expected: {"status":"healthy",...}
```

### **2. Application Access**

#### **🔧 Development Environment**
- **URL**: http://estate-dev.yourdomain.com
- **Login Page**: Should load without errors
- **Credentials**: admin@mafende.com / Admin123!

#### **🚀 Production Environment**
- **URL**: http://maestms.streamlinexperts.rw
- **Login Page**: Should load without errors
- **Credentials**: admin@mafende.com / Admin123!

### **3. Database Verification**

#### **🔧 Development Environment**
```bash
# In container terminal
ls -la /app/data/
# Should show: dev.db and backup files
```

#### **🚀 Production Environment**
```bash
# In container terminal
ls -la /app/data/
# Should show: prod.db and backup files
```

### **4. Log Verification**
```bash
# Check startup logs
tail -20 /app/logs/startup.log
# Should show: successful database initialization and server start
```

---

## 🔄 **Maintenance & Updates**

### **Code Updates**
1. Push changes to GitHub repository
2. Coolify will auto-deploy on push (if enabled)
3. Database and logs persist across deployments

### **Database Backup**

#### **🔧 Development Environment**
```bash
# Manual backup
cp /app/data/dev.db /app/data/manual_backup_dev_$(date +%Y%m%d).db
```

#### **🚀 Production Environment**
```bash
# Manual backup
cp /app/data/prod.db /app/data/manual_backup_prod_$(date +%Y%m%d).db
```

### **Log Rotation**
```bash
# Clear old logs (keep startup.log)
sudo truncate -s 0 /app/logs/startup.log
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Database Access Denied**
   ```bash
   # Check permissions
   ls -la /app/data/
   # Fix if needed
   sudo chown -R nextjs:nodejs /app/data/
   ```

2. **Server Won't Start**
   ```bash
   # Check startup logs
   tail -50 /app/logs/startup.log
   # Restart container from Coolify UI
   ```

3. **Login Issues**

   **🔧 Development Environment:**
   ```bash
   # Verify database has users
   sqlite3 /app/data/dev.db "SELECT COUNT(*) FROM User;"
   # Re-seed if needed
   npx prisma db seed
   ```

   **🚀 Production Environment:**
   ```bash
   # Verify database has users
   sqlite3 /app/data/prod.db "SELECT COUNT(*) FROM User;"
   # Re-seed if needed
   npx prisma db seed
   ```

### **Emergency Recovery**

#### **🔧 Development Environment**
```bash
# Restore from backup
cp /app/data/backup_YYYYMMDD_HHMMSS.db /app/data/dev.db
# Restart container from Coolify UI
```

#### **🚀 Production Environment**
```bash
# Restore from backup
cp /app/data/backup_YYYYMMDD_HHMMSS.db /app/data/prod.db
# Restart container from Coolify UI
```

---

## 🔐 **Security Considerations**

- ✅ Debug endpoints disabled in production
- ✅ Authentication logging minimized
- ✅ Database access restricted to application
- ✅ Secure environment variable handling
- ✅ HTTPS enforcement (when SSL configured)

---

## 📞 **Support Information**

**Admin Credentials:**
- Email: admin@mafende.com
- Password: Admin123!
- Role: ADMIN

**System Information:**
- Framework: Next.js 14.2.33
- Database: SQLite with Prisma ORM
- Authentication: NextAuth.js
- Container: Alpine Linux with Node.js 20

*This deployment guide ensures a production-ready, maintainable, and scalable estate management system deployment on Coolify.*