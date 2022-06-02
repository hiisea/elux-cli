import path from 'path';
import {chalk, fse, slash} from '@elux/cli-utils';
import inquirer from 'inquirer';
import * as memFs from 'mem-fs';
import * as editor from 'mem-fs-editor';
import {createTransform, isBinary} from 'mem-fs-editor/lib/util';
import installProject from './installProject';
import {FeatChoices, ITemplate} from './libs/base';
import download from './libs/download';

export default function main({
  projectName,
  projectDir,
  repository,
  templateDir,
  template,
  featChoices,
}: {
  projectName: string;
  projectDir: string;
  repository: string;
  templateDir: string;
  template: ITemplate;
  featChoices: FeatChoices;
}): void {
  console.log('');
  console.log(chalk.yellow('🚀 Generating files...\n'));
  const excludeFiles: {[key: string]: boolean} = {};
  const filter = createTransform(function (this: {push: (file: any) => void}, file: {path: string}, enc: string, cb: (e?: Error) => void) {
    if (excludeFiles[file.path]) {
      cb();
    } else {
      this.push(file);
      cb();
    }
  });
  const tplArgs = {...featChoices, projectName};
  const templateData = template.data ? template.data(tplArgs) : tplArgs;
  const tempDir = path.join(templateDir, './$');
  const operations = template.operation ? template.operation(tplArgs) : [];
  operations.forEach((item) => {
    if (item.from.includes('..') || item.to.includes('..')) {
      return;
    }
    const from = path.join(templateDir, item.from);
    const to = path.join(templateDir, item.to);
    if (item.action === 'copy') {
      fse.copySync(from, to);
    } else if (item.action === 'move') {
      if (item.to) {
        fse.moveSync(from, to, {overwrite: true});
      } else {
        fse.removeSync(from);
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
      chalk.redBright(rpath);
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
        console.log(`${chalk.green('✔ ')}${chalk.gray('Created:')} ${path.relative(projectDir, filepath)}`);
        return filepath;
      },
    }
  );
  fse.removeSync(tempDir);
  mfs.commit([filter], (error) => {
    if (!error) {
      const lockFileName = template.getNpmLockFile(tplArgs);
      buildLockFile({lockFileName, projectDir, repository});
    } else {
      throw error;
    }
  });
}

async function buildLockFile(args: {lockFileName: string; projectDir: string; repository: string}) {
  const {lockFileName, projectDir, repository} = args;
  if (!lockFileName) {
    installProject(projectDir);
    return;
  }
  console.log('\n正在拉取[' + chalk.green('yarn.lock,package-lock.json') + ']用于锁定各依赖安装版本,确保安装顺利...');
  let success: boolean = false;
  if (repository.startsWith('http://') || repository.startsWith('https://')) {
    try {
      await download(`${repository}/${lockFileName}.zip`, projectDir, false);
      success = true;
    } catch (error: any) {
      console.log(chalk.yellow(error.toString()));
    }
  } else {
    const dir = path.join(repository, lockFileName);
    console.log(chalk.cyan.underline('Pulling from ' + dir));
    try {
      fse.copySync(dir, projectDir);
      console.log(`${chalk.green('✔ Pull successful!!!')}\n`);
      success = true;
    } catch (error: any) {
      console.log(chalk.redBright('✖ Pull failed!!!'));
      console.log(chalk.yellow(error.toString()));
    }
  }
  if (success) {
    installProject(projectDir);
    return;
  }
  console.log('');
  inquirer
    .prompt({
      type: 'confirm',
      name: 'skip',
      message: 'Lock文件拉取失败，该文件非必需，是否跳过该文件?',
      default: true,
    })
    .then(({skip}) => {
      if (skip) {
        installProject(projectDir);
        return;
      } else {
        setTimeout(() => buildLockFile(args), 0);
      }
    });
}
