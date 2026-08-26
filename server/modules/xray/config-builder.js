/**
 * Xray Configuration Builder
 * Generates an isolated Xray-core runtime configuration with ephemeral local inbounds.
 */

/**
 * Build a complete Xray JSON config from a parsed outbound
 * @param {object} outbound The parsed outbound object
 * @param {number} socksPort Local SOCKS5 inbound port
 * @param {number} httpPort Local HTTP inbound port
 * @returns {object} Full Xray config JSON object
 */
function buildXrayRuntimeConfig(outbound, socksPort, httpPort) {
    const proxyOutbound = {
        tag: "proxy",
        protocol: outbound.protocol,
        settings: outbound.settings || {},
        streamSettings: outbound.streamSettings || {},
        mux: outbound.mux || { enabled: false },
    };

    return {
        log: {
            loglevel: "warning",
        },
        inbounds: [
            {
                tag: "socks-in",
                port: socksPort,
                listen: "127.0.0.1",
                protocol: "socks",
                settings: {
                    auth: "noauth",
                    udp: true,
                },
            },
            {
                tag: "http-in",
                port: httpPort,
                listen: "127.0.0.1",
                protocol: "http",
                settings: {
                    allowTransparent: false,
                },
            },
        ],
        outbounds: [
            proxyOutbound,
            {
                tag: "direct",
                protocol: "freedom",
                settings: {},
            },
            {
                tag: "block",
                protocol: "blackhole",
                settings: {},
            },
        ],
        routing: {
            domainStrategy: "AsIs",
            rules: [
                {
                    type: "field",
                    inboundTag: ["socks-in", "http-in"],
                    outboundTag: "proxy",
                },
            ],
        },
    };
}

module.exports = {
    buildXrayRuntimeConfig,
};
