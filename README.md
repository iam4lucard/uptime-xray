<div align="center" width="100%">
    <img src="./public/icon.svg" width="128" alt="Uptime-Xray Logo" />
    <h1>Uptime-Xray</h1>
    <p><strong>Self-hosted Uptime Monitoring for Xray-Core Configs & Subscriptions</strong></p>
</div>

**Uptime-Xray** is a specialized fork of [Uptime Kuma](https://github.com/louislam/uptime-kuma) enhanced with native, real-world monitoring for **Xray-core proxy nodes, protocol configurations, and subscription links**.

---

## ⭐ Xray-Specific Features

- ⚡ **Full Xray Protocol Support**:
  - **VLESS**: Reality (Vision / gRPC / TCP), TLS, WebSocket, HTTPUpgrade, SplitHTTP
  - **VMess**: TLS, WebSocket, gRPC, TCP, HTTP
  - **Trojan**: TLS, Reality, WebSocket, gRPC
  - **Shadowsocks**: Standard AEAD, 2022, SIP002, Obfs/V2Ray plugins
  - **Hysteria 2 / Hy2**: UDP-based high-speed protocol
  - **TUIC**: QUIC/UDP-based proxy protocol
  - **Raw JSON Client Configs**: Direct Xray multi-outbound configurations
- 🎯 **Real End-to-End Latency & Probing**:
  - Spawns isolated ephemeral Xray-core client instances to tunnel real HTTP/HTTPS requests through the proxy node.
  - Measures true round-trip ping time (ms) and Time-to-First-Byte (TTFB).
  - Customizable target endpoints (Cloudflare 204, Google 204, Gstatic 204, or any custom URL).
- 🌍 **Exit IP & Geo-Location Tracking**:
  - Automatically queries and records the exit IP, ISP, and Country/Location on each heartbeat.
- 📦 **Subscription Link Monitoring**:
  - Tracks subscription URL reachability and HTTP status.
  - Automatically extracts and tracks bandwidth quota (Total / Used / Remaining) and expiration countdown from `subscription-userinfo` headers.
  - Parses and reports the total number of healthy nodes in the subscription.
- 🚀 **Zero-Config Self-Hosting**:
  - Pre-packaged multi-arch Docker image with embedded Xray-core binary.
  - Automatic Xray-core binary detection and auto-downloader for standalone Node.js environments across Linux, macOS, and Windows.

---

## 🔧 Quickstart & Installation

### 🐳 Docker Compose (Recommended)

```yaml
services:
  uptime-xray:
    build:
      context: .
      dockerfile: Dockerfile
    image: uptime-xray:latest
    container_name: uptime-xray
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    ports:
      - "3001:3001"
```

Start the container:
```bash
docker compose up -d
```
Access the dashboard at `http://localhost:3001` or `http://your-server-ip:3001`.

---

### 💻 Standalone Node.js (Linux / macOS / Windows)

Requirements:
- Node.js >= 20.4.0
- npm >= 9.0.0

```bash
# Clone the repository
git clone https://github.com/iam4lucard/uptime-xray.git
cd uptime-xray

# Install dependencies
npm install

# Build frontend assets
npm run build

# Start the server
npm run start-server
```

---

## 🛠️ Adding an Xray Monitor

1. Open the Uptime-Xray dashboard and click **Add New Monitor**.
2. Under **Monitor Type**, choose **Xray Config (VLESS / VMess / Trojan / SS / Hy2)**.
3. Paste your config link (e.g. `vless://...`, `vmess://...`, `trojan://...`, `ss://...`, `hy2://...`) or raw JSON.
4. (Optional) Choose your preferred probe endpoint (Cloudflare 204, Google 204, or custom).
5. (Optional) Toggle **Detect Exit IP & Location on Heartbeat** to record proxy exit locations.
6. Click **Save**.

---

## 🔔 Notifications & Alerts

Supports 90+ notification integrations out of the box (Telegram, Discord, Slack, Pushover, Email, Webhooks, etc.). Get notified immediately when an Xray node or subscription expires, fails TLS handshake, or encounters packet loss.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
