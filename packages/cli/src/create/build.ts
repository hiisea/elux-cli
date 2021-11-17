import * as memFs from 'mem-fs';
import * as editor from 'mem-fs-editor';
import path from 'path';
import inquirer from 'inquirer';
import {createTransform} from 'mem-fs-editor/lib/util';
import {fs, log, platform, clearConsole, chalk, slash, semver, execa, ora} from '@elux/cli-utils';
import {FeatChoices, ITemplate, TEMPLATE_CREATOR} from './base';

let logInstallInfo: () => void = () => undefined;
let logSuccessInfo: () => void = () => undefined;

async function build({
  projectName,
  projectDir,
  templateDir,
  template,
  featChoices,
}: {
  projectName: string;
  projectDir: string;
  templateDir: string;
  template: ITemplate;
  featChoices: FeatChoices;
}): Promise<void> {
  log(chalk.red('\n🚀 Generating files...\n'));
  const cdPath = path.relative(process.cwd(), projectDir);
  const excludeFiles: {[key: string]: boolean} = {
    [path.resolve(projectDir, TEMPLATE_CREATOR)]: true,
  };
  const filter = createTransform(function (this: {push: (file: any) => void}, file: {path: string}, enc: string, cb: (e?: Error) => void) {
    if (excludeFiles[file.path]) {
      cb();
    } else {
      this.push(file);
      cb();
    }
  });
  logInstallInfo = function () {
    log('');
    log('- 进入项目 ' + chalk.cyan(`cd ${cdPath}`));
    log('- 以下目录需要安装依赖 ' + chalk.cyan('yarn install') + chalk.yellow(' (推荐使用yarn，支持workspaces一次性安装所有依赖)'));
    template.install.forEach((dir) => {
      log(chalk.green(`  ${dir}`));
    });
    log('- 运行程序 ' + chalk.cyan('yarn start') + chalk.yellow(' (或留意查看readme.txt)'));
    log('');
  };
  logSuccessInfo = function () {
    log('');
    log(chalk.black.bold('✨ 准备好啦！开始工作吧！\n'));
    log(chalk.green('- 进入目录 ') + chalk.cyan(`cd ${cdPath}`));
    log(chalk.green('- 运行程序 ') + chalk.cyan('yarn start') + chalk.yellow(' (或留意查看readme.txt)'));
    log('');
  };
  const store = memFs.create();
  const mfs = editor.create(store);
  template.include.forEach((dir) => {
    const src = path.join(template.path, dir);
    fs.copySync(src, template.path);
  });
  mfs.copyTpl(
    template.path,
    projectDir,
    template.data({...featChoices, projectName}),
    {escape: (str) => str},
    {
      globOptions: {
        dot: true,
      },
      processDestinationPath: (filepath: string) => {
        filepath = filepath.replace(/.ejs$/, '');
        let rpath = './' + slash(path.relative(projectDir, filepath));
        if (template.rename['*']) {
          const changedPath = template.rename['*'](featChoices, rpath);
          if (changedPath) {
            filepath = path.resolve(projectDir, changedPath);
          } else {
            excludeFiles[filepath] = true;
            return filepath;
          }
        }
        rpath = './' + slash(path.relative(projectDir, filepath));
        const handler = template.rename[rpath];
        if (handler) {
          const changedPath = handler(featChoices, rpath);
          if (changedPath) {
            filepath = path.resolve(projectDir, changedPath);
          } else {
            excludeFiles[filepath] = true;
            return filepath;
          }
        }
        log(`${chalk.green('✔ ')}${chalk.gray('Created:')} ${path.relative(projectDir, filepath)}`);
        return filepath;
      },
    }
  );
  mfs.commit([filter], (error) => {
    if (!error) {
      clearConsole(chalk.magenta('🎉 项目创建成功!!! 接下来...\n'));
      logInstallInfo();
      log('');
      const {yarnVersion, npmVersion, cnpmVersion} = platform;
      const choices: any[] = [];
      if (yarnVersion) {
        choices.push({
          name: 'yarn install(推荐)',
          value: 'yarn',
        });
      }
      if (npmVersion) {
        choices.push({
          name: 'npm install' + (semver.lt(npmVersion, '6.9.0') ? chalk.red('(Current version < 6.9.0,May cause exceptions!)') : ''),
          value: 'npm',
        });
      }
      if (cnpmVersion) {
        choices.push({
          name: 'cnpm install',
          value: 'cnpm',
        });
      }
      choices.push({
        name: '稍后安装...',
        value: '',
      });
      return inquirer
        .prompt({
          type: 'list',
          name: 'installCmd',
          message: chalk.green('是否自动安装依赖'),
          choices,
        })
        .then(({installCmd}) => {
          if (installCmd) {
            const subDirs = installCmd === 'yarn' ? [template.install[0]] : template.install;
            const installExec: [string, string[]] =
              installCmd === 'npm' && semver.gte(npmVersion, '7.0.0') ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
            log('');
            setTimeout(() => install(installExec, projectDir, subDirs), 0);
          }
          return;
        });
    } else {
      throw error;
    }
  });
}

function install(installExec: [string, string[]], projectDir: string, subDirs: string[]) {
  const dir = subDirs.shift() as string;
  log(`  正在为 ${chalk.green(dir)} 安装依赖，请稍后...`);
  const spinner = ora('...').start();
  process.chdir(path.resolve(projectDir, dir));
  const subProcess = execa(installExec[0], installExec[1]);
  subProcess.stdin!.pipe(process.stdin);
  subProcess.stdout!.pipe(process.stdout);
  subProcess.stderr!.pipe(process.stderr);
  subProcess.then(
    () => {
      spinner.stop();
      if (subDirs.length > 0) {
        setTimeout(() => install(installExec, projectDir, subDirs), 0);
      } else {
        log(chalk.green('\n✔ 项目依赖安装成功！'));
        logSuccessInfo();
      }
    },
    () => {
      spinner.stop();
      log(chalk.red('\n✖ 项目依赖安装失败，请稍后自行安装！\n\n'));
      logInstallInfo();
    }
  );
}

export = build;
