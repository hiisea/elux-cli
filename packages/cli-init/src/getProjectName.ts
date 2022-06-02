import path from 'path';
import {chalk, fse, packageNameValidate} from '@elux/cli-utils';
import inquirer from 'inquirer';
import getTemplates from './getTemplates';
import type {TemplateResources} from './libs/base';

function parseProjectName(input: string) {
  const cwd = process.cwd();
  const projectDir = path.resolve(cwd, input);
  const projectName = projectDir.split(path.sep).pop() || '';
  return {projectName, projectDir};
}

function askProjectName(): Promise<{projectNameInput: string; override?: boolean}> {
  console.log('');
  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectNameInput',
      message: '请输入项目名称或目录',
      validate(input: string) {
        if (!input) {
          return '项目名称不能为空';
        }
        const {projectName} = parseProjectName(input);
        const result = packageNameValidate(projectName);
        if (!result.validForNewPackages) {
          const errors: string[] = [chalk.redBright(`无效的项目名称: ${projectName}`)];
          [...(result.errors || []), ...(result.warnings || [])].forEach((error) => {
            errors.push(chalk.yellow(`   ${error}`));
          });
          return errors.join('\n');
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'override',
      message: '目录已经存在, 要合并覆盖它吗?',
      default: false,
      when: ({projectNameInput}) => {
        const {projectDir} = parseProjectName(projectNameInput);
        return fse.existsSync(projectDir);
      },
    },
  ]);
}

export default async function main(args: {title: string[]; templateResources: TemplateResources[]; cliVersion: string}): Promise<void> {
  const {title, templateResources, cliVersion} = args;
  const {projectNameInput, override} = await askProjectName();
  if (override === false) {
    setTimeout(() => main(args), 0);
    return;
  } else {
    const {projectName, projectDir} = parseProjectName(projectNameInput);
    const projectPathTips = `新建项目: ${chalk.green(projectDir)}`;
    console.log(projectPathTips);
    title.push(projectPathTips);
    getTemplates({title, projectName, projectDir, templateResources, cliVersion});
  }
}
