import {clearConsole} from '@elux/cli-utils';
import inquirer from 'inquirer';
import buildProject from './buildProject';
import {ITemplate, TPLOptions} from './libs/base';

function askEnsure() {
  return inquirer.prompt({
    type: 'list',
    name: 'ensure',
    message: '请确认...',
    choices: [
      {
        name: '✔ 确认安装',
        value: true,
      },
      {
        name: '✖ 返回重选',
        value: false,
      },
    ],
  });
}

function askOption(message: string, list: string[]) {
  const choices = list.map((item) => {
    const [value, ...others] = item.split('|');
    return {value, name: others.join('|') || value};
  });
  return inquirer.prompt({
    type: 'list',
    name: 'option',
    message,
    choices,
  });
}

export default async function main(args: {
  title: string[];
  template: ITemplate;
  projectName: string;
  projectDir: string;
  repository: string;
  templateDir: string;
}): Promise<void> {
  clearConsole(args.title.join('\n') + '\n');
  const tplOptions: TPLOptions = {projectName: args.projectName};
  let result = args.template.getOptions(tplOptions);
  while (result) {
    const {subject, choices, onSelect} = result;
    const {option} = await askOption(subject, choices);
    result = onSelect(option, tplOptions);
  }
  const {ensure} = await askEnsure();
  if (ensure) {
    const {projectName, projectDir, repository, templateDir, template} = args;
    buildProject({
      projectName,
      projectDir,
      repository,
      templateDir,
      template,
      tplOptions,
    });
  } else {
    setTimeout(() => main(args), 0);
  }
}
