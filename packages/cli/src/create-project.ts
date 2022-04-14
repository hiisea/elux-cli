import path from 'path';
import os from 'os';
import validateProjectName from 'validate-npm-package-name';
import {log, chalk, fs, semver, ora, readDirSync, getProxy, testHttpUrl, clearConsole, loadPackageVesrion, loadPackageFields} from '@elux/cli-utils';
import inquirer from 'inquirer';
import {CommandOptions, TemplateResources, ITemplate} from './create/base';
import {loadRepository} from './create/loadRepository';
import Creator from './create';

function parseProjectName(input: string) {
  const cwd = process.cwd();
  const projectDir = path.resolve(cwd, input);
  const projectName = projectDir.split(path.sep).pop() || '';
  return {projectName, projectDir};
}

function askProjectName(): Promise<{projectNameInput: string; override?: boolean}> {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectNameInput',
      message: 'Enter the new project name',
      validate(input: string) {
        if (!input) {
          return 'Can not be empty';
        }
        const {projectName} = parseProjectName(input);
        const result = validateProjectName(projectName);
        if (!result.validForNewPackages) {
          const errors: string[] = [chalk.red(`Invalid project name: ${projectName}`)];
          [...(result.errors || []), ...(result.warnings || [])].forEach((error) => {
            errors.push(chalk.red(`   ${error}`));
          });
          return errors.join('\n');
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'override',
      message: 'Directory already exists, Merge and override it?',
      default: false,
      when: ({projectNameInput}) => {
        const {projectDir} = parseProjectName(projectNameInput);
        return fs.existsSync(projectDir);
      },
    },
  ]);
}
async function getProjectName(args: {title: string; templateResources: TemplateResources[]; options: CommandOptions}) {
  const {templateResources, options} = args;
  const {projectNameInput, override} = await askProjectName();
  if (override === false) {
    setTimeout(() => getProjectName(args), 0);
  } else {
    const {projectName, projectDir} = parseProjectName(projectNameInput);
    const title = args.title + `\ncreate project: ${chalk.green(projectDir)}`;
    clearConsole(title);
    getTemplates({title, projectName, projectDir, templateResources, options});
  }
}
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
          ...templateResources.map((item) => ({name: `${item.title} [${chalk.red(item.count + 'P')}]`, value: item})),
          {
            name: '输入模版文件Url...',
            value: 'inputUrl',
            short: '=> url格式如:http://xxx/xxx.zip',
          },
          {
            name: '输入本地模版目录...',
            value: 'inputPath',
            short: '=> 相对或绝对路径如:../xxx/xxx',
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
async function askProxy(systemProxy: string): Promise<string> {
  const prompts: any[] = [];
  if (!systemProxy) {
    prompts.push({
      type: 'input',
      name: 'inputProxy',
      message: '是否需要代理(翻墙)【输入代理地址或回车跳过】',
      validate(input: string) {
        if (!input) {
          return true;
        }
        return testHttpUrl(input) || chalk.red('格式如 http://127.0.0.1:1080');
      },
    });
  } else {
    prompts.push(
      {
        type: 'list',
        name: 'proxy',
        message: '是否需要代理(翻墙)',
        choices: [
          {
            name: '使用全局代理',
            value: systemProxy,
          },
          {
            name: '不使用代理',
            value: '',
          },
          {
            name: '输入代理地址',
            value: 'inputProxy',
            short: '格式如 http://127.0.0.1:1080',
          },
        ],
      },
      {
        type: 'input',
        name: 'inputProxy',
        message: '请输入代理地址',
        validate(input: string) {
          if (!input) {
            return true;
          }
          return testHttpUrl(input) || chalk.red('格式如 http://127.0.0.1:1080');
        },
        when(answers: {proxy: string}) {
          return answers.proxy === 'inputProxy';
        },
      }
    );
  }
  return inquirer.prompt(prompts).then(({proxy, inputProxy}: any) => {
    return typeof proxy === 'string' && proxy !== 'inputProxy' ? proxy : inputProxy || systemProxy;
  });
}

async function getTemplates(args: {
  title: string;
  projectName: string;
  projectDir: string;
  templateResources: TemplateResources[];
  options: CommandOptions;
}): Promise<void> {
  log('');
  const templateSource = await askTemplateSource(args.templateResources);
  const repository = templateSource.repository.trim();
  const summary = templateSource.summary.trim();
  if (!repository) {
    log(chalk.green('Please reselect...'));
    setTimeout(() => getTemplates(args), 0);
    return;
  }
  clearConsole(chalk.green.underline('【 ' + (summary || repository) + ' 】'));
  let templateDir: string = repository;
  if (repository.startsWith('http://') || repository.startsWith('https://')) {
    const globalProxy = getProxy() || '';
    log(chalk.cyan('\n* ' + (globalProxy ? `发现全局代理 -> ${globalProxy}` : '未发现全局代理')));
    const proxy = await askProxy(globalProxy);
    global['GLOBAL_AGENT'].HTTP_PROXY = proxy || '';
    templateDir = path.join(os.tmpdir(), 'elux-cli-tpl');
    try {
      await loadRepository(repository, templateDir, true);
    } catch (error: any) {
      log(chalk.green('Please reselect...'));
      setTimeout(() => getTemplates(args), 0);
      return;
    }
  }
  //templateDir = 'C:\\my\\cli\\src';
  const {projectName, projectDir, options} = args;
  let templates: ITemplate[];
  try {
    templates = parseTemplates(templateDir, options.packageJson.version);
  } catch (error: any) {
    log(chalk.red('\n✖ 模版解析失败！'));
    log(chalk.yellow(error.toString()));
    log(chalk.green('Please reselect...'));
    setTimeout(() => getTemplates(args), 0);
    return;
  }
  const pics = templates.reduce((pre, cur) => {
    return pre + cur.platform.length * cur.framework.length * cur.css.length;
  }, 0);
  const title = args.title + `\ntotally [${chalk.red(pics + 'P')}] templates are pulled from ${chalk.blue.underline(repository)}\n`;
  const creator = new Creator(projectName, projectDir, templateDir, options, templates, title);
  creator.create();
}
function parseTemplates(floder: string, curVerison: string): ITemplate[] {
  const baseFuns = fs.readFileSync(path.join(floder, './base.conf.js')).toString();
  const versionMatch = baseFuns
    .split('\n', 1)[0]
    .replace(/(^\/\*)|(\*\/$)|(^\/\/)/g, '')
    .trim();
  if (!semver.satisfies(curVerison, versionMatch)) {
    throw `该模版不能使用当前@elux/cli版本安装（v${curVerison}不满足${versionMatch}）`;
  }
  const templates: ITemplate[] = [];
  readDirSync(floder).forEach((file) => {
    if (file.isFile && file.name.endsWith('.conf.js') && !file.name.endsWith('base.conf.js')) {
      const tplPath = path.join(floder, file.name);
      const tplScript = fs.readFileSync(tplPath).toString();
      const tplFun = new Function(baseFuns + '\n' + tplScript);
      const tpl = tplFun() as ITemplate;
      templates.push(tpl);
    }
  });
  return templates;
}

async function main(options: CommandOptions): Promise<void> {
  const spinner = ora('check the latest data...').start();
  const {packageJson} = options;
  const curVerison = packageJson.version;
  let templateResources = packageJson.templateResources;
  let compatibleVersion: string = curVerison,
    latestVesrion: string = curVerison;
  try {
    [compatibleVersion, latestVesrion] = loadPackageVesrion(packageJson.name, curVerison);
    const data = loadPackageFields(`${packageJson.name}@${compatibleVersion}`, 'templateResources') || templateResources;
    templateResources = Array.isArray(data) ? data : [data];
  } catch (error) {
    spinner.warn(chalk.yellow('获取最新数据失败,使用本地缓存...'));
    log('');
  }
  spinner.stop();
  let title = '@elux/cli: ' + chalk.cyan(curVerison);
  if (semver.lt(curVerison, latestVesrion)) {
    title += `,${chalk.magenta('可升级最新版本:' + latestVesrion)}`;
  }
  getProjectName({title, templateResources, options});
}

export = main;
