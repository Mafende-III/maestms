# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl-dev curl openssl
# Create comprehensive OpenSSL compatibility
RUN cd /usr/lib && \
    ln -sf libssl.so.3 libssl.so.1.1 && \
    ln -sf libcrypto.so.3 libcrypto.so.1.1 && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib:/lib
ENV OPENSSL_CONF=/usr/lib/ssl/openssl.cnf
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl-dev curl openssl
# Create comprehensive OpenSSL compatibility
RUN cd /usr/lib && \
    ln -sf libssl.so.3 libssl.so.1.1 && \
    ln -sf libcrypto.so.3 libcrypto.so.1.1 && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib:/lib
ENV OPENSSL_CONF=/usr/lib/ssl/openssl.cnf
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create initial database structure (for build-time schema validation)
RUN DATABASE_URL="file:/tmp/build.db" npx prisma db push --accept-data-loss || true

# Build the Next.js application with proper environment variables
ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl-dev curl openssl jq
# Create comprehensive OpenSSL compatibility
RUN cd /usr/lib && \
    ln -sf libssl.so.3 libssl.so.1.1 && \
    ln -sf libcrypto.so.3 libcrypto.so.1.1 && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib:/lib
ENV OPENSSL_CONF=/usr/lib/ssl/openssl.cnf
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy public directory with fallback
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

# Copy startup script
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/startup.sh

# Create directories for SQLite database and backups with proper permissions
RUN mkdir -p /app/data /app/backups && chown -R nextjs:nodejs /app/data /app/backups

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV PRISMA_ENABLE_TRACING=false
ENV PRISMA_DISABLE_WARNINGS=true

# Healthcheck for production monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Initialize database and start server
# Cache busting: 2025-10-20-v4-debug-auth-flow
CMD ["./scripts/startup.sh"]