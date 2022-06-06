import {execSync} from 'child_process';
import net from 'net';
import {networkInterfaces} from 'os';
import path from 'path';
import readline from 'readline';
import {bold, cyan, gray, green, magentaBright, redBright, underline, yellow, yellowBright} from 'chalk';
import _deepExtend from 'deep-extend';
import _execa from 'execa';
import _fse from 'fs-extra';
import {bootstrap} from 'global-agent';
import _ora from 'ora';
import _semver from 'semver';
import _packageNameValidate from 'validate-npm-package-name';

bootstrap();

let localIP: string = '';

export function getLocalIP(): string {
  if (!localIP) {
    localIP = 'localhost';
    const interfaces = networkInterfaces();
    for (const devName in interfaces) {
      const isEnd = interfaces[devName]?.some((item) => {
        // 取IPv4, 不为127.0.0.1的内网ip
        if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
          localIP = item.address;
          return true;
        }
        return false;
      });
      // 若获取到ip, 结束遍历
      if (isEnd) {
        break;
      }
    }
  }

  return localIP;
}

export function getCssScopedName(srcPath: string, localName: string, mfileName: string): string {
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

export function checkPort(port: number): Promise<Boolean> {
  const server = net.createServer().listen(port);
  return new Promise((resolve, reject) => {
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    server.on('error', (err) => {
      if (err['code'] === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

export function slash(path: string): string {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

export function clearConsole(title: string): void {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    if (title) {
      console.log(title);
    }
  }
}

export function testHttpUrl(url: string): boolean {
  return new RegExp('https?://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]').test(url);
}

export function readDirSync(floder: string): {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}[] {
  const list = _fse.readdirSync(floder);
  const res = list
    .map((name) => {
      const stat = _fse.statSync(path.join(floder, name));
      return {
        name,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
      };
    })
    .filter((file) => !file.name.startsWith('.') && file.name !== '__MACOSX');
  return res;
}

export function isEmptyObject(obj: any): boolean {
  if (obj == null) {
    return true;
  }
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

export const platform = {
  isWindows: process.platform === 'win32',
  isMacintosh: process.platform === 'darwin',
};

export function loadPackageFields(packageName: string, fields: string): any {
  const str = execSync(`npm view ${packageName} ${fields} --json`, {stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000})
    .toString()
    .trim();
  return str ? JSON.parse(str) : str;
}

export function loadPackageVesrion(packageName: string): string;
export function loadPackageVesrion(packageName: string, installedVersion: string): [string, string];
export function loadPackageVesrion(packageName: string, installedVersion?: string): string | [string, string] {
  const latest = loadPackageFields(packageName, 'version') as string;
  if (!installedVersion) {
    return latest;
  } else {
    const result = loadPackageFields(packageName + '@^' + installedVersion, 'version');
    const compatible = Array.isArray(result) ? result.pop() : installedVersion;
    return [compatible, latest];
  }
}

const CmdVersionsCache = {
  npm: '',
  yarn: '',
};

export function getCmdVersion(cmd: string): string {
  if (!CmdVersionsCache[cmd]) {
    try {
      const version = execSync(cmd + ' --version', {stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000});
      CmdVersionsCache[cmd] = version
        .toString()
        .trim()
        .replace(/^\n*|\n*$/g, '');
    } catch (e) {
      CmdVersionsCache[cmd] = '';
    }
  }
  return CmdVersionsCache[cmd];
}

let GlobalDir: string[];

export function getGlobalDir(): string[] {
  if (!GlobalDir) {
    GlobalDir = [];
    try {
      const dir = execSync(`npm config get prefix`, {stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000})
        .toString()
        .trim();
      GlobalDir.push(path.join(dir, 'lib/node_modules'));
      // eslint-disable-next-line no-empty
    } catch (e) {}
    try {
      const dir = execSync(`yarn global dir`, {stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000})
        .toString()
        .trim();
      GlobalDir.push(path.join(dir, 'node_modules'));
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  return GlobalDir;
}

export function getEluxConfig(env: string): {config: Record<string, any>; envPath: string} {
  const rootPath = process.cwd();
  const rootConfigPath = path.join(rootPath, 'elux.config.js');
  const baseEluxConfig = _fse.existsSync(rootConfigPath) ? require(path.join(rootPath, 'elux.config.js')) : {};
  const envDir = baseEluxConfig.envDir || './env';
  const envPath = path.resolve(rootPath, envDir, `./${env}`);
  const envConfigPath = path.join(envPath, 'elux.config.js');
  const envEluxConfig = _fse.existsSync(envConfigPath) ? require(envConfigPath) : {};
  return {config: _deepExtend(baseEluxConfig, envEluxConfig), envPath};
}

export function checkVersion(bundleName: string, bundleVer: string, platformName: string, wantedVer?: string, curVer?: string): void {
  if (wantedVer && curVer) {
    if (!semver.satisfies(curVer, wantedVer, {includePrerelease: true})) {
      console.error(chalk.redBright(`✖ Version Mismatch!`));
      console.log(
        chalk.yellow(
          `  ${bundleName}@${bundleVer} requires ${chalk.bright.bgRedBright(
            ' ' + platformName + ' ' + wantedVer + ' '
          )}, but you are using ${platformName}@${curVer}`
        )
      );
      console.log('');
      process.exit(1);
    }
  }
}

export const chalk = {bold, cyan, gray, green, magentaBright, redBright, underline, yellow, bright: yellowBright};
export const deepExtend = _deepExtend;
export const fse = _fse;
export const ora = _ora;
export const semver = _semver;
export const packageNameValidate = _packageNameValidate;
export const execa = _execa;
export {validate as schemaValidate} from 'schema-utils';
