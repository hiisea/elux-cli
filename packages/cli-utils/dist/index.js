"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const archiver_1 = __importDefault(require("archiver"));
const chalk_1 = __importDefault(require("chalk"));
const deep_extend_1 = __importDefault(require("deep-extend"));
const download_1 = __importDefault(require("download"));
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const get_proxy_1 = __importDefault(require("get-proxy"));
const global_agent_1 = require("global-agent");
const got_1 = __importDefault(require("got"));
const listr2_1 = require("listr2");
const minimist_1 = __importDefault(require("minimist"));
const ora_1 = __importDefault(require("ora"));
const schema_utils_1 = require("schema-utils");
const semver_1 = __importDefault(require("semver"));
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
        warn(chalk_1.default.redBright('You are using Node ' + process.version + ', but this version of ' + id + ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'));
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
function getCssScopedName(srcPath, localName, mfileName) {
    if (mfileName.match(/[/\\]global.module.\w+?$/)) {
        return `g-${localName}`;
    }
    mfileName = mfileName
        .replace(/^.*[/\\]node_modules[/\\]/, 'modules/')
        .replace(/^@.+?[/\\]/, '')
        .replace(srcPath, '')
        .replace(/\W/g, '-')
        .replace(/^-|-index-module-\w+$|-module-\w+$|-index-vue$|-vue$/g, '')
        .replace(/^components-/, 'comp-')
        .replace(/^modules-.*?(\w+)-views(-?)(.*)/, '$1$2$3')
        .replace(/^modules-.*?(\w+)-components(-?)(.*)/, '$1-comp$2$3');
    return localName === 'root' ? mfileName : `${mfileName}_${localName}`;
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
    archiver: archiver_1.default,
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
    getCssScopedName,
};
