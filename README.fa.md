<div align="center" dir="rtl">
  <img src="./public/icon.svg" width="128" height="128" alt="لوگوی Uptime-Xray" />
  <h1>آپتایم ایکس‌ری (Uptime-Xray)</h1>
  <p><strong>سیستم سلف‌هاست مانیتورینگ آپتایم، پینگ واقعی و سلامت کانفیگ‌ها و لینک‌های سابسکریپشن Xray-core</strong></p>

  <p>
    <a href="README.md"><strong>English</strong></a> •
    <a href="README.fa.md"><strong>فارسی</strong></a>
  </p>

  <p>
    <a href="https://github.com/iam4lucard/uptime-xray/releases"><img src="https://img.shields.io/github/v/release/iam4lucard/uptime-xray?style=flat-square&color=blue" alt="نسخه" /></a>
    <a href="https://github.com/iam4lucard/uptime-xray/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="لایسنس" /></a>
    <a href="https://github.com/XTLS/Xray-core"><img src="https://img.shields.io/badge/Xray--core-Inside-6366f1?style=flat-square" alt="Xray-core" /></a>
    <a href="https://github.com/louislam/uptime-kuma"><img src="https://img.shields.io/badge/بر_پایه-Uptime%20Kuma-5cdd8b?style=flat-square" alt="Uptime Kuma" /></a>
  </p>
</div>

---

<div dir="rtl">

## 📖 درباره پروژه

**Uptime-Xray** یک ابزار مانیتورینگ سلف‌هاست و پیشرفته بر پایه **Uptime Kuma** است که به‌طور اختصاصی برای بررسی دقیق، تست پینگ واقعی، وضعیت اتصال و سلامت **کانفیگ‌های پروکسی Xray-core و لینک‌های سابسکریپشن** طراحی شده است.

برخلاف مانیتورهای ساده پورت TCP که تنها باز بودن پورت سرور را بررسی می‌کنند و اتصال واقعی اینترنت را نشان نمی‌دهند، آپتایم ایکس‌ری یک نمونه ایزوله و موقت از موتور رسمی **Xray-core** ایجاد کرده و ترافیک واقعی HTTP/HTTPS را از داخل تونل پروکسی عبور می‌دهد. با این روش، اصالت هندشیک‌های TLS و Reality، زمان پاسخ واقعی (Ping ms) و موقعیت آی‌پی خروجی سرور به دقت سنجیده می‌شوند.

---

## ✨ قابلیت‌ها و ویژگی‌های کلیدی

### ⚡ پشتیبانی کامل از پروتکل‌های Xray
| پروتکل | ویژگی‌ها و ترنسپورت‌های پشتیبانی‌شده |
| :--- | :--- |
| **VLESS** | Reality (شامل Vision، gRPC و TCP)، TLS، WebSocket، HTTPUpgrade، SplitHTTP |
| **VMess** | TLS، WebSocket، gRPC، TCP، HTTP |
| **Trojan** | Reality، TLS، WebSocket، gRPC، TCP |
| **Shadowsocks** | تمام متدهای AEAD، نسخه‌های Shadowsocks 2022، SIP002 و پلاگین‌های Obfs/V2Ray |
| **Hysteria 2** | ترنسپورت پرسرعت UDP، Obfs و TLS |
| **TUIC** | پروتکل مبتنی بر QUIC/UDP |
| **کانفیگ خام JSON** | پشتیبانی از فایل‌ها و آبجکت‌های کامل کلاینت Xray با چندین Outbound |

---

### 🎯 موتور پروب واقعی و دقیق اینترنت
- **تست اتصال واقعی (End-to-End)**: ارسال ریکوئست واقعی HTTP/HTTPS از طریق پروکسی به اینترنت برای اطمینان از عبور داده.
- **تارگت‌های آماده و سفارشی**: امکان انتخاب سریع تارگت‌های `Cloudflare 204`، `Google 204` و `Gstatic 204` یا وارد کردن آدرس سفارشی.
- **اندازه‌گیری دقیق تأخیر و پینگ**: محاسبه میلی‌ثانیه‌ای زمان پینگ واقعی (RTT) و زمان اولین بایت (TTFB).
- **تشخیص آی‌پی خروجی و موقعیت مکانی (Exit IP & Geo)**: ثبت خودکار آی‌پی واقعی خروجی، کشور و ISP در هر هارت‌بیت.

---

### 📦 مانیتورینگ لینک‌های سابسکریپشن (Subscription)
- **بررسی در دسترس بودن لینک**: نظارت مداوم بر آپتایم و وضعیت URL سابسکریپشن.
- **استخراج حجم و تاریخ انقضا**: خواندن و پردازش خودکار هدر `subscription-userinfo` برای نمایش ترافیک مصرفی، باقیمانده، درصد مصرف و روزهای مانده تا پایان اعتبار.
- **تفکیک نودها**: شمارش نودهای سالم موجود در سابسکریپشن و دسته‌بندی آن‌ها بر اساس پروتکل.
- **User-Agent سفارشی**: امکان تعیین هدر نرم‌افزارهای کلاینت (مانند `v2rayng`، `ClashforWindows`، `sing-box`).

---

### 🔔 بیش از ۹۰ سرویس نوتیفیکیشن و هشدار
دریافت آنی هشدارها در **تلگرام (Telegram)، دیسکورد (Discord)، ایمیل (SMTP)، اسلک (Slack)، وبهوک (Webhook)** و ده‌ها سرویس دیگر به محض قطع شدن یک سرور، خطای اعتبارسنجی Reality یا نزدیک شدن به پایان حجم/انقضا.

---

## 🚀 راهنمای نصب و راه‌اندازی سریع

### روش ۱: استفاده از داکر کامپوز (پیشنهادی)

یک فایل `compose.yaml` با محتوای زیر بسازید:

```yaml
services:
  uptime-xray:
    image: ghcr.io/iam4lucard/uptime-xray:latest
    # یا بیلد مستقیم از سورس:
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

سپس کانتینر را اجرا کنید:
```bash
docker compose up -d
```
اکنون داشبورد از طریق آدرس **`http://localhost:3001`** (یا آی‌پی سرور شما) در دسترس است.

---

### روش ۲: دستور مستقیم داکر (Docker CLI)

```bash
docker run -d \
  --name uptime-xray \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  ghcr.io/iam4lucard/uptime-xray:latest
```

---

### روش ۳: اجرای بدون داکر در Node.js (لینوکس / مک / ویندوز)

#### پیش‌نیازها:
- **Node.js**: نسخه `20.4.0` یا بالاتر
- **npm**: نسخه `9.0.0` یا بالاتر
- **Git**

```bash
# ۱. کلون کردن مخزن
git clone https://github.com/iam4lucard/uptime-xray.git
cd uptime-xray

# ۲. نصب پکیج‌ها
npm install

# ۳. بیلد فایل‌های فرانت‌اند
npm run build

# ۴. اجرای سرور
npm run start-server
```

> [!NOTE]
> در اجرای مستقیم با Node.js، آپتایم ایکس‌ری به‌طور خودکار باینری `xray` موجود در سیستم را شناسایی کرده یا در صورت نبود، آخرین نسخه رسمی متناسب با سیستم‌عامل و معماری پردازنده شما را دانلود می‌کند.

---

## 💡 راهنمای استفاده

### ۱. مانیتور کردن یک کانفیگ Xray
1. در داشبورد روی دکمه **افزودن مانیتور جدید (Add New Monitor)** کلیک کنید.
2. در منوی **نوع مانیتور (Monitor Type)** گزینه **Xray Config (VLESS / VMess / Trojan / SS / Hy2)** را انتخاب نمایید.
3. لینک کانفیگ خود (مانند `vless://...`، `vmess://...`، `trojan://...` یا JSON خام) را در کادر متنی قرار دهید.
   - *کارت پیش‌نمایش زنده فوراً پروتکل، آدرس سرور، پورت و ریمارک را به شما نشان می‌دهد.*
4. آدرس پروب (تست) مورد نظر خود را انتخاب کنید (پیش‌فرض: Cloudflare 204 یا Google 204).
5. (اختیاری) گزینه **Detect Exit IP & Location on Heartbeat** را فعال کنید تا آی‌پی خروجی و کشور ثبت شود.
6. اینتروال زمانی را تعیین کرده و روی **ذخیره (Save)** کلیک کنید.

### ۲. مانیتور کردن سابسکریپشن
1. روی **افزودن مانیتور جدید** کلیک کنید.
2. گزینه **Xray Subscription** را انتخاب کنید.
3. آدرس لینک سابسکریپشن را در کادر **Subscription URL** وارد کنید.
4. در صورت نیاز کلاینت User-Agent را مشخص نمایید.
5. روی **ذخیره** کلیک کنید.

---

## 🏗️ معماری سیستم

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

## 🤝 مشارکت در پروژه

از مشارکت‌ها، ثبت ایشو و پیشنهادات شما برای بهبود این پروژه استقبال می‌کنیم!
می‌توانید به [صفحه Issues](https://github.com/iam4lucard/uptime-xray/issues) مراجعه نمایید.

---

## 📜 لایسنس

این پروژه تحت [لایسنس MIT](./LICENSE) و بر پایه [Uptime Kuma](https://github.com/louislam/uptime-kuma) توسعه یافته است.

</div>
