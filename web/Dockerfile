FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

COPY .yarnrc.yml web/package.json web/yarn.lock ./
RUN yarn install --immutable

COPY web/ .
RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
