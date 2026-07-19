# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Image build should not require a live database connection.
RUN npx next build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/scripts/ensure-database.js ./scripts/ensure-database.js
COPY --from=builder /app/scripts/docker-entrypoint.js ./scripts/docker-entrypoint.js
COPY --from=builder /app/package.json ./package.json

USER root
RUN npm install drizzle-kit@0.31.8 postgres drizzle-orm --no-save --omit=dev
USER nextjs

EXPOSE 3000

CMD ["node", "scripts/docker-entrypoint.js"]
