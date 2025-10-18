# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl-dev curl
RUN cd /usr/lib && ln -sf libssl.so.3 libssl.so.1.1 && ln -sf libcrypto.so.3 libcrypto.so.1.1
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl-dev curl
RUN cd /usr/lib && ln -sf libssl.so.3 libssl.so.1.1 && ln -sf libcrypto.so.3 libcrypto.so.1.1
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl-dev curl
RUN cd /usr/lib && ln -sf libssl.so.3 libssl.so.1.1 && ln -sf libcrypto.so.3 libcrypto.so.1.1
# Additional OpenSSL compatibility for Prisma engines
ENV OPENSSL_ROOT_DIR=/usr
ENV LD_LIBRARY_PATH=/usr/lib
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy public directory with fallback
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]