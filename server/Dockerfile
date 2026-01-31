FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY server/package.json server/yarn.lock ./
# Skip postinstall - we'll run prisma generate after copying the schema
RUN yarn install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY server/ .
# Copy Prisma schema from database module and config
COPY database/prisma ./prisma
COPY database/prisma.config.ts ./prisma.config.ts

# Generate Prisma client
RUN yarn prisma generate --schema=./prisma/schema.prisma

RUN yarn build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy entrypoint script
COPY --chown=nextjs:nodejs server/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
