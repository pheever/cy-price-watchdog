FROM node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

FROM base AS builder
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Install dependencies (skip postinstall - we'll run prisma generate after copying the schema)
COPY .yarnrc.yml api/package.json api/yarn.lock ./
RUN yarn install --immutable --mode=skip-build

COPY api/ .
# Copy Prisma schema from database module and config
COPY database/prisma ./prisma
COPY database/prisma.config.ts ./prisma.config.ts

# Generate Prisma client
RUN yarn prisma generate --schema=./prisma/schema.prisma

RUN yarn build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy entrypoint script
COPY --chown=nextjs:nodejs api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
