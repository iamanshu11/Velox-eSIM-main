# ═══════════════════════════════════════════════════════════════
# Velox eSIM — Backend Dockerfile  (multi-stage)
# ═══════════════════════════════════════════════════════════════
#
#  Stage 1 "builder"  – installs ALL deps, generates Prisma client,
#                       compiles TypeScript → dist/
#  Stage 2 "runner"   – copies only dist/ + production node_modules
#                       for a lean production image
# ═══════════════════════════════════════════════════════════════

# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:20-alpine AS builder

# openssl is required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy manifests first — npm ci layer is cached when only src changes
COPY package*.json ./
COPY prisma ./prisma/
# .npmrc sets legacy-peer-deps=true — must be present BEFORE npm ci runs
COPY .npmrc* ./

# Install ALL dependencies (devDeps needed for tsc, ts-node, etc.)
RUN npm ci

# Generate Prisma client from schema
# (no real DB needed — generate only reads the schema file)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate

# Copy the rest of the source
COPY . .

# Compile TypeScript → dist/
# (prebuild in package.json also runs prisma generate — that is fine)
RUN npm run build

# ─── Stage 2: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy manifests + prisma schema (prisma schema needed for db push at startup)
COPY package*.json ./
COPY prisma ./prisma/
# .npmrc must be present before npm ci
COPY .npmrc* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (built in Stage 1)
COPY --from=builder /app/node_modules/.prisma        ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose API port
EXPOSE 5000

# Health check — server has 30 s to become ready before checks begin
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "\
    require('http').get('http://localhost:5000/health', (r) => { \
      process.exit(r.statusCode === 200 ? 0 : 1); \
    }).on('error', () => process.exit(1));"

# Sync DB schema then start the compiled server
CMD ["sh", "-c", "npx prisma db push --url \"$DATABASE_URL\" && node dist/index.js"]
