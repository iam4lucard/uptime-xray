<div align="center">
  <img src="./public/icon.svg" width="128" height="128" alt="Uptime-Xray Logo" />
  <h1>Uptime-Xray</h1>
  <p><strong>Self-hosted Uptime & Performance Monitoring for Xray-Core Configs & Subscriptions</strong></p>

  <p>
    <a href="README.md"><strong>English</strong></a> •
    <a href="README.fa.md"><strong>فارسی</strong></a>
  </p>

  <p>
    <a href="https://github.com/iam4lucard/uptime-xray/releases"><img src="https://img.shields.io/github/v/release/iam4lucard/uptime-xray?style=flat-square&color=blue" alt="Release" /></a>
    <a href="https://github.com/iam4lucard/uptime-xray/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
    <a href="https://github.com/XTLS/Xray-core"><img src="https://img.shields.io/badge/Xray--core-Inside-6366f1?style=flat-square" alt="Xray-core" /></a>
    <a href="https://github.com/louislam/uptime-kuma"><img src="https://img.shields.io/badge/based%20on-Uptime%20Kuma-5cdd8b?style=flat-square" alt="Uptime Kuma" /></a>
  </p>
</div>

---

## 📖 About Uptime-Xray

**Uptime-Xray** is a self-hosted monitoring platform based on **Uptime Kuma**, purpose-built for checking the availability, real-world latency, and health of **Xray-core proxy nodes, configurations, and subscription links**.

Unlike simple TCP port pingers that only check if a port is open, Uptime-Xray spawns an isolated, sandboxed **Xray-core runtime instance** to route actual HTTP/HTTPS probe traffic through the proxy tunnel, validating full TLS/Reality handshakes, measuring exact response times, and capturing exit IP metadata.

---

## ✨ Features

### ⚡ Supported Protocols & Configurations
| Protocol | Transports & Features Supported |
| :--- | :--- |
| **VLESS** | Reality (Vision, TCP, gRPC), TLS, WebSocket, HTTPUpgrade, SplitHTTP |
| **VMess** | TLS, WebSocket, gRPC, TCP, HTTP |
| **Trojan** | Reality, TLS, WebSocket, gRPC, TCP |
| **Shadowsocks** | AEAD, Shadowsocks 2022, SIP002, Obfs/V2Ray plugins |
| **Hysteria 2** | High-performance UDP transport, Obfs, TLS |
| **TUIC** | QUIC/UDP-based proxy protocol |
| **Raw JSON** | Full custom Xray client multi-outbound configurations |

---

### 🎯 Real End-to-End Probing Engine
- **True Connectivity Check**: Sends real HTTP/HTTPS requests through the proxy node to ensure it can actually reach the internet.
- **Custom Target Endpoints**: Preset with `Cloudflare (204)`, `Google (204)`, and `Gstatic (204)`, or configure your own test endpoint.
- **Accurate Latency Metrics**: Measures true round-trip ping time (ms) and Time-to-First-Byte (TTFB).
- **Exit IP & Geo Detection**: Automatically identifies the proxy exit IP, ISP, and Country on each heartbeat.

---

### 📦 Subscription Link Monitoring
- **Link Availability**: Continuously monitors the uptime of your subscription URLs.
- **Quota & Expiry Tracking**: Automatically extracts traffic consumption (`Upload`, `Download`, `Total`, `Remaining %`) and expiration date countdowns from `subscription-userinfo` response headers.
- **Node Breakdown**: Parses and counts active nodes and categorizes them by protocol.
- **Custom User-Agent**: Configurable client User-Agent headers (e.g. `v2rayng`, `ClashforWindows`, `sing-box`).

---

### 🔔 90+ Notification Providers
Get instant alerts via **Telegram, Discord, Slack, Pushover, Webhooks, Email (SMTP)**, and many more whenever a node goes down, fails Reality authentication, or reaches its quota threshold.

---

## 🚀 Quickstart & Installation

### Option 1: Docker Compose (Recommended)

Create a `compose.yaml` file:

```yaml
services:
  uptime-xray:
    image: ghcr.io/iam4lucard/uptime-xray:latest
    # Or build locally:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
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
Access the dashboard at **`http://localhost:3001`** (or your server's IP address).

---

### Option 2: Docker CLI

```bash
docker run -d \
  --name uptime-xray \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  ghcr.io/iam4lucard/uptime-xray:latest
```

---

### Option 3: Standalone Node.js (Linux / macOS / Windows)

#### Prerequisites:
- **Node.js**: `>= 20.4.0`
- **npm**: `>= 9.0.0`
- **Git**

```bash
# 1. Clone repository
git clone https://github.com/iam4lucard/uptime-xray.git
cd uptime-xray

# 2. Install dependencies
npm install

# 3. Build frontend bundle
npm run build

# 4. Start the server
npm run start-server
```

> [!NOTE]
> When running standalone, Uptime-Xray will automatically detect any existing `xray` binary on your system or automatically download the official binary for your operating system and architecture into `./data/xray-core/`.

---

## 💡 How to Use

### 1. Monitoring an Xray Config (Node)
1. In the dashboard, click **Add New Monitor**.
2. Select **Monitor Type** $\rightarrow$ **Xray Config (VLESS / VMess / Trojan / SS / Hy2)**.
3. Paste your configuration link (e.g. `vless://...`, `vmess://...`, `trojan://...`, `hy2://...`) or raw JSON.
   - *A live preview card will automatically display the detected protocol, server host, port, and remark.*
4. Select your **Target Probe URL** (e.g. Cloudflare 204 or Google 204).
5. (Optional) Check **Detect Exit IP & Location on Heartbeat**.
6. Set your monitoring interval and click **Save**.

### 2. Monitoring a Subscription
1. Click **Add New Monitor**.
2. Select **Monitor Type** $\rightarrow$ **Xray Subscription**.
3. Enter your **Subscription URL**.
4. (Optional) Specify a custom **Client User-Agent** if your provider requires it.
5. Click **Save**.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Uptime-Xray Core                     │
│                                                        │
│  ┌──────────────────┐          ┌────────────────────┐  │
│  │   Vue 3 Frontend │ ◄──────► │ Express + Socket.io│  │
│  └──────────────────┘          └─────────┬──────────┘  │
│                                          │             │
│                        ┌─────────────────┴──────────┐  │
│                        │     Xray Probe Runner      │  │
│                        └─────────┬──────────────────┘  │
│                                  │                     │
│                        ┌─────────┴──────────┐          │
│                        │ Ephemeral Sandbox  │          │
│                        │ (Dynamic Inbounds) │          │
│                        └─────────┬──────────┘          │
└──────────────────────────────────┼─────────────────────┘
                                   │
                                   ▼
                   ┌──────────────────────────────┐
                   │       Xray-core Binary       │
                   │  (VLESS / VMess / Trojan...) │
                   └───────────────┬──────────────┘
                                   │
                                   ▼
                   ┌──────────────────────────────┐
                   │    Target HTTP(S) Endpoint   │
                   │    (Cloudflare / Google 204) │
                   └──────────────────────────────┘
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/iam4lucard/uptime-xray/issues).

---

## 📜 License

This project is open-sourced under the [MIT License](./LICENSE). Based on [Uptime Kuma](https://github.com/louislam/uptime-kuma).
