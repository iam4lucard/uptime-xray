/**
 * Xray URI / Link Parser
 * Supports VLESS, VMess, Trojan, Shadowsocks, Hysteria2, TUIC, and raw JSON.
 */

/**
 * Safe Base64 decoder supporting standard and URL-safe Base64
 * @param {string} str Base64 string
 * @returns {string} Decoded string
 */
function safeBase64Decode(str) {
    if (!str) return "";
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4 !== 0) {
        str += "=";
    }
    return Buffer.from(str, "base64").toString("utf-8");
}

/**
 * Parse a VLESS URI link
 * @param {string} uri VLESS URI (e.g. vless://uuid@host:port?...)
 * @returns {object} Outbound config object
 */
function parseVless(uri) {
    const urlObj = new URL(uri);
    const uuid = urlObj.username;
    const host = urlObj.hostname;
    const port = parseInt(urlObj.port) || 443;
    const params = urlObj.searchParams;
    const remark = decodeURIComponent(urlObj.hash.slice(1) || host);

    const security = (params.get("security") || "none").toLowerCase();
    const network = (params.get("type") || "tcp").toLowerCase();
    const flow = params.get("flow") || undefined;
    const encryption = params.get("encryption") || "none";
    const sni = params.get("sni") || host;
    const fp = params.get("fp") || "chrome";
    const pbk = params.get("pbk") || "";
    const sid = params.get("sid") || "";
    const spx = params.get("spx") || "";
    const path = params.get("path") || "/";
    const hostHeader = params.get("host") || sni;
    const serviceName = params.get("serviceName") || "";
    const mode = params.get("mode") || "gun";
    const alpn = params.get("alpn") ? params.get("alpn").split(",") : undefined;

    const streamSettings = {
        network,
        security,
    };

    if (security === "reality") {
        streamSettings.realitySettings = {
            show: false,
            fingerprint: fp,
            serverName: sni,
            publicKey: pbk,
            shortId: sid,
            spiderX: spx,
        };
    } else if (security === "tls") {
        streamSettings.tlsSettings = {
            allowInsecure: params.get("allowInsecure") === "1" || params.get("insecure") === "1",
            serverName: sni,
            fingerprint: fp,
            alpn,
        };
    }

    if (network === "ws") {
        streamSettings.wsSettings = {
            path,
            headers: {
                Host: hostHeader,
            },
        };
    } else if (network === "grpc") {
        streamSettings.grpcSettings = {
            serviceName,
            multiMode: mode === "multi",
        };
    } else if (network === "httpupgrade") {
        streamSettings.httpupgradeSettings = {
            path,
            host: hostHeader,
        };
    } else if (network === "splithttp" || network === "xhttp") {
        streamSettings.splithttpSettings = {
            path,
            host: hostHeader,
        };
    } else if (network === "tcp" && params.get("headerType") === "http") {
        streamSettings.tcpSettings = {
            header: {
                type: "http",
                request: {
                    path: [path],
                    headers: {
                        Host: [hostHeader],
                    },
                },
            },
        };
    }

    return {
        protocol: "vless",
        tag: "proxy",
        remark,
        server: host,
        port,
        settings: {
            vnext: [
                {
                    address: host,
                    port,
                    users: [
                        {
                            id: uuid,
                            encryption,
                            flow: flow || undefined,
                        },
                    ],
                },
            ],
        },
        streamSettings,
    };
}

/**
 * Parse a VMess URI link
 * @param {string} uri VMess URI (vmess://base64)
 * @returns {object} Outbound config object
 */
function parseVmess(uri) {
    const raw = uri.replace(/^vmess:\/\//i, "");
    const decoded = safeBase64Decode(raw);
    let json;
    try {
        json = JSON.parse(decoded);
    } catch (e) {
        throw new Error("Invalid VMess base64 configuration: " + e.message);
    }

    const host = json.add;
    const port = parseInt(json.port) || 443;
    const uuid = json.id;
    const aid = parseInt(json.aid) || 0;
    const scy = json.scy || "auto";
    const net = (json.net || "tcp").toLowerCase();
    const security = (json.tls || "none").toLowerCase();
    const sni = json.sni || json.host || host;
    const fp = json.fp || "chrome";
    const path = json.path || "/";
    const hostHeader = json.host || sni;
    const remark = json.ps || host;

    const streamSettings = {
        network: net,
        security: security === "tls" ? "tls" : "none",
    };

    if (streamSettings.security === "tls") {
        streamSettings.tlsSettings = {
            allowInsecure: json.allowInsecure === 1 || json.allowInsecure === true,
            serverName: sni,
            fingerprint: fp,
            alpn: json.alpn ? json.alpn.split(",") : undefined,
        };
    }

    if (net === "ws") {
        streamSettings.wsSettings = {
            path,
            headers: {
                Host: hostHeader,
            },
        };
    } else if (net === "grpc") {
        streamSettings.grpcSettings = {
            serviceName: path,
            multiMode: false,
        };
    } else if (net === "httpupgrade") {
        streamSettings.httpupgradeSettings = {
            path,
            host: hostHeader,
        };
    } else if (net === "tcp" && json.type === "http") {
        streamSettings.tcpSettings = {
            header: {
                type: "http",
                request: {
                    path: [path],
                    headers: {
                        Host: [hostHeader],
                    },
                },
            },
        };
    }

    return {
        protocol: "vmess",
        tag: "proxy",
        remark,
        server: host,
        port,
        settings: {
            vnext: [
                {
                    address: host,
                    port,
                    users: [
                        {
                            id: uuid,
                            alterId: aid,
                            security: scy,
                        },
                    ],
                },
            ],
        },
        streamSettings,
    };
}

/**
 * Parse a Trojan URI link
 * @param {string} uri Trojan URI (trojan://password@host:port?...)
 * @returns {object} Outbound config object
 */
function parseTrojan(uri) {
    const urlObj = new URL(uri);
    const password = decodeURIComponent(urlObj.username);
    const host = urlObj.hostname;
    const port = parseInt(urlObj.port) || 443;
    const params = urlObj.searchParams;
    const remark = decodeURIComponent(urlObj.hash.slice(1) || host);

    const security = (params.get("security") || "tls").toLowerCase();
    const network = (params.get("type") || "tcp").toLowerCase();
    const sni = params.get("sni") || host;
    const fp = params.get("fp") || "chrome";
    const path = params.get("path") || "/";
    const hostHeader = params.get("host") || sni;
    const serviceName = params.get("serviceName") || "";
    const alpn = params.get("alpn") ? params.get("alpn").split(",") : undefined;

    const streamSettings = {
        network,
        security,
    };

    if (security === "reality") {
        streamSettings.realitySettings = {
            show: false,
            fingerprint: fp,
            serverName: sni,
            publicKey: params.get("pbk") || "",
            shortId: params.get("sid") || "",
            spiderX: params.get("spx") || "",
        };
    } else if (security === "tls") {
        streamSettings.tlsSettings = {
            allowInsecure: params.get("allowInsecure") === "1" || params.get("insecure") === "1",
            serverName: sni,
            fingerprint: fp,
            alpn,
        };
    }

    if (network === "ws") {
        streamSettings.wsSettings = {
            path,
            headers: {
                Host: hostHeader,
            },
        };
    } else if (network === "grpc") {
        streamSettings.grpcSettings = {
            serviceName,
            multiMode: false,
        };
    }

    return {
        protocol: "trojan",
        tag: "proxy",
        remark,
        server: host,
        port,
        settings: {
            servers: [
                {
                    address: host,
                    port,
                    password,
                },
            ],
        },
        streamSettings,
    };
}

/**
 * Parse a Shadowsocks URI link
 * @param {string} uri Shadowsocks URI (ss://...)
 * @returns {object} Outbound config object
 */
function parseShadowsocks(uri) {
    const raw = uri.replace(/^ss:\/\//i, "");
    let userinfo = "";
    let host = "";
    let port = 8388;
    let remark = "";

    const hashIndex = raw.indexOf("#");
    let mainPart = hashIndex !== -1 ? raw.slice(0, hashIndex) : raw;
    if (hashIndex !== -1) {
        remark = decodeURIComponent(raw.slice(hashIndex + 1));
    }

    if (mainPart.includes("@")) {
        const atIndex = mainPart.lastIndexOf("@");
        userinfo = mainPart.slice(0, atIndex);
        const hostPortPart = mainPart.slice(atIndex + 1);

        // Check if userinfo is base64 encoded
        if (userinfo.includes(":")) {
            // plain method:password
        } else {
            userinfo = safeBase64Decode(userinfo);
        }

        const [hostPart, portPart] = hostPortPart.split("?")[0].split(":");
        host = hostPart;
        port = parseInt(portPart) || 8388;
    } else {
        // entire mainPart might be base64 encoded method:password@host:port
        const decoded = safeBase64Decode(mainPart.split("?")[0]);
        if (decoded.includes("@")) {
            const atIndex = decoded.lastIndexOf("@");
            userinfo = decoded.slice(0, atIndex);
            const [hostPart, portPart] = decoded.slice(atIndex + 1).split(":");
            host = hostPart;
            port = parseInt(portPart) || 8388;
        } else {
            throw new Error("Invalid Shadowsocks URI structure");
        }
    }

    const colonIndex = userinfo.indexOf(":");
    if (colonIndex === -1) {
        throw new Error("Invalid Shadowsocks userinfo (expected method:password)");
    }
    const method = userinfo.slice(0, colonIndex);
    const password = userinfo.slice(colonIndex + 1);

    if (!remark) {
        remark = host;
    }

    return {
        protocol: "shadowsocks",
        tag: "proxy",
        remark,
        server: host,
        port,
        settings: {
            servers: [
                {
                    address: host,
                    port,
                    method,
                    password,
                },
            ],
        },
        streamSettings: {
            network: "tcp",
        },
    };
}

/**
 * Parse a Hysteria2 URI link
 * @param {string} uri Hysteria2 URI (hysteria2://pass@host:port?...)
 * @returns {object} Outbound config object
 */
function parseHysteria2(uri) {
    const cleanUri = uri.replace(/^hy2:\/\//i, "hysteria2://");
    const urlObj = new URL(cleanUri);
    const password = decodeURIComponent(urlObj.username);
    const host = urlObj.hostname;
    const port = parseInt(urlObj.port) || 443;
    const params = urlObj.searchParams;
    const remark = decodeURIComponent(urlObj.hash.slice(1) || host);
    const sni = params.get("sni") || host;
    const insecure = params.get("insecure") === "1" || params.get("allowInsecure") === "1";
    const obfs = params.get("obfs");
    const obfsPassword = params.get("obfs-password");

    const settings = {
        servers: [
            {
                address: host,
                port,
                password,
            },
        ],
    };

    if (obfs) {
        settings.obfs = {
            type: obfs,
            password: obfsPassword || "",
        };
    }

    return {
        protocol: "hysteria2",
        tag: "proxy",
        remark,
        server: host,
        port,
        settings,
        streamSettings: {
            network: "udp",
            security: "tls",
            tlsSettings: {
                allowInsecure: insecure,
                serverName: sni,
            },
        },
    };
}

/**
 * Parse any Xray configuration string (URI or JSON)
 * @param {string} input Xray URI or JSON string
 * @returns {object} Normalized outbound configuration object
 */
function parseXrayConfig(input) {
    if (!input || typeof input !== "string") {
        throw new Error("Empty or invalid config input");
    }

    const trimmed = input.trim();

    // Check if JSON format
    if (trimmed.startsWith("{")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed.outbounds) && parsed.outbounds.length > 0) {
                const proxyOutbound = parsed.outbounds.find((o) => o.tag === "proxy" || o.tag === "outbound") || parsed.outbounds[0];
                return {
                    ...proxyOutbound,
                    remark: proxyOutbound.tag || "JSON Outbound",
                    server: proxyOutbound.settings?.vnext?.[0]?.address || proxyOutbound.settings?.servers?.[0]?.address || "custom-json",
                    port: proxyOutbound.settings?.vnext?.[0]?.port || proxyOutbound.settings?.servers?.[0]?.port || 0,
                };
            }
            if (parsed.protocol && parsed.settings) {
                return {
                    ...parsed,
                    remark: parsed.remark || parsed.tag || "JSON Node",
                    server: parsed.settings?.vnext?.[0]?.address || parsed.settings?.servers?.[0]?.address || "custom-json",
                    port: parsed.settings?.vnext?.[0]?.port || parsed.settings?.servers?.[0]?.port || 0,
                };
            }
            throw new Error("JSON is missing valid 'outbounds' or 'protocol/settings'");
        } catch (e) {
            throw new Error("Invalid Xray JSON config: " + e.message);
        }
    }

    // Check URI Schemes
    if (/^vless:\/\//i.test(trimmed)) {
        return parseVless(trimmed);
    }
    if (/^vmess:\/\//i.test(trimmed)) {
        return parseVmess(trimmed);
    }
    if (/^trojan:\/\//i.test(trimmed)) {
        return parseTrojan(trimmed);
    }
    if (/^ss:\/\//i.test(trimmed)) {
        return parseShadowsocks(trimmed);
    }
    if (/^(hysteria2|hy2):\/\//i.test(trimmed)) {
        return parseHysteria2(trimmed);
    }

    throw new Error("Unsupported configuration format. Expected vless://, vmess://, trojan://, ss://, hysteria2://, or raw JSON.");
}

/**
 * Detect protocol name from URI or JSON
 * @param {string} input URI or JSON
 * @returns {string} Protocol name e.g. "vless", "vmess", "trojan", "shadowsocks", "hysteria2", "json"
 */
function detectProtocol(input) {
    if (!input || typeof input !== "string") return "unknown";
    const trimmed = input.trim();
    if (trimmed.startsWith("{")) return "json";
    const match = trimmed.match(/^([a-zA-Z0-9]+):\/\//);
    if (match) {
        const proto = match[1].toLowerCase();
        if (proto === "hy2") return "hysteria2";
        if (proto === "ss") return "shadowsocks";
        return proto;
    }
    return "unknown";
}

module.exports = {
    parseXrayConfig,
    parseVless,
    parseVmess,
    parseTrojan,
    parseShadowsocks,
    parseHysteria2,
    detectProtocol,
    safeBase64Decode,
};
