/* eslint-disable no-console */
import chalk from 'chalk';
import semver from 'semver';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';
import ora from 'ora';
import readline from 'readline';
import deepExtend from 'deep-extend';
import {networkInterfaces} from 'os';
import got from 'got';
import {execSync} from 'child_process';

function getLocalIP() {
  let result = 'localhost';
  const interfaces = networkInterfaces();
  for (const devName in interfaces) {
    const isEnd = interfaces[devName]?.some((item) => {
      // 取IPv4, 不为127.0.0.1的内网ip
      if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
        result = item.address;
        return true;
      }
      return false;
    });
    // 若获取到ip, 结束遍历
    if (isEnd) {
      break;
    }
  }
  return result;
}

const localIP = getLocalIP();

function slash(path: string): string {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

function log(message: string): void {
  console.log(message);
}

function err(message: string): void {
  console.error(message);
}

function warn(message: string): void {
  console.warn(message);
}

function getCmdVersion(cmd: string): string {
  try {
    const version = execSync(cmd + ' --version', {stdio: ['pipe', 'pipe', 'ignore']});
    return version
      .toString()
      .trim()
      .replace(/^\n*|\n*$/g, '');
  } catch (e) {
    return '';
  }
}

const npmVersion = getCmdVersion('npm');
const cnpmVersion = getCmdVersion('cnpm');
const yarnVersion = getCmdVersion('yarn');

function loadPackageVesrion(packageName: string): string {
  if (npmVersion) {
    try {
      const version = execSync(`npm view ${packageName} version`, {stdio: ['pipe', 'pipe', 'ignore']});
      return version
        .toString()
        .trim()
        .replace(/^\n*|\n*$/g, '');
    } catch (e) {
      return '';
    }
  } else if (yarnVersion) {
    try {
      const json = execSync(`yarn info ${packageName} version --json`, {stdio: ['pipe', 'pipe', 'ignore']});
      const result: {type: string; data: string} = JSON.parse(json.toString().trim());
      return result.type !== 'error' ? result.data : '';
    } catch (e) {
      return '';
    }
  }
  return '';
}

function isEmptyObject(obj: any): boolean {
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

const platform = {
  npmVersion,
  yarnVersion,
  cnpmVersion,
  isWindows: process.platform === 'win32',
  isMacintosh: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
};

function checkNodeVersion(wanted: string, id: string): void {
  if (!semver.satisfies(process.version, wanted, {includePrerelease: true})) {
    warn(
      chalk.red(
        'You are using Node ' + process.version + ', but this version of ' + id + ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
      )
    );
    process.exit(1);
  }
}

function readDirSync(floder: string): {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}[] {
  const list = fs.readdirSync(floder);
  const res = list
    .map((name) => {
      const stat = fs.statSync(path.join(floder, name));
      return {
        name,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
      };
    })
    .filter((file) => !file.name.startsWith('.') && file.name !== '__MACOSX');
  return res;
}

function clearConsole(title: string): void {
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

export = {
  chalk,
  semver,
  deepExtend,
  slash,
  minimist,
  fs,
  ora,
  localIP,
  log,
  err,
  execa,
  getCmdVersion,
  isEmptyObject,
  platform,
  readDirSync,
  checkNodeVersion,
  loadPackageVesrion,
  clearConsole,
  got,
};
