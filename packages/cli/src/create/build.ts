import * as memFs from 'mem-fs';
import * as editor from 'mem-fs-editor';
import path from 'path';
import inquirer from 'inquirer';
import {createTransform, isBinary} from 'mem-fs-editor/lib/util';
import {fs, log, platform, clearConsole, chalk, slash, semver, execa, ora} from '@elux/cli-utils';
import {FeatChoices, ITemplate} from './base';

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
  const excludeFiles: {[key: string]: boolean} = {};
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
    log('- 安装依赖 ' + chalk.cyan('yarn install') + chalk.yellow(' (或"npm install --legacy-peer-deps",npm版本需>=7.0)'));
    log('- 运行程序 ' + chalk.cyan('yarn start') + chalk.yellow(' (或查看readme.txt)'));
    log('');
  };
  logSuccessInfo = function () {
    log('');
    log(chalk.black.bold('✨ 准备好啦！开始工作吧！\n'));
    log(chalk.green('- 进入目录 ') + chalk.cyan(`cd ${cdPath}`));
    log(chalk.green('- 运行程序 ') + chalk.cyan('yarn start') + chalk.yellow(' (或查看readme.txt)'));
    log('');
  };
  const templateData = template.data ? template.data({...featChoices, projectName}) : {...featChoices, projectName};
  const tempDir = path.join(templateDir, './$');

  (template.operation || []).forEach((item) => {
    if (item.from.includes('..') || item.to.includes('..')) {
      return;
    }
    const from = path.join(templateDir, item.from);
    const to = path.join(templateDir, item.to);
    if (item.action === 'copy') {
      fs.copySync(from, to);
    } else if (item.action === 'move') {
      if (item.to) {
        fs.moveSync(from, to, {overwrite: true});
      } else {
        fs.removeSync(from);
      }
    }
  });
  const store = memFs.create();
  const mfs = editor.create(store);
  const processTpl = mfs['_processTpl'] as (args: any) => string | Object;
  mfs['_processTpl'] = function (
    this: any,
    args: {contents: Object; filename: string; context: Record<string, any>; tplSettings: Record<string, any>}
  ): string | Object {
    const {filename, contents} = args;
    if (isBinary(filename, contents)) {
      return contents;
    }
    let code = contents.toString();
    const rpath = './' + slash(path.relative(tempDir, filename.replace(/.ejs$/, '')));
    if (template.beforeRender) {
      code = template.beforeRender(templateData, rpath, code);
    }
    try {
      code = processTpl.call(this, {...args, contents: code}) as string;
    } catch (error) {
      chalk.red(rpath);
      throw error;
    }
    if (template.afterRender) {
      code = template.afterRender(templateData, rpath, code);
    }
    return code;
  };
  mfs.copyTpl(
    tempDir,
    projectDir,
    templateData,
    {escape: (str) => str},
    {
      globOptions: {
        dot: true,
      },
      processDestinationPath: (filepath: string) => {
        filepath = filepath.replace(/.ejs$/, '');
        const rpath = './' + slash(path.relative(projectDir, filepath));
        if (template.rename) {
          const changedPath = template.rename(templateData, rpath);
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
  fs.removeSync(tempDir);
  mfs.commit([filter], (error) => {
    if (!error) {
      clearConsole(chalk.magenta('🎉 项目创建成功!!! 接下来...\n'));
      logInstallInfo();
      log('');
      const {yarnVersion, npmVersion, cnpmVersion} = platform;
      const choices: any[] = [];
      if (yarnVersion) {
        choices.push({
          name: 'yarn install',
          value: 'yarn',
        });
      }
      if (npmVersion) {
        choices.push({
          name: 'npm install' + (semver.lt(npmVersion, '7.0.0') ? chalk.red('(当前版本<7.0.0,不可用!)') : ''),
          value: semver.lt(npmVersion, '7.0.0') ? '' : 'npm',
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
            //const subDirs = installCmd === 'yarn' ? [template.install[0]] : template.install;
            const installExec: [string, string[]] =
              installCmd === 'npm' ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
            log('');
            setTimeout(() => install(installExec, projectDir), 0);
          }
        });
    } else {
      throw error;
    }
  });
}

function install(installExec: [string, string[]], projectDir: string) {
  log(`  正在安装依赖，请稍后...`);
  const spinner = ora('...').start();
  process.chdir(path.resolve(projectDir));
  const subProcess = execa(installExec[0], installExec[1]);
  subProcess.stdin!.pipe(process.stdin);
  subProcess.stdout!.pipe(process.stdout);
  subProcess.stderr!.pipe(process.stderr);
  subProcess.then(
    () => {
      spinner.stop();
      log(chalk.green('\n✔ 项目依赖安装成功！'));
      logSuccessInfo();
    },
    () => {
      spinner.stop();
      log(chalk.red('\n✖ 项目依赖安装失败，请稍后自行安装！\n\n'));
      logInstallInfo();
    }
  );
}

export = build;
