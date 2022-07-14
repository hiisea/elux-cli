import path from 'path';
import {chalk, clearConsole, execa, fse, getCmdVersion, semver} from '@elux/cli-utils';
import inquirer from 'inquirer';

let logInstallInfo: () => void = () => undefined;
let logSuccessInfo: () => void = () => undefined;

export default function main(projectDir: string, shouldEslint: boolean): void {
  const cdPath = path.relative(process.cwd(), projectDir);
  process.chdir(path.resolve(projectDir));
  logInstallInfo = function () {
    console.log('');
    console.log('- 进入项目 ' + chalk.cyan(`cd ${cdPath}`));
    console.log('- 安装依赖 ' + chalk.cyan('yarn install') + chalk.yellow(' (或"npm install --legacy-peer-deps",npm版本需>=7.0)'));
    console.log('- 运行程序 ' + chalk.cyan('yarn start') + chalk.yellow(' (或查看readme)'));
    console.log('');
  };
  logSuccessInfo = function () {
    console.log('');
    console.log(chalk.bold('✨ 准备好啦！开始工作吧！\n'));
    console.log('- 进入目录 ' + chalk.cyan(`cd ${cdPath}`));
    console.log('- 运行程序 ' + chalk.cyan('yarn start') + chalk.yellow(' (或查看readme)'));
    console.log('');
  };
  console.log('');
  if (shouldEslint) {
    console.log(chalk.cyan('🦋 正在执行ESLint...'));
    const babelConfig = [path.join(projectDir, 'babel.config.js'), path.join(projectDir, '.babelrc.js')];
    if (fse.existsSync(babelConfig[0])) {
      fse.renameSync(babelConfig[0], babelConfig[0] + '_');
    }
    if (fse.existsSync(babelConfig[1])) {
      fse.renameSync(babelConfig[1], babelConfig[1] + '_');
    }
    const eslintPlugin = require.resolve('@elux/eslint-plugin');
    let eslintCmd = path.join(eslintPlugin.substring(0, eslintPlugin.lastIndexOf('node_modules')), 'node_modules/.bin/eslint');
    if (!fse.existsSync(eslintCmd)) {
      eslintCmd = path.join(eslintPlugin.substring(0, eslintPlugin.lastIndexOf('@elux')), '@elux/eslint-plugin/node_modules/.bin/eslint');
    }
    const configPath = path.join(__dirname, `./format.js`);
    const subProcess = execa(eslintCmd, ['--config', configPath, '--no-eslintrc', '--fix', '--ext', '.js,.ts,.jsx,.tsx,.vue', './']);
    subProcess.stdin!.pipe(process.stdin);
    subProcess.stdout!.pipe(process.stdout);
    subProcess.stderr!.pipe(process.stderr);
    subProcess.then(
      () => {
        if (fse.existsSync(babelConfig[0] + '_')) {
          fse.renameSync(babelConfig[0] + '_', babelConfig[0]);
        }
        if (fse.existsSync(babelConfig[1] + '_')) {
          fse.renameSync(babelConfig[1] + '_', babelConfig[1]);
        }
        console.log('');
        clearConsole(chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(chalk.yellow('   ✔ ESLint执行成功!'));
        beforeInstall(projectDir);
      },
      () => {
        if (fse.existsSync(babelConfig[0] + '_')) {
          fse.renameSync(babelConfig[0] + '_', babelConfig[0]);
        }
        if (fse.existsSync(babelConfig[1] + '_')) {
          fse.renameSync(babelConfig[1] + '_', babelConfig[1]);
        }
        console.log('');
        clearConsole(chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(chalk.redBright('   ✖ ESLint执行失败，请稍后自行运行!'));
        beforeInstall(projectDir);
      }
    );
  } else {
    clearConsole(chalk.green('🎉 项目创建成功!!! 接下来...'));
    beforeInstall(projectDir);
  }
}
function beforeInstall(projectDir: string) {
  logInstallInfo();
  console.log('');
  const yarnVersion = getCmdVersion('yarn');
  const npmVersion = getCmdVersion('npm');

  const choices: any[] = [];
  if (yarnVersion) {
    choices.push({
      name: 'yarn install',
      value: 'yarn',
    });
  }
  if (npmVersion) {
    choices.push({
      name: 'npm install' + (semver.lt(npmVersion, '7.0.0') ? chalk.redBright('(当前版本<7.0.0,不可用!)') : ''),
      value: semver.lt(npmVersion, '7.0.0') ? '' : 'npm',
    });
  }
  choices.push({
    name: '稍后安装...',
    value: '',
  });
  inquirer
    .prompt({
      type: 'list',
      name: 'installCmd',
      message: chalk.green('是否自动安装依赖'),
      choices,
    })
    .then(({installCmd}) => {
      console.log('');
      if (installCmd) {
        const installExec: [string, string[]] = installCmd === 'npm' ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
        setTimeout(() => installNPM(installExec), 0);
      }
    });
}

function installNPM(installExec: [string, string[]]) {
  console.log(`  正在安装依赖，请稍后...`);
  const subProcess = execa(installExec[0], installExec[1]);
  subProcess.stdin!.pipe(process.stdin);
  subProcess.stdout!.pipe(process.stdout);
  subProcess.stderr!.pipe(process.stderr);
  subProcess.then(
    () => {
      console.log('');
      console.log(chalk.green('✔ 项目依赖安装成功！'));
      logSuccessInfo();
    },
    () => {
      console.log('');
      console.log(chalk.redBright('✖ 项目依赖安装失败，请稍后自行安装！'));
      logInstallInfo();
    }
  );
}
