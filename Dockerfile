# Multi-Stage Production Dockerfile for MentorMaze
# Compatible with Render (Web & Worker), Fly.io, AWS ECS, Google Cloud Run

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Install dependencies based on the lockfile
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time flags to disable telemetry and enable build mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV USE_MEMORY_DB=true
ENV NEXT_PHASE=phase-production-build

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permissions for cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built application & dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

USER nextjs

EXPOSE 3000

# Default command: Web Service (Override with `npm run start:worker` for Background Worker)
CMD ["npm", "start"]
