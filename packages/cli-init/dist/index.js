"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@elux/cli-utils");
const getProjectName_1 = __importDefault(require("./getProjectName"));
const cliPackageJson = require('../package.json');
(0, cli_utils_1.checkVersion)(cliPackageJson.name, cliPackageJson.version, 'NODE', cliPackageJson.engines.node, process.version);
let [cmd = ''] = process.argv.slice(2);
cmd = cmd.toLocaleLowerCase();
if (cmd === '-v' || cmd === '--version') {
    console.log('');
    console.log(cli_utils_1.chalk.redBright(cliPackageJson.version));
    console.log('');
    process.exit();
}
else if (cmd === '-h' || cmd === '--help') {
    console.log('');
    console.log(cli_utils_1.chalk.green('elux-init') + cli_utils_1.chalk.yellow(' //create new project.'));
    console.log(cli_utils_1.chalk.green('elux-init -v, --version') + cli_utils_1.chalk.yellow(' //show local version.'));
    console.log(cli_utils_1.chalk.green('elux-init -h, --help') + cli_utils_1.chalk.yellow(' //show help info.'));
    console.log('');
    console.log(cli_utils_1.chalk.bright.bgBlue('- Guide: https://eluxjs.com -'));
    console.log('');
    process.exit();
}
const spinner = (0, cli_utils_1.ora)('check the latest data...').start();
const curVerison = cliPackageJson.version;
let templateResources = cliPackageJson.templateResources;
let compatibleVersion = curVerison, latestVesrion = curVerison;
try {
    [compatibleVersion, latestVesrion] = (0, cli_utils_1.loadPackageVesrion)(cliPackageJson.name, curVerison);
    const data = (0, cli_utils_1.loadPackageFields)(`${cliPackageJson.name}@${compatibleVersion}`, 'templateResources') || templateResources;
    templateResources = Array.isArray(data) ? data : [data];
}
catch (error) {
    spinner.warn(cli_utils_1.chalk.yellow('获取最新数据失败,使用本地缓存...'));
    console.log('');
}
spinner.stop();
let cliVersionTips = cliPackageJson.name + '@' + cli_utils_1.chalk.cyan(curVerison);
if (cli_utils_1.semver.lt(curVerison, latestVesrion)) {
    cliVersionTips += `, 最新: ${cli_utils_1.chalk.bright.bgMagentaBright(latestVesrion)}`;
}
cliVersionTips += cli_utils_1.chalk.bright.bgMagentaBright('\n最新的安装命令已更改为: npm create elux@latest 或 yarn create elux\n');
console.log(cliVersionTips);
const title = [cliVersionTips];
(0, getProjectName_1.default)({ title, templateResources, cliVersion: curVerison });
