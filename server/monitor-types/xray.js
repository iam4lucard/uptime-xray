const { MonitorType } = require("./monitor-type");
const { UP } = require("../../src/util");
const { testXrayConfig } = require("../modules/xray/xray-runner");
const { detectProtocol } = require("../modules/xray/uri-parser");

class XrayMonitorType extends MonitorType {
    name = "xray";
    supportsConditions = true;

    /**
     * @inheritdoc
     */
    async check(monitor, heartbeat, server) {
        const config = monitor.xray_config || monitor.xrayConfig || monitor.url;
        if (!config) {
            throw new Error("No Xray configuration provided");
        }

        const testUrl = monitor.xray_test_url || monitor.xrayTestUrl || "http://cp.cloudflare.com/generate_204";
        const timeout = (monitor.timeout || 10) * 1000;
        const checkExitIp = Boolean(monitor.xray_check_exit_ip ?? monitor.xrayCheckExitIp);
        const acceptedStatusCodes = monitor.getAcceptedStatuscodes ? monitor.getAcceptedStatuscodes() : ["200-299", "204"];

        const result = await testXrayConfig({
            config,
            testUrl,
            timeout,
            checkExitIp,
            acceptedStatusCodes,
        });

        heartbeat.status = UP;
        heartbeat.ping = result.latency;

        const protoName = (result.protocol || detectProtocol(config)).toUpperCase();
        if (result.exitIpInfo && result.exitIpInfo.ip) {
            const loc = result.exitIpInfo.country ? `${result.exitIpInfo.country} (${result.exitIpInfo.countryCode || ""})` : "";
            heartbeat.msg = `[${protoName}] ${loc ? loc + " · " : ""}${result.exitIpInfo.ip} · ${result.latency}ms (HTTP ${result.statusCode})`;
        } else {
            const remarkInfo = result.remark && result.remark !== "proxy" ? `${result.remark} · ` : "";
            heartbeat.msg = `[${protoName}] ${remarkInfo}${result.server || ""}:${result.port || ""} · ${result.latency}ms (HTTP ${result.statusCode})`;
        }
    }
}

module.exports = {
    XrayMonitorType,
};
