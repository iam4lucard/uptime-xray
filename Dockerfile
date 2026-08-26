FROM node:20-bookworm-slim AS build
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Download Xray-core for target arch
FROM debian:bookworm-slim AS xray-downloader
ARG TARGETARCH
RUN apt-get update && apt-get install -y curl unzip ca-certificates && rm -rf /var/lib/apt/lists/*
RUN set -ex; \
    case "$TARGETARCH" in \
        amd64) XRAY_ARCH="64" ;; \
        arm64) XRAY_ARCH="arm64-v8a" ;; \
        arm) XRAY_ARCH="arm32-v7a" ;; \
        *) XRAY_ARCH="64" ;; \
    esac; \
    curl -sL "https://github.com/XTLS/Xray-core/releases/download/v25.1.30/Xray-linux-${XRAY_ARCH}.zip" -o /tmp/xray.zip; \
    mkdir -p /xray && unzip /tmp/xray.zip -d /xray; \
    chmod +x /xray/xray

FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y dumb-init ca-certificates iputils-ping && rm -rf /var/lib/apt/lists/*

COPY --from=xray-downloader /xray/xray /usr/local/bin/xray
COPY --from=build /app /app

ENV NODE_ENV=production
ENV UPTIME_KUMA_IS_CONTAINER=1
ENV DATA_DIR=/app/data

VOLUME ["/app/data"]
EXPOSE 3001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/server.js"]
