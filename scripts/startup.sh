#!/bin/sh

# Ensure data directory exists (permissions already set in Dockerfile)
mkdir -p /app/data /app/backups

# Initialize database on first startup
if [ ! -f /app/data/prod.db ]; then
    echo "🔄 Initializing new database..."
    npx prisma db push --accept-data-loss

    echo "🌱 Seeding database..."
    npx prisma db seed

    echo "✅ Database initialization complete"
else
    echo "📦 Database exists, skipping migrations..."
    # Skip migrations for now to avoid hanging
    # npx prisma migrate deploy --schema=/app/prisma/schema.prisma 2>/dev/null || true

    # Quick backup (keep last 3 backups)
    BACKUP_FILE="/app/backups/prod_$(date +%Y%m%d_%H%M%S).db"
    cp /app/data/prod.db "$BACKUP_FILE" 2>/dev/null || echo "⚠️ Backup failed, continuing..."
    echo "💾 Database backed up to $BACKUP_FILE"

    # Keep only last 3 backups
    ls -t /app/backups/*.db 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
fi

# Start the Next.js server
echo "🚀 Starting server..."
exec node server.js