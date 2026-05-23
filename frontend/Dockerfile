# ═══════════════════════════════════════════════════════════════
# Velox eSIM — Frontend Dockerfile  (multi-stage, Next.js 15)
# ═══════════════════════════════════════════════════════════════
#
#  Stage 1 "deps"     – install all node_modules (needed for build)
#  Stage 2 "builder"  – run next build
#  Stage 3 "runner"   – minimal image with prod-only deps
# ═══════════════════════════════════════════════════════════════

# ─── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
# .npmrc sets legacy-peer-deps=true — must be present BEFORE npm ci
COPY .npmrc* ./

RUN npm ci

# ─── Stage 2: Build Next.js app ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# These are needed at build time so Next.js can inline public env vars.
# They are passed in as build args and will NOT contain secrets.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME="Velox eSIM"
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ─── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Install production dependencies only (no devDeps — keeps image lean)
COPY package*.json ./
COPY .npmrc* ./
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/.next  ./.next
COPY --from=builder /app/public ./public

# Own the Next.js build output as nextjs user
RUN chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

# Health check — wait 30s for Next.js to start before checking
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "\
    require('http').get('http://localhost:3000', (r) => { \
      process.exit(r.statusCode < 500 ? 0 : 1); \
    }).on('error', () => process.exit(1));"

CMD ["npm", "start"]
