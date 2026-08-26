const { MonitorType } = require("./monitor-type");
const { UP } = require("../../src/util");
const { fetchAndParseSubscription } = require("../modules/xray/subscription-parser");

class XraySubscriptionMonitorType extends MonitorType {
    name = "xray-subscription";
    supportsConditions = true;

    /**
     * @inheritdoc
     */
    async check(monitor, heartbeat, server) {
        const subUrl = monitor.xray_sub_url || monitor.xraySubUrl || monitor.url;
        if (!subUrl) {
            throw new Error("No Xray subscription URL provided");
        }

        const userAgent = monitor.xray_sub_user_agent || monitor.xraySubUserAgent || "v2rayng/1.8.5";
        const timeout = (monitor.timeout || 15) * 1000;

        const startTime = Date.now();
        const result = await fetchAndParseSubscription(subUrl, userAgent, timeout);
        const latency = Date.now() - startTime;

        heartbeat.status = UP;
        heartbeat.ping = latency;

        const parts = [];
        parts.push(`${result.totalNodes} nodes`);

        if (result.userInfo) {
            if (result.userInfo.total > 0) {
                parts.push(`Used: ${result.userInfo.formattedUsed}/${result.userInfo.formattedTotal} (${result.userInfo.usedPercentage}%)`);
            }
            if (result.userInfo.daysRemaining !== null) {
                parts.push(`${result.userInfo.daysRemaining}d left`);
            }
        }

        const protoSummary = Object.entries(result.protocolStats || {})
            .map(([proto, count]) => `${proto.toUpperCase()}:${count}`)
            .join(", ");

        if (protoSummary) {
            parts.push(`[${protoSummary}]`);
        }

        heartbeat.msg = parts.join(" · ");
    }
}

module.exports = {
    XraySubscriptionMonitorType,
};
