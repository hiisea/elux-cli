/* eslint-disable no-console */
import {execSync} from 'child_process';
import net from 'net';
import {networkInterfaces} from 'os';
import path from 'path';
import readline from 'readline';
import {bgCyan, bgGreen, bgMagentaBright, bgRedBright, bold, cyan, gray, green, magentaBright, redBright, underline, white, yellow} from 'chalk';
import _deepExtend from 'deep-extend';
import _execa from 'execa';
import fse from 'fs-extra';
import _getProxy from 'get-proxy';
import {bootstrap} from 'global-agent';
import _got from 'got';
import _minimist from 'minimist';
import _ora from 'ora';
import semver from 'semver';

bootstrap();

// import {URL} from 'url';
// import {Agent as HttpAgent} from 'http';
// import {Agent as HttpsAgent} from 'https';
// import tunnel from 'tunnel';
// function createProxyAgent(url: string, proxyUrl: string): {http?: HttpAgent; https?: HttpsAgent} | undefined {
//   if (!proxyUrl) {
//     return;
//   }
//   const uri = new URL(url);
//   const proxy = new URL(proxyUrl);
//   const proxyAuth = proxy.username || proxy.password ? `${proxy.username}:${proxy.password}` : '';
//   const proxyProtocol = proxy.protocol === 'https:' ? 'Https' : 'Http';
//   const port = proxy.port || (proxyProtocol === 'Https' ? 443 : 80);

//   const uriProtocol = uri.protocol === 'https' ? 'https' : 'http';

//   const method = `${uriProtocol}Over${proxyProtocol}`;
//   return {
//     [uriProtocol]: tunnel[method]({
//       proxy: {
//         port,
//         host: proxy.hostname,
//         proxyAuth,
//       },
//     }),
//   };
// }

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

export function testHttpUrl(url: string): boolean {
  return new RegExp('https?://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]').test(url);
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

export function loadPackageFields(packageName: string, fields: string): any {
  const str = execSync(`npm view ${packageName} ${fields} --json`, {stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000})
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

export function checkNodeVersion(wanted: string, id: string): void {
  if (!semver.satisfies(process.version, wanted, {includePrerelease: true})) {
    console.warn(
      chalk.redBright(
        'You are using Node ' + process.version + ', but this version of ' + id + ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
      )
    );
    process.exit(1);
  }
}

export function readDirSync(floder: string): {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}[] {
  const list = fse.readdirSync(floder);
  const res = list
    .map((name) => {
      const stat = fse.statSync(path.join(floder, name));
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

export function slash(path: string): string {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

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

const CmdVersionsCache = {
  npm: '',
  yarn: '',
  cnpm: '',
};

export function getCmdVersion(cmd: string): string {
  if (!CmdVersionsCache[cmd]) {
    try {
      const version = execSync(cmd + ' --version', {stdio: ['pipe', 'pipe', 'ignore'], timeout: 10000});
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

export const platform = {
  isWindows: process.platform === 'win32',
  isMacintosh: process.platform === 'darwin',
};

export {Listr} from 'listr2';
export {validate as schemaValidate} from 'schema-utils';
export const chalk = {bgCyan, bgGreen, bgMagentaBright, bgRedBright, bold, cyan, gray, green, magentaBright, redBright, underline, white, yellow};
export const minimist = _minimist;
export const ora = _ora;
export const execa = _execa;
export const got = _got;
export const deepExtend = _deepExtend;
export const getProxy = _getProxy;
export * as semver from 'semver';
export * as fse from 'fs-extra';
export * as archiver from 'archiver';
export * as download from 'download';
