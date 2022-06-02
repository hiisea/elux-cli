import os from 'os';
import path from 'path';
import {chalk, clearConsole, fse, readDirSync, semver, testHttpUrl} from '@elux/cli-utils';
import inquirer from 'inquirer';
import getFeats from './getFeats';
import download from './libs/download';
import type {ITemplate, TemplateResources} from './libs/base';

function askTemplateSource(templateResources: TemplateResources[]): Promise<{repository: string; summary: string}> {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'templateSource',
        message: '请选择或输入模板源',
        pageSize: 8,
        loop: false,
        choices: [
          ...templateResources.map((item) => ({name: `${item.title} [${chalk.redBright(item.count + 'P')}]`, value: item})),
          {
            name: '输入模版文件Url...',
            value: 'inputUrl',
            short: '=> 如:http://xxx/xxx',
          },
          {
            name: '输入本地模版目录...',
            value: 'inputPath',
            short: '=> 相对或绝对路径',
          },
        ],
      },
      {
        type: 'input',
        name: 'templateSourceInputUrl',
        message: '输入模版文件Url',
        when(answers: {templateSource: string}) {
          return answers.templateSource === 'inputUrl';
        },
        validate(input: string) {
          if (!input) {
            return true;
          }
          return testHttpUrl(input) || chalk.redBright('请输入模版文件的Url');
        },
      },
      {
        type: 'input',
        name: 'templateSourceInputPath',
        message: '输入本地模版目录',
        when(answers: {templateSource: string}) {
          return answers.templateSource === 'inputPath';
        },
      },
    ])
    .then(({templateSource, templateSourceInputUrl, templateSourceInputPath}: any) => {
      const input = (templateSourceInputPath || templateSourceInputUrl || '').trim();
      if (input) {
        const repository = input.startsWith('http://') || input.startsWith('https://') ? input : path.resolve(process.cwd(), input);
        return {
          repository,
          summary: repository,
        };
      } else {
        return templateSource === 'inputUrl' || templateSource === 'inputPath'
          ? {repository: '', summary: ''}
          : {repository: templateSource.url, summary: templateSource.summary};
      }
    });
}

async function askProxy(): Promise<string> {
  const prompts: any[] = [];
  prompts.push({
    type: 'input',
    name: 'inputProxy',
    message: '是否需要代理(翻墙)【输入代理地址或回车跳过】',
    validate(input: string) {
      if (!input) {
        return true;
      }
      return testHttpUrl(input) || chalk.redBright('格式如:http://127.0.0.1:1087');
    },
  });
  console.log('');
  return inquirer.prompt(prompts).then(({inputProxy}) => {
    return inputProxy;
  });
}

async function downloadRepository(repository: string): Promise<string> {
  let templateDir: string;
  if (repository.startsWith('http://') || repository.startsWith('https://')) {
    const proxy = await askProxy();
    global['GLOBAL_AGENT'].HTTP_PROXY = proxy || '';
    templateDir = path.join(os.tmpdir(), 'elux-cli-tpl');
    try {
      await download(repository + '/src.zip', templateDir, true);
    } catch (error: any) {
      console.log(chalk.yellow(error.toString()));
      templateDir = '';
    }
  } else {
    templateDir = path.join(repository, 'src');
  }
  return templateDir;
}

function parseTemplates(templateDir: string, cliVerison: string) {
  try {
    const baseFuns = fse.readFileSync(path.join(templateDir, './base.conf.js')).toString();
    const [, versionMatch] = baseFuns.split('\n', 1)[0].match(/@elux\/cli-init@([^ ]+)/) || [];

    if (versionMatch && versionMatch != '*' && !semver.satisfies(cliVerison, versionMatch)) {
      throw `该模版不能使用当前@elux/cli版本安装（v${cliVerison}不满足${versionMatch}）`;
    }
    const templates: ITemplate[] = [];
    readDirSync(templateDir).forEach((file) => {
      if (file.isFile && file.name.endsWith('.conf.js') && !file.name.endsWith('base.conf.js')) {
        const tplPath = path.join(templateDir, file.name);
        const tplScript = fse.readFileSync(tplPath).toString();
        const tplFun = new Function(baseFuns + '\n' + tplScript);
        const tpl = tplFun() as ITemplate;
        templates.push(tpl);
      }
    });
    return templates;
  } catch (error: any) {
    console.log(chalk.redBright('\n✖ 模版解析失败！'));
    console.log(chalk.yellow(error.toString()));
    return;
  }
}

export default async function main(args: {
  title: string[];
  templateResources: TemplateResources[];
  projectName: string;
  projectDir: string;
  cliVersion: string;
}): Promise<void> {
  console.log('');
  const templateSource = await askTemplateSource(args.templateResources);
  const repository = templateSource.repository.trim().replace(/\/+$/, '');
  const summary = templateSource.summary.trim();
  if (!repository) {
    console.log(chalk.green('Please reselect...'));
    setTimeout(() => main(args), 0);
    return;
  }
  clearConsole('\n' + chalk.yellow.bgCyan('【 ' + (summary || repository) + ' 】'));
  const templateDir = await downloadRepository(repository);
  if (!templateDir) {
    console.log(chalk.green('Please reselect...'));
    setTimeout(() => main(args), 0);
    return;
  }
  const templates = parseTemplates(templateDir, args.cliVersion);
  if (!templates) {
    console.log(chalk.green('Please reselect...'));
    setTimeout(() => main(args), 0);
    return;
  }
  const pics = templates.reduce((pre, cur) => {
    return pre + cur.platform.length * cur.framework.length * cur.css.length;
  }, 0);

  const {projectName, projectDir, title} = args;
  title.push(`totally [${chalk.redBright(pics + 'P')}] templates are pulled from ${chalk.cyan.underline(repository)}`);
  getFeats({title, templates, projectName, projectDir, repository, templateDir});
}
