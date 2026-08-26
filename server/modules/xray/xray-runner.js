/**
 * Xray Probe Runner
 * Executes an isolated ephemeral Xray instance and tests connectivity through the proxy.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const net = require("net");
const { spawn } = require("child_process");
const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpProxyAgent } = require("http-proxy-agent");
const { parseXrayConfig } = require("./uri-parser");
const { buildXrayRuntimeConfig } = require("./config-builder");
const { ensureXrayBinary } = require("./xray-binary");
const { log } = require("../../../src/util");

/**
 * Get an available random ephemeral TCP port
 * @returns {Promise<number>} Free port number
 */
function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

/**
 * Wait until a local TCP port is accepting connections
 * @param {number} port Port number
 * @param {number} timeoutMs Max wait time in ms
 * @param {Function} [getStderr] Optional callback returning stderr log
 * @returns {Promise<void>}
 */
function waitForPort(port, timeoutMs = 5000, getStderr = null) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            const socket = new net.Socket();
            socket.setTimeout(250);

            socket.on("connect", () => {
                socket.destroy();
                resolve();
            });

            socket.on("error", () => {
                socket.destroy();
                if (Date.now() - startTime >= timeoutMs) {
                    const extra = getStderr ? getStderr() : "";
                    reject(new Error(`Timeout waiting for Xray inbound port ${port} to open${extra ? `: ${extra}` : ""}`));
                } else {
                    setTimeout(check, 50);
                }
            });

            socket.on("timeout", () => {
                socket.destroy();
                if (Date.now() - startTime >= timeoutMs) {
                    const extra = getStderr ? getStderr() : "";
                    reject(new Error(`Timeout waiting for Xray inbound port ${port} to open${extra ? `: ${extra}` : ""}`));
                } else {
                    setTimeout(check, 50);
                }
            });

            socket.connect(port, "127.0.0.1");
        };

        check();
    });
}

/**
 * Test an Xray configuration with end-to-end HTTP/HTTPS probe
 * @param {object} options Test options
 * @param {string} options.config Xray URI or JSON config
 * @param {string} [options.testUrl] Target probe URL (default: http://cp.cloudflare.com/generate_204)
 * @param {number} [options.timeout] Timeout in ms (default: 10000)
 * @param {boolean} [options.checkExitIp] Whether to fetch exit IP & Geo data
 * @param {string[]} [options.acceptedStatusCodes] List of acceptable status code strings e.g. ["200", "204"]
 * @returns {Promise<object>} Result containing latency, status, exit IP info
 */
async function testXrayConfig(options) {
    const {
        config,
        testUrl = "http://cp.cloudflare.com/generate_204",
        timeout = 10000,
        checkExitIp = false,
        acceptedStatusCodes = ["200-299", "204"],
    } = options;

    if (!config) {
        throw new Error("Missing Xray configuration");
    }

    const parsedOutbound = parseXrayConfig(config);
    const socksPort = await getFreePort();
    const httpPort = await getFreePort();
    const runtimeConfig = buildXrayRuntimeConfig(parsedOutbound, socksPort, httpPort);

    const binPath = await ensureXrayBinary();
    const tempConfigFile = path.join(os.tmpdir(), `xray-kuma-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);

    fs.writeFileSync(tempConfigFile, JSON.stringify(runtimeConfig, null, 2));

    let child = null;
    let isTerminated = false;

    const cleanup = () => {
        if (!isTerminated && child) {
            isTerminated = true;
            try {
                child.kill("SIGKILL");
            } catch (_) {}
        }
        try {
            if (fs.existsSync(tempConfigFile)) {
                fs.unlinkSync(tempConfigFile);
            }
        } catch (_) {}
    };

    try {
        let stderrLog = "";
        child = spawn(binPath, ["run", "-c", tempConfigFile], {
            stdio: ["ignore", "pipe", "pipe"],
        });

        child.stderr.on("data", (data) => {
            stderrLog += data.toString();
        });

        child.on("error", (err) => {
            log.error("xray", `Xray process error: ${err.message}`);
        });

        // Wait for Xray inbound SOCKS & HTTP ports to open (up to 5s)
        await waitForPort(httpPort, 5000, () => stderrLog.trim());

        // Perform probe through the local HTTP inbound
        const httpAgent = new HttpProxyAgent(`http://127.0.0.1:${httpPort}`);
        const socksAgent = new SocksProxyAgent(`socks5://127.0.0.1:${socksPort}`);

        const probeStartTime = Date.now();
        const probeResponse = await axios.get(testUrl, {
            httpAgent,
            httpsAgent: socksAgent,
            timeout: timeout,
            validateStatus: () => true, // capture all status codes
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });
        const latency = Date.now() - probeStartTime;

        const statusCode = probeResponse.status;

        // Check if status code matches expected
        let isStatusAccepted = false;
        if (acceptedStatusCodes && acceptedStatusCodes.length > 0) {
            for (const expected of acceptedStatusCodes) {
                if (expected.includes("-")) {
                    const [min, max] = expected.split("-").map(Number);
                    if (statusCode >= min && statusCode <= max) {
                        isStatusAccepted = true;
                        break;
                    }
                } else if (parseInt(expected) === statusCode) {
                    isStatusAccepted = true;
                    break;
                }
            }
        } else {
            isStatusAccepted = statusCode >= 200 && statusCode < 400;
        }

        if (!isStatusAccepted) {
            throw new Error(`HTTP probe returned unexpected status code: ${statusCode}`);
        }

        let exitIpInfo = null;
        if (checkExitIp) {
            try {
                const ipResponse = await axios.get("http://ip-api.com/json", {
                    httpAgent,
                    timeout: 4000,
                });
                if (ipResponse.data && ipResponse.data.status === "success") {
                    exitIpInfo = {
                        ip: ipResponse.data.query,
                        country: ipResponse.data.country,
                        countryCode: ipResponse.data.countryCode,
                        isp: ipResponse.data.isp,
                        city: ipResponse.data.city,
                    };
                }
            } catch (ipErr) {
                // Secondary IP lookup failure is non-fatal for connectivity
                log.debug("xray", `Exit IP lookup failed: ${ipErr.message}`);
            }
        }

        return {
            success: true,
            latency,
            statusCode,
            protocol: parsedOutbound.protocol,
            remark: parsedOutbound.remark,
            server: parsedOutbound.server,
            port: parsedOutbound.port,
            exitIpInfo,
        };
    } catch (err) {
        cleanup();
        throw err;
    } finally {
        cleanup();
    }
}

module.exports = {
    testXrayConfig,
    getFreePort,
};
