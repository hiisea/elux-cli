"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
let logInstallInfo = () => undefined;
let logSuccessInfo = () => undefined;
function main(projectDir) {
    const cdPath = path_1.default.relative(process.cwd(), projectDir);
    process.chdir(path_1.default.resolve(projectDir));
    logInstallInfo = function () {
        console.log('');
        console.log('- 进入项目 ' + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        console.log('- 安装依赖 ' + cli_utils_1.chalk.cyan('yarn install') + cli_utils_1.chalk.yellow(' (或"npm install --legacy-peer-deps",npm版本需>=7.0)'));
        console.log('- 运行程序 ' + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或查看readme)'));
        console.log('');
    };
    logSuccessInfo = function () {
        console.log('');
        console.log(cli_utils_1.chalk.bold('✨ 准备好啦！开始工作吧！\n'));
        console.log('- 进入目录 ' + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        console.log('- 运行程序 ' + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或查看readme)'));
        console.log('');
    };
    console.log('');
    console.log(cli_utils_1.chalk.cyan('🦋 正在执行ESLint...'));
    const eslintPlugin = require.resolve('@elux/eslint-plugin');
    let eslintCmd = path_1.default.join(eslintPlugin.substring(0, eslintPlugin.lastIndexOf('node_modules')), 'node_modules/.bin/eslint');
    if (!cli_utils_1.fse.existsSync(eslintCmd)) {
        eslintCmd = path_1.default.join(eslintPlugin.substring(0, eslintPlugin.lastIndexOf('@elux')), '@elux/eslint-plugin/node_modules/.bin/eslint');
    }
    const configPath = path_1.default.join(__dirname, `./format.js`);
    const subProcess = (0, cli_utils_1.execa)(eslintCmd, ['--config', configPath, '--no-eslintrc', '--fix', '--ext', '.js,.ts,.jsx,.tsx,.vue', './']);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    subProcess.then(() => {
        console.log('');
        (0, cli_utils_1.clearConsole)(cli_utils_1.chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(cli_utils_1.chalk.yellow('   ✔ ESLint执行成功!'));
        beforeInstall(projectDir);
    }, () => {
        console.log('');
        (0, cli_utils_1.clearConsole)(cli_utils_1.chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(cli_utils_1.chalk.redBright('   ✖ ESLint执行失败，请稍后自行运行!'));
        beforeInstall(projectDir);
    });
}
exports.default = main;
function beforeInstall(projectDir) {
    logInstallInfo();
    console.log('');
    const yarnVersion = (0, cli_utils_1.getCmdVersion)('yarn');
    const npmVersion = (0, cli_utils_1.getCmdVersion)('npm');
    const choices = [];
    if (yarnVersion) {
        choices.push({
            name: 'yarn install',
            value: 'yarn',
        });
    }
    if (npmVersion) {
        choices.push({
            name: 'npm install' + (cli_utils_1.semver.lt(npmVersion, '7.0.0') ? cli_utils_1.chalk.redBright('(当前版本<7.0.0,不可用!)') : ''),
            value: cli_utils_1.semver.lt(npmVersion, '7.0.0') ? '' : 'npm',
        });
    }
    choices.push({
        name: '稍后安装...',
        value: '',
    });
    inquirer_1.default
        .prompt({
        type: 'list',
        name: 'installCmd',
        message: cli_utils_1.chalk.green('是否自动安装依赖'),
        choices,
    })
        .then(({ installCmd }) => {
        console.log('');
        if (installCmd) {
            const installExec = installCmd === 'npm' ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
            setTimeout(() => installNPM(installExec), 0);
        }
    });
}
function installNPM(installExec) {
    console.log(`  正在安装依赖，请稍后...`);
    const subProcess = (0, cli_utils_1.execa)(installExec[0], installExec[1]);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    subProcess.then(() => {
        console.log('');
        console.log(cli_utils_1.chalk.green('✔ 项目依赖安装成功！'));
        logSuccessInfo();
    }, () => {
        console.log('');
        console.log(cli_utils_1.chalk.redBright('✖ 项目依赖安装失败，请稍后自行安装！'));
        logInstallInfo();
    });
}
