"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const chalk_1 = __importDefault(require("chalk"));
const semver_1 = __importDefault(require("semver"));
const minimist_1 = __importDefault(require("minimist"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const ora_1 = __importDefault(require("ora"));
const readline_1 = __importDefault(require("readline"));
const deep_extend_1 = __importDefault(require("deep-extend"));
const os_1 = require("os");
const net_1 = __importDefault(require("net"));
const got_1 = __importDefault(require("got"));
const download_1 = __importDefault(require("download"));
const global_agent_1 = require("global-agent");
const get_proxy_1 = __importDefault(require("get-proxy"));
const child_process_1 = require("child_process");
const listr2_1 = require("listr2");
const schema_utils_1 = require("schema-utils");
global_agent_1.bootstrap();
function getLocalIP() {
    let result = 'localhost';
    const interfaces = os_1.networkInterfaces();
    for (const devName in interfaces) {
        const isEnd = interfaces[devName]?.some((item) => {
            if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
                result = item.address;
                return true;
            }
            return false;
        });
        if (isEnd) {
            break;
        }
    }
    return result;
}
const localIP = getLocalIP();
function slash(path) {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path);
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
}
function log(message) {
    console.log(message);
}
function err(message) {
    console.error(message);
}
function warn(message) {
    console.warn(message);
}
function getCmdVersion(cmd) {
    try {
        const version = child_process_1.execSync(cmd + ' --version', { stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000 });
        return version
            .toString()
            .trim()
            .replace(/^\n*|\n*$/g, '');
    }
    catch (e) {
        return '';
    }
}
const npmVersion = getCmdVersion('npm');
const cnpmVersion = getCmdVersion('cnpm');
const yarnVersion = getCmdVersion('yarn');
function loadPackageFields(packageName, fields) {
    const str = child_process_1.execSync(`npm view ${packageName} ${fields} --json`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000 })
        .toString()
        .trim();
    return str ? JSON.parse(str) : str;
}
function loadPackageVesrion(packageName, installedVersion) {
    const latest = loadPackageFields(packageName, 'version');
    if (!installedVersion) {
        return latest;
    }
    else {
        const result = loadPackageFields(packageName + '@^' + installedVersion, 'version');
        const compatible = Array.isArray(result) ? result.pop() : installedVersion;
        return [compatible, latest];
    }
}
function isEmptyObject(obj) {
    if (obj == null) {
        return true;
    }
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
const platform = {
    npmVersion,
    yarnVersion,
    cnpmVersion,
    isWindows: process.platform === 'win32',
    isMacintosh: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
};
function checkNodeVersion(wanted, id) {
    if (!semver_1.default.satisfies(process.version, wanted, { includePrerelease: true })) {
        warn(chalk_1.default.red('You are using Node ' + process.version + ', but this version of ' + id + ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'));
        process.exit(1);
    }
}
function readDirSync(floder) {
    const list = fs_extra_1.default.readdirSync(floder);
    const res = list
        .map((name) => {
        const stat = fs_extra_1.default.statSync(path_1.default.join(floder, name));
        return {
            name,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile(),
        };
    })
        .filter((file) => !file.name.startsWith('.') && file.name !== '__MACOSX');
    return res;
}
function clearConsole(title) {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows);
        console.log(blank);
        readline_1.default.cursorTo(process.stdout, 0, 0);
        readline_1.default.clearScreenDown(process.stdout);
        if (title) {
            console.log(title);
        }
    }
}
function testHttpUrl(url) {
    return new RegExp('https?://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]').test(url);
}
function checkPort(port) {
    const server = net_1.default.createServer().listen(port);
    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            server.close();
            resolve(true);
        });
        server.on('error', (err) => {
            if (err['code'] === 'EADDRINUSE') {
                resolve(false);
            }
            else {
                reject(err);
            }
        });
    });
}
module.exports = {
    chalk: chalk_1.default,
    semver: semver_1.default,
    deepExtend: deep_extend_1.default,
    slash,
    minimist: minimist_1.default,
    fs: fs_extra_1.default,
    ora: ora_1.default,
    Listr: listr2_1.Listr,
    localIP,
    log,
    err,
    execa: execa_1.default,
    getCmdVersion,
    isEmptyObject,
    platform,
    readDirSync,
    checkNodeVersion,
    loadPackageFields,
    loadPackageVesrion,
    clearConsole,
    got: got_1.default,
    download: download_1.default,
    getProxy: get_proxy_1.default,
    testHttpUrl,
    checkPort,
    schemaValidate: schema_utils_1.validate,
};
