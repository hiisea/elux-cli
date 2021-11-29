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
    log('- 以下目录需要安装依赖 ' + chalk.cyan('yarn install') + chalk.yellow(' (推荐yarn，支持workspaces一次性安装)'));
    template.install.forEach((dir) => {
      log(chalk.green(`  ${dir}`));
    });
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
  const tempDir = path.join(template.path, '../__temp__');
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
  template.copy.forEach((item) => {
    const from = path.join(template.path, item.from);
    const to = path.join(tempDir, item.to);
    fs.copySync(from, to);
  });
  template.move.forEach((item) => {
    const from = path.join(tempDir, item.from);
    if (item.to) {
      const to = path.join(tempDir, item.to);
      fs.moveSync(from, to, {overwrite: true});
    } else {
      fs.removeSync(from);
    }
  });
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
          name: 'yarn install(推荐)',
          value: 'yarn',
        });
      }
      if (npmVersion) {
        choices.push({
          name: 'npm install' + (semver.lt(npmVersion, '6.9.0') ? chalk.red('(Current version < 6.9.0, May cause exceptions!)') : ''),
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
