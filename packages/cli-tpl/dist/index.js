"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLock = void 0;
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
async function buildLock({ dir }) {
    const projectDir = path_1.default.resolve(process.cwd(), dir);
    const lockDir = path_1.default.resolve(process.cwd(), dir + '-lock');
    process.chdir(path_1.default.resolve(projectDir));
    console.log(projectDir);
    console.log('清除相关文件...');
    cli_utils_1.fse.removeSync(lockDir);
    cli_utils_1.fse.removeSync(path_1.default.join(projectDir, 'yarn.lock'));
    cli_utils_1.fse.removeSync(path_1.default.join(projectDir, 'package-lock.json'));
    cli_utils_1.fse.removeSync(path_1.default.join(projectDir, 'node_modules'));
    console.log('yarn install...');
    let subProcess = cli_utils_1.execa('yarn', ['install']);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    await subProcess;
    console.log('清除相关文件...');
    cli_utils_1.fse.moveSync(path_1.default.join(projectDir, 'yarn.lock'), path_1.default.join(lockDir, 'yarn.lock'));
    cli_utils_1.fse.removeSync(path_1.default.join(projectDir, 'node_modules'));
    console.log('npm install...');
    subProcess = cli_utils_1.execa('npm', ['install', '--legacy-peer-deps']);
    await subProcess;
    cli_utils_1.fse.moveSync(path_1.default.join(projectDir, 'package-lock.json'), path_1.default.resolve(lockDir, 'package-lock.json'));
}
exports.buildLock = buildLock;
