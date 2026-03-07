FROM node:24-alpine
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

LABEL org.opencontainers.image.source=https://github.com/pheever/cy-price-watchdog

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY .yarnrc.yml database/package.json database/yarn.lock ./
RUN yarn install --immutable

COPY database/ .
# Ensure root .yarnrc.yml is used (database's own is empty)
COPY .yarnrc.yml ./

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
