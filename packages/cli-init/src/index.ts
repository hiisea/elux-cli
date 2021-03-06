import {chalk, checkVersion, loadPackageFields, loadPackageVesrion, ora, semver} from '@elux/cli-utils';
import getProjectName from './getProjectName';
import type {PackageJson} from './libs/base';
const cliPackageJson: PackageJson = require('../package.json');

checkVersion(cliPackageJson.name, cliPackageJson.version, 'NODE', cliPackageJson.engines.node, process.version);

let [cmd = ''] = process.argv.slice(2);
cmd = cmd.toLocaleLowerCase();
if (cmd === '-v' || cmd === '--version') {
  console.log('');
  console.log(chalk.redBright(cliPackageJson.version));
  console.log('');
  process.exit();
} else if (cmd === '-h' || cmd === '--help') {
  console.log('');
  console.log(chalk.green('elux-init') + chalk.yellow(' //create new project.'));
  console.log(chalk.green('elux-init -v, --version') + chalk.yellow(' //show local version.'));
  console.log(chalk.green('elux-init -h, --help') + chalk.yellow(' //show help info.'));
  console.log('');
  console.log(chalk.bright.bgBlue('- Guide: https://eluxjs.com -'));
  console.log('');
  process.exit();
}

const spinner = ora('check the latest data...').start();
const curVerison: string = cliPackageJson.version;
let templateResources = cliPackageJson.templateResources;
let compatibleVersion = curVerison,
  latestVesrion = curVerison;
try {
  [compatibleVersion, latestVesrion] = loadPackageVesrion(cliPackageJson.name, curVerison);
  const data = loadPackageFields(`${cliPackageJson.name}@${compatibleVersion}`, 'templateResources') || templateResources;
  templateResources = Array.isArray(data) ? data : [data];
} catch (error) {
  spinner.warn(chalk.yellow('获取最新数据失败,使用本地缓存...'));
  console.log('');
}
spinner.stop();
let cliVersionTips = cliPackageJson.name + '@' + chalk.cyan(curVerison);
if (semver.lt(curVerison, latestVesrion)) {
  cliVersionTips += `, 最新: ${chalk.bright.bgMagentaBright(latestVesrion)}`;
}
cliVersionTips += chalk.bright.bgMagentaBright('\n最新的安装命令已更改为: npm create elux@latest 或 yarn create elux\n');
console.log(cliVersionTips);
const title = [cliVersionTips];
getProjectName({title, templateResources, cliVersion: curVerison});
