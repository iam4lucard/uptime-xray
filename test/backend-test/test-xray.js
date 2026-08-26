const { describe, test } = require("node:test");
const assert = require("node:assert");
const {
    parseXrayConfig,
    parseVless,
    parseVmess,
    parseTrojan,
    parseShadowsocks,
    parseHysteria2,
    detectProtocol,
} = require("../../server/modules/xray/uri-parser");
const { buildXrayRuntimeConfig } = require("../../server/modules/xray/config-builder");
const { parseSubscriptionUserInfo, formatBytes } = require("../../server/modules/xray/subscription-parser");

describe("Xray Modules", () => {
    describe("URI Parser", () => {
        test("parses VLESS Reality config correctly", () => {
            const uri = "vless://a1b2c3d4-e5f6-7890-abcd-ef1234567890@1.2.3.4:443?type=tcp&security=reality&pbk=publicKey123&sid=abcd1234&sni=example.com&fp=chrome#MyVlessNode";
            const parsed = parseVless(uri);

            assert.strictEqual(parsed.protocol, "vless");
            assert.strictEqual(parsed.server, "1.2.3.4");
            assert.strictEqual(parsed.port, 443);
            assert.strictEqual(parsed.remark, "MyVlessNode");
            assert.strictEqual(parsed.streamSettings.network, "tcp");
            assert.strictEqual(parsed.streamSettings.security, "reality");
            assert.strictEqual(parsed.streamSettings.realitySettings.publicKey, "publicKey123");
            assert.strictEqual(parsed.streamSettings.realitySettings.shortId, "abcd1234");
            assert.strictEqual(parsed.streamSettings.realitySettings.serverName, "example.com");
            assert.strictEqual(parsed.streamSettings.realitySettings.fingerprint, "chrome");
        });

        test("parses VMess config correctly", () => {
            const vmessJson = JSON.stringify({
                v: "2",
                ps: "TestVMess",
                add: "server.example.com",
                port: "8443",
                id: "12345678-1234-1234-1234-123456789012",
                aid: "0",
                scy: "auto",
                net: "ws",
                type: "none",
                host: "cdn.example.com",
                path: "/ws-path",
                tls: "tls",
                sni: "cdn.example.com",
            });
            const vmessUri = "vmess://" + Buffer.from(vmessJson).toString("base64");
            const parsed = parseVmess(vmessUri);

            assert.strictEqual(parsed.protocol, "vmess");
            assert.strictEqual(parsed.server, "server.example.com");
            assert.strictEqual(parsed.port, 8443);
            assert.strictEqual(parsed.remark, "TestVMess");
            assert.strictEqual(parsed.streamSettings.network, "ws");
            assert.strictEqual(parsed.streamSettings.security, "tls");
            assert.strictEqual(parsed.streamSettings.wsSettings.path, "/ws-path");
            assert.strictEqual(parsed.streamSettings.wsSettings.headers.Host, "cdn.example.com");
        });

        test("parses Trojan config correctly", () => {
            const uri = "trojan://myPassword123@trojan.example.com:443?security=tls&sni=trojan.example.com&type=grpc&serviceName=myGrpcService#TrojanNode";
            const parsed = parseTrojan(uri);

            assert.strictEqual(parsed.protocol, "trojan");
            assert.strictEqual(parsed.server, "trojan.example.com");
            assert.strictEqual(parsed.port, 443);
            assert.strictEqual(parsed.remark, "TrojanNode");
            assert.strictEqual(parsed.settings.servers[0].password, "myPassword123");
            assert.strictEqual(parsed.streamSettings.network, "grpc");
            assert.strictEqual(parsed.streamSettings.grpcSettings.serviceName, "myGrpcService");
        });

        test("parses Shadowsocks config correctly", () => {
            const userinfo = Buffer.from("aes-256-gcm:secretpass").toString("base64");
            const uri = `ss://${userinfo}@ss.example.com:8388#SSNode`;
            const parsed = parseShadowsocks(uri);

            assert.strictEqual(parsed.protocol, "shadowsocks");
            assert.strictEqual(parsed.server, "ss.example.com");
            assert.strictEqual(parsed.port, 8388);
            assert.strictEqual(parsed.remark, "SSNode");
            assert.strictEqual(parsed.settings.servers[0].method, "aes-256-gcm");
            assert.strictEqual(parsed.settings.servers[0].password, "secretpass");
        });

        test("parses Hysteria2 config correctly", () => {
            const uri = "hysteria2://authPass@hy2.example.com:443?sni=hy2.example.com&insecure=1#Hy2Node";
            const parsed = parseHysteria2(uri);

            assert.strictEqual(parsed.protocol, "hysteria2");
            assert.strictEqual(parsed.server, "hy2.example.com");
            assert.strictEqual(parsed.port, 443);
            assert.strictEqual(parsed.remark, "Hy2Node");
            assert.strictEqual(parsed.settings.servers[0].password, "authPass");
            assert.strictEqual(parsed.streamSettings.network, "udp");
        });

        test("detects protocols accurately", () => {
            assert.strictEqual(detectProtocol("vless://test"), "vless");
            assert.strictEqual(detectProtocol("vmess://test"), "vmess");
            assert.strictEqual(detectProtocol("trojan://test"), "trojan");
            assert.strictEqual(detectProtocol("ss://test"), "shadowsocks");
            assert.strictEqual(detectProtocol("hysteria2://test"), "hysteria2");
            assert.strictEqual(detectProtocol("hy2://test"), "hysteria2");
            assert.strictEqual(detectProtocol("{\"protocol\":\"vless\"}"), "json");
        });

        test("parseXrayConfig handles raw JSON configuration", () => {
            const rawJson = JSON.stringify({
                outbounds: [
                    {
                        protocol: "vless",
                        tag: "proxy",
                        settings: {
                            vnext: [{ address: "1.1.1.1", port: 443, users: [{ id: "uuid" }] }],
                        },
                    },
                ],
            });
            const parsed = parseXrayConfig(rawJson);
            assert.strictEqual(parsed.protocol, "vless");
            assert.strictEqual(parsed.server, "1.1.1.1");
            assert.strictEqual(parsed.port, 443);
        });
    });

    describe("Config Builder", () => {
        test("builds full runtime configuration with ephemeral inbounds and routing", () => {
            const outbound = {
                protocol: "vless",
                settings: { vnext: [] },
                streamSettings: { network: "tcp" },
            };
            const config = buildXrayRuntimeConfig(outbound, 10808, 10809);

            assert.strictEqual(config.inbounds.length, 2);
            assert.strictEqual(config.inbounds[0].protocol, "socks");
            assert.strictEqual(config.inbounds[0].port, 10808);
            assert.strictEqual(config.inbounds[1].protocol, "http");
            assert.strictEqual(config.inbounds[1].port, 10809);
            assert.strictEqual(config.outbounds[0].protocol, "vless");
            assert.strictEqual(config.outbounds[0].tag, "proxy");
            assert.strictEqual(config.routing.rules[0].outboundTag, "proxy");
        });
    });

    describe("Subscription Parser", () => {
        test("parses subscription-userinfo header", () => {
            const header = "upload=1073741824; download=5368709120; total=107374182400; expire=1893456000";
            const info = parseSubscriptionUserInfo(header);

            assert.strictEqual(info.upload, 1073741824);
            assert.strictEqual(info.download, 5368709120);
            assert.strictEqual(info.used, 6442450944);
            assert.strictEqual(info.total, 107374182400);
            assert.strictEqual(info.remaining, 100931731456);
            assert.strictEqual(info.usedPercentage, 6);
            assert.strictEqual(info.formattedTotal, "100 GB");
            assert.ok(info.daysRemaining > 0);
        });

        test("formats byte sizes cleanly", () => {
            assert.strictEqual(formatBytes(1024), "1 KB");
            assert.strictEqual(formatBytes(1048576), "1 MB");
            assert.strictEqual(formatBytes(1073741824), "1 GB");
        });
    });
});
