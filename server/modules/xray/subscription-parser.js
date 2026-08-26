/**
 * Xray Subscription Parser
 * Fetches subscription links, parses user info (bandwidth/expiry), and extracts nodes.
 */

const axios = require("axios");
const { safeBase64Decode, parseXrayConfig, detectProtocol } = require("./uri-parser");

/**
 * Format byte count to human-readable string (GB, MB)
 * @param {number} bytes Bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Parse subscription-userinfo header string
 * e.g. "upload=1073741824; download=5368709120; total=107374182400; expire=1767225600"
 * @param {string} header Header value
 * @returns {object|null} Parsed subscription quota info
 */
function parseSubscriptionUserInfo(header) {
    if (!header || typeof header !== "string") return null;

    const result = {
        upload: 0,
        download: 0,
        used: 0,
        total: 0,
        remaining: 0,
        expire: null,
        expireDate: null,
        daysRemaining: null,
        usedPercentage: 0,
        formattedUsed: "",
        formattedTotal: "",
        formattedRemaining: "",
    };

    const parts = header.split(";");
    for (const part of parts) {
        const [key, val] = part.trim().split("=");
        if (!key || val === undefined) continue;

        const numVal = parseInt(val.trim());
        if (key.toLowerCase() === "upload") {
            result.upload = numVal;
        } else if (key.toLowerCase() === "download") {
            result.download = numVal;
        } else if (key.toLowerCase() === "total") {
            result.total = numVal;
        } else if (key.toLowerCase() === "expire") {
            result.expire = numVal;
        }
    }

    result.used = result.upload + result.download;
    result.remaining = Math.max(0, result.total - result.used);

    if (result.total > 0) {
        result.usedPercentage = Math.min(100, Math.round((result.used / result.total) * 100));
    }

    result.formattedUsed = formatBytes(result.used);
    result.formattedTotal = formatBytes(result.total);
    result.formattedRemaining = formatBytes(result.remaining);

    if (result.expire && result.expire > 0) {
        const expireMs = result.expire > 1e11 ? result.expire : result.expire * 1000;
        result.expireDate = new Date(expireMs).toISOString();
        const diffMs = expireMs - Date.now();
        result.daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return result;
}

/**
 * Fetch and parse an Xray subscription
 * @param {string} subUrl Subscription URL
 * @param {string} [userAgent] Custom User-Agent header
 * @param {number} [timeout] Timeout in ms
 * @returns {Promise<object>} Parsed subscription data
 */
async function fetchAndParseSubscription(subUrl, userAgent = "v2rayng/1.8.5", timeout = 15000) {
    if (!subUrl) {
        throw new Error("Missing subscription URL");
    }

    const response = await axios.get(subUrl, {
        timeout,
        headers: {
            "User-Agent": userAgent,
        },
        responseType: "text",
    });

    const userInfoHeader = response.headers["subscription-userinfo"] || response.headers["Subscription-Userinfo"];
    const userInfo = parseSubscriptionUserInfo(userInfoHeader);

    let rawBody = response.data;
    if (typeof rawBody !== "string") {
        rawBody = String(rawBody);
    }

    let decodedBody = rawBody.trim();
    // Try base64 decoding if the body doesn't start with known protocol schemas
    if (!/^(vless|vmess|trojan|ss|hysteria2|hy2|tuic):\/\//i.test(decodedBody)) {
        try {
            decodedBody = safeBase64Decode(decodedBody);
        } catch (_) {
            // Keep original if decode fails
        }
    }

    const lines = decodedBody.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const nodes = [];
    const protocolStats = {};

    for (const line of lines) {
        try {
            const proto = detectProtocol(line);
            if (proto !== "unknown") {
                const parsed = parseXrayConfig(line);
                nodes.push({
                    raw: line,
                    protocol: proto,
                    remark: parsed.remark,
                    server: parsed.server,
                    port: parsed.port,
                });
                protocolStats[proto] = (protocolStats[proto] || 0) + 1;
            }
        } catch (_) {
            // Ignore invalid individual line in subscription
        }
    }

    return {
        success: true,
        statusCode: response.status,
        totalNodes: nodes.length,
        nodes,
        protocolStats,
        userInfo,
    };
}

module.exports = {
    fetchAndParseSubscription,
    parseSubscriptionUserInfo,
    formatBytes,
};
