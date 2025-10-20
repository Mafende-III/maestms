#!/bin/bash

# Enhanced startup script for production deployment
# Includes comprehensive logging and error handling

set -e  # Exit on any error

# Logging configuration
LOG_FILE="/app/logs/startup.log"
mkdir -p /app/logs

# Function for logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    # Try to append to log file, but don't fail if it doesn't work
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE 2>/dev/null || true
}

log "🚀 Starting Mafende Estate Management System"
log "📊 Environment: $NODE_ENV"
log "🗂️  Database URL: $DATABASE_URL"
log "👤 Current user: $(whoami)"
log "📁 Working directory: $(pwd)"

# Ensure data directory exists with correct permissions
log "📂 Setting up data directories..."
sudo mkdir -p /app/data /app/logs
sudo chown -R nextjs:nodejs /app/data /app/logs
log "✅ Data directories configured"

# Get database file path from environment
DB_FILE="${DATABASE_URL#file:}"
log "🗄️  Database file path: $DB_FILE"

# Ensure database directory exists
DB_DIR=$(dirname "$DB_FILE")
if [ ! -d "$DB_DIR" ]; then
    log "📁 Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR"
    chown nextjs:nodejs "$DB_DIR"
fi

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    log "🔄 No existing database found. Initializing new database..."

    # Create database schema using local Prisma (not npx)
    log "🗄️  Creating database schema..."
    ./node_modules/.bin/prisma db push --accept-data-loss

    # Seed database with admin user
    log "🌱 Seeding database with admin user..."
    node prisma/seed.js

    # Verify database creation
    if [ -f "$DB_FILE" ]; then
        log "✅ Database created successfully"
        log "📊 Database size: $(ls -lh "$DB_FILE" | awk '{print $5}')"
    else
        log "❌ Database creation failed"
        exit 1
    fi
else
    log "📦 Existing database found"
    log "📊 Database size: $(ls -lh "$DB_FILE" | awk '{print $5}')"
    log "📅 Last modified: $(ls -l "$DB_FILE" | awk '{print $6, $7, $8}')"

    # Create backup of existing database
    BACKUP_FILE="${DB_DIR}/backup_$(date +%Y%m%d_%H%M%S).db"
    cp "$DB_FILE" "$BACKUP_FILE"
    log "💾 Database backed up to: $BACKUP_FILE"

    # Keep only last 3 backups
    ls -t "${DB_DIR}"/backup_*.db 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
fi

# Test database connection
log "🔍 Testing database connection..."
if ./node_modules/.bin/prisma db execute --stdin <<< "SELECT COUNT(*) FROM User;" >/dev/null 2>&1; then
    log "✅ Database connection successful"
else
    log "❌ Database connection failed"
    exit 1
fi

# Display system information
log "💻 System Information:"
log "   - Node.js version: $(node --version)"
log "   - NPM version: $(npm --version)"
log "   - Available memory: $(free -h | grep Mem | awk '{print $7}')"
log "   - Disk space: $(df -h /app | tail -1 | awk '{print $4}')"

# Start the Next.js server
log "🚀 Starting Next.js server..."
log "🌐 Server will be available at: http://localhost:3000"
log "🔐 Admin credentials: admin@mafende.com / Admin123!"

# Execute the server
if [ -w "$LOG_FILE" ]; then
    exec node server.js 2>&1 | tee -a $LOG_FILE
else
    exec node server.js
fi