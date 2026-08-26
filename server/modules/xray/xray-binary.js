/**
 * Xray Binary Manager
 * Detects or downloads the official Xray-core binary for the target host platform.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { execSync } = require("child_process");
const { log } = require("../../../src/util");

const XRAY_DEFAULT_VERSION = "v25.1.30";

/**
 * Get target archive filename for current platform & arch
 * @returns {string} Xray release archive filename
 */
function getTargetArchiveName() {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === "linux") {
        if (arch === "x64") return "Xray-linux-64.zip";
        if (arch === "arm64") return "Xray-linux-arm64-v8a.zip";
        if (arch === "arm") return "Xray-linux-arm32-v7a.zip";
    } else if (platform === "darwin") {
        if (arch === "arm64") return "Xray-macos-arm64.zip";
        return "Xray-macos-64.zip";
    } else if (platform === "win32") {
        if (arch === "arm64") return "Xray-windows-arm64-v8a.zip";
        return "Xray-windows-64.zip";
    }

    throw new Error(`Unsupported OS/Architecture: ${platform} ${arch}`);
}

/**
 * Get path to local xray-core directory
 * @returns {string} Directory path
 */
function getXrayCoreDir() {
    const dataDir = process.env.DATA_DIR || path.join(__dirname, "../../../data");
    return path.join(dataDir, "xray-core");
}

/**
 * Find the xray binary path
 * @returns {string|null} Full path to executable or null if not found
 */
function findXrayBinary() {
    if (process.env.XRAY_PATH && fs.existsSync(process.env.XRAY_PATH)) {
        return process.env.XRAY_PATH;
    }

    // Check system PATH
    const isWin = os.platform() === "win32";
    const binName = isWin ? "xray.exe" : "xray";

    const commonPaths = [
        path.join(getXrayCoreDir(), binName),
        "/usr/local/bin/xray",
        "/usr/bin/xray",
        "/opt/xray/xray",
    ];

    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            try {
                if (!isWin) {
                    fs.accessSync(p, fs.constants.X_OK);
                }
                return p;
            } catch (_) {
                // Not executable
            }
        }
    }

    // Check PATH via which/where
    try {
        const cmd = isWin ? `where ${binName}` : `which ${binName}`;
        const output = execSync(cmd, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf8" }).trim();
        if (output) {
            const firstPath = output.split("\n")[0].trim();
            if (fs.existsSync(firstPath)) {
                return firstPath;
            }
        }
    } catch (_) {
        // Not found in PATH
    }

    return null;
}

/**
 * Ensure Xray binary is installed; downloads if missing.
 * @returns {Promise<string>} Path to working xray binary
 */
async function ensureXrayBinary() {
    const existing = findXrayBinary();
    if (existing) {
        return existing;
    }

    const xrayDir = getXrayCoreDir();
    const isWin = os.platform() === "win32";
    const binName = isWin ? "xray.exe" : "xray";
    const binPath = path.join(xrayDir, binName);

    if (fs.existsSync(binPath)) {
        if (!isWin) {
            fs.chmodSync(binPath, 0o755);
        }
        return binPath;
    }

    if (!fs.existsSync(xrayDir)) {
        fs.mkdirSync(xrayDir, { recursive: true });
    }

    const archiveName = getTargetArchiveName();
    const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_DEFAULT_VERSION}/${archiveName}`;
    const zipPath = path.join(xrayDir, archiveName);

    log.info("xray", `Downloading Xray-core binary from ${downloadUrl}...`);

    const response = await axios({
        method: "get",
        url: downloadUrl,
        responseType: "arraybuffer",
        timeout: 60000,
        headers: {
            "User-Agent": "Mozilla/5.0 Uptime-Xray",
        },
    });

    fs.writeFileSync(zipPath, Buffer.from(response.data));
    log.info("xray", `Extracting ${archiveName} to ${xrayDir}...`);

    if (isWin) {
        execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${xrayDir}' -Force"`);
    } else {
        execSync(`unzip -o "${zipPath}" -d "${xrayDir}"`);
        if (fs.existsSync(binPath)) {
            fs.chmodSync(binPath, 0o755);
        }
    }

    try {
        fs.unlinkSync(zipPath);
    } catch (_) {}

    if (!fs.existsSync(binPath)) {
        throw new Error(`Failed to extract Xray binary to ${binPath}`);
    }

    log.info("xray", `Xray-core binary ready at ${binPath}`);
    return binPath;
}

module.exports = {
    findXrayBinary,
    ensureXrayBinary,
    getXrayCoreDir,
};
