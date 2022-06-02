"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaValidate = exports.execa = exports.packageNameValidate = exports.semver = exports.ora = exports.fse = exports.deepExtend = exports.chalk = exports.checkVersion = exports.getEluxConfig = exports.getGlobalDir = exports.getCmdVersion = exports.loadPackageVesrion = exports.loadPackageFields = exports.platform = exports.isEmptyObject = exports.readDirSync = exports.testHttpUrl = exports.clearConsole = exports.slash = exports.checkPort = exports.getCssScopedName = exports.getLocalIP = void 0;
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const chalk_1 = require("chalk");
const deep_extend_1 = __importDefault(require("deep-extend"));
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const global_agent_1 = require("global-agent");
const ora_1 = __importDefault(require("ora"));
const semver_1 = __importDefault(require("semver"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
global_agent_1.bootstrap();
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
function slash(path) {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path);
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
}
exports.slash = slash;
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
function testHttpUrl(url) {
    return new RegExp('https?://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]').test(url);
}
exports.testHttpUrl = testHttpUrl;
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
exports.platform = {
    isWindows: process.platform === 'win32',
    isMacintosh: process.platform === 'darwin',
};
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
const CmdVersionsCache = {
    npm: '',
    yarn: '',
};
function getCmdVersion(cmd) {
    if (!CmdVersionsCache[cmd]) {
        try {
            const version = child_process_1.execSync(cmd + ' --version', { stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 });
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
let GlobalDir;
function getGlobalDir() {
    if (!GlobalDir) {
        GlobalDir = [];
        try {
            const dir = child_process_1.execSync(`npm config get prefix`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 })
                .toString()
                .trim();
            GlobalDir.push(path_1.default.join(dir, 'lib/node_modules'));
        }
        catch (e) { }
        try {
            const dir = child_process_1.execSync(`yarn global dir`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 })
                .toString()
                .trim();
            GlobalDir.push(path_1.default.join(dir, 'node_modules'));
        }
        catch (e) { }
    }
    return GlobalDir;
}
exports.getGlobalDir = getGlobalDir;
function getEluxConfig(env) {
    const rootPath = process.cwd();
    const rootConfigPath = path_1.default.join(rootPath, 'elux.config.js');
    const baseEluxConfig = fs_extra_1.default.existsSync(rootConfigPath) ? require(path_1.default.join(rootPath, 'elux.config.js')) : {};
    const envDir = baseEluxConfig.envDir || './env';
    const envPath = path_1.default.resolve(rootPath, envDir, `./${env}`);
    const envConfigPath = path_1.default.join(envPath, 'elux.config.js');
    const envEluxConfig = fs_extra_1.default.existsSync(envConfigPath) ? require(envConfigPath) : {};
    return { config: deep_extend_1.default(baseEluxConfig, envEluxConfig), envPath };
}
exports.getEluxConfig = getEluxConfig;
function checkVersion(bundleName, bundleVer, platformName, wantedVer, curVer) {
    if (wantedVer && curVer) {
        if (!exports.semver.satisfies(curVer, wantedVer, { includePrerelease: true })) {
            console.error(exports.chalk.redBright(`✖ Version Mismatch!`));
            console.log(exports.chalk.yellow(`  ${bundleName}@${bundleVer} requires ${exports.chalk.yellow.bgRedBright(' ' + platformName + ' ' + wantedVer + ' ')}, but you are using ${platformName}@${curVer}`));
            console.log('');
            process.exit(1);
        }
    }
}
exports.checkVersion = checkVersion;
exports.chalk = { bgCyan: chalk_1.bgCyan, bgGreen: chalk_1.bgGreen, bgMagentaBright: chalk_1.bgMagentaBright, bgRedBright: chalk_1.bgRedBright, bold: chalk_1.bold, cyan: chalk_1.cyan, gray: chalk_1.gray, green: chalk_1.green, magentaBright: chalk_1.magentaBright, redBright: chalk_1.redBright, underline: chalk_1.underline, white: chalk_1.white, yellow: chalk_1.yellow };
exports.deepExtend = deep_extend_1.default;
exports.fse = fs_extra_1.default;
exports.ora = ora_1.default;
exports.semver = semver_1.default;
exports.packageNameValidate = validate_npm_package_name_1.default;
exports.execa = execa_1.default;
var schema_utils_1 = require("schema-utils");
Object.defineProperty(exports, "schemaValidate", { enumerable: true, get: function () { return schema_utils_1.validate; } });
