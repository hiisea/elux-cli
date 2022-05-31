"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = exports.archiver = exports.fse = exports.semver = exports.getProxy = exports.deepExtend = exports.got = exports.execa = exports.ora = exports.minimist = exports.chalk = exports.schemaValidate = exports.Listr = exports.platform = exports.getCmdVersion = exports.getLocalIP = exports.slash = exports.isEmptyObject = exports.readDirSync = exports.checkNodeVersion = exports.loadPackageVesrion = exports.loadPackageFields = exports.clearConsole = exports.testHttpUrl = exports.checkPort = exports.getCssScopedName = void 0;
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const chalk_1 = require("chalk");
const deep_extend_1 = __importDefault(require("deep-extend"));
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const get_proxy_1 = __importDefault(require("get-proxy"));
const global_agent_1 = require("global-agent");
const got_1 = __importDefault(require("got"));
const minimist_1 = __importDefault(require("minimist"));
const ora_1 = __importDefault(require("ora"));
const semver_1 = __importDefault(require("semver"));
global_agent_1.bootstrap();
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
exports.getCssScopedName = getCssScopedName;
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
exports.checkPort = checkPort;
function testHttpUrl(url) {
    return new RegExp('https?://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]').test(url);
}
exports.testHttpUrl = testHttpUrl;
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
exports.clearConsole = clearConsole;
function loadPackageFields(packageName, fields) {
    const str = child_process_1.execSync(`npm view ${packageName} ${fields} --json`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000 })
        .toString()
        .trim();
    return str ? JSON.parse(str) : str;
}
exports.loadPackageFields = loadPackageFields;
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
exports.loadPackageVesrion = loadPackageVesrion;
function checkNodeVersion(wanted, id) {
    if (!semver_1.default.satisfies(process.version, wanted, { includePrerelease: true })) {
        console.warn(exports.chalk.redBright('You are using Node ' + process.version + ', but this version of ' + id + ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'));
        process.exit(1);
    }
}
exports.checkNodeVersion = checkNodeVersion;
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
exports.readDirSync = readDirSync;
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
exports.isEmptyObject = isEmptyObject;
function slash(path) {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path);
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
}
exports.slash = slash;
let localIP = '';
function getLocalIP() {
    if (!localIP) {
        localIP = 'localhost';
        const interfaces = os_1.networkInterfaces();
        for (const devName in interfaces) {
            const isEnd = interfaces[devName]?.some((item) => {
                if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
                    localIP = item.address;
                    return true;
                }
                return false;
            });
            if (isEnd) {
                break;
            }
        }
    }
    return localIP;
}
exports.getLocalIP = getLocalIP;
const CmdVersionsCache = {
    npm: '',
    yarn: '',
    cnpm: '',
};
function getCmdVersion(cmd) {
    if (!CmdVersionsCache[cmd]) {
        try {
            const version = child_process_1.execSync(cmd + ' --version', { stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000 });
            CmdVersionsCache[cmd] = version
                .toString()
                .trim()
                .replace(/^\n*|\n*$/g, '');
        }
        catch (e) {
            CmdVersionsCache[cmd] = '';
        }
    }
    return CmdVersionsCache[cmd];
}
exports.getCmdVersion = getCmdVersion;
exports.platform = {
    isWindows: process.platform === 'win32',
    isMacintosh: process.platform === 'darwin',
};
var listr2_1 = require("listr2");
Object.defineProperty(exports, "Listr", { enumerable: true, get: function () { return listr2_1.Listr; } });
var schema_utils_1 = require("schema-utils");
Object.defineProperty(exports, "schemaValidate", { enumerable: true, get: function () { return schema_utils_1.validate; } });
exports.chalk = { bgCyan: chalk_1.bgCyan, bgGreen: chalk_1.bgGreen, bgMagentaBright: chalk_1.bgMagentaBright, bgRedBright: chalk_1.bgRedBright, bold: chalk_1.bold, cyan: chalk_1.cyan, gray: chalk_1.gray, green: chalk_1.green, magentaBright: chalk_1.magentaBright, redBright: chalk_1.redBright, underline: chalk_1.underline, white: chalk_1.white, yellow: chalk_1.yellow };
exports.minimist = minimist_1.default;
exports.ora = ora_1.default;
exports.execa = execa_1.default;
exports.got = got_1.default;
exports.deepExtend = deep_extend_1.default;
exports.getProxy = get_proxy_1.default;
exports.semver = __importStar(require("semver"));
exports.fse = __importStar(require("fs-extra"));
exports.archiver = __importStar(require("archiver"));
exports.download = __importStar(require("download"));
