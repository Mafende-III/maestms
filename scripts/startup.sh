#!/bin/sh

# Initialize database on first startup
if [ ! -f /app/data/prod.db ]; then
    echo "🔄 Initializing database..."
    npx prisma db push --accept-data-loss

    echo "🌱 Seeding database..."
    npx prisma db seed

    echo "✅ Database initialization complete"
else
    echo "📦 Database already exists, skipping initialization"
fi

# Start the Next.js server
echo "🚀 Starting server..."
exec node server.js