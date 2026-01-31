FROM golang:1.25 AS builder

WORKDIR /app

COPY . .

RUN make build

FROM alpine

RUN apk add --no-cache ca-certificates tzdata

USER nobody

WORKDIR /app

COPY --from=builder --chown=nobody:nobody /app/dist/scraper .

ENTRYPOINT [ "./scraper" ]