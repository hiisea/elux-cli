import path from 'path';
import validateProjectName from 'validate-npm-package-name';
import {log, chalk, fs, semver, ora, readDirSync, got, getProxy, testHttpUrl, clearConsole} from '@elux/cli-utils';
import inquirer from 'inquirer';
import {CommandOptions, PackageJson, TemplateResources, ITemplate, TEMPLATE_CREATOR, PACKAGE_INFO_GITEE, USER_AGENT} from './create/base';
import {loadRepository} from './create/loadRepository';
import Creator from './create';

function parseProjectName(input: string) {
  const cwd = process.cwd();
  const inCurrent = input === '.';
  const projectName = inCurrent ? path.relative('../', cwd) : input;
  const projectDir = path.resolve(cwd, input);
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
function askTemplateSource(templateResources: TemplateResources[]): Promise<string> {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'templateSource',
        message: '请选择或输入远程模板源',
        pageSize: 8,
        loop: false,
        choices: [
          ...templateResources.map((item) => ({name: `${item.title} [${chalk.red(item.count + 'P')}]`, value: item.url})),
          {
            name: '输入Http下载地址...',
            value: 'inputHttp',
          },
          {
            name: '输入GitClone地址...',
            value: 'inputClone',
          },
        ],
      },
      {
        type: 'input',
        name: 'templateSourceInputHttp',
        message: '输入Http下载地址',
        when(answers: {templateSource: string}) {
          return answers.templateSource === 'inputHttp';
        },
      },
      {
        type: 'input',
        name: 'templateSourceInputClone',
        message: '输入GitClone地址',
        when(answers: {templateSource: string}) {
          return answers.templateSource === 'inputClone';
        },
      },
    ])
    .then(({templateSource, templateSourceInputHttp, templateSourceInputClone}: any) => {
      if (templateSourceInputClone) {
        return 'clone://' + templateSourceInputClone;
      } else if (templateSourceInputHttp) {
        return templateSourceInputHttp;
      } else {
        return templateSource === 'inputHttp' || templateSource === 'inputClone' ? '' : templateSource;
      }
    });
}
async function askProxy(systemProxy: string): Promise<string> {
  const prompts: any[] = [];
  if (!systemProxy) {
    prompts.push({
      type: 'input',
      name: 'inputProxy',
      message: '是否需要设置代理',
      validate(input: string) {
        if (!input) {
          return true;
        }
        return testHttpUrl(input) || chalk.red('格式错误，如:http://127.0.0.1:1080');
      },
    });
  } else {
    prompts.push(
      {
        type: 'list',
        name: 'proxy',
        message: '是否需要设置代理',
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
          return testHttpUrl(input) || chalk.red('格式错误，如:http://127.0.0.1:1080');
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
  let repository = await askTemplateSource(args.templateResources);
  if (!repository) {
    log(`${chalk.green('Please reselect...')}\n`);
    setTimeout(() => getTemplates(args), 0);
    return;
  }
  let isClone = false;
  if (repository.startsWith('clone://')) {
    isClone = true;
    repository = repository.replace('clone://', '');
  }
  const globalProxy = getProxy() || '';
  log(chalk.magenta('\n* ' + globalProxy ? `发现全局代理设置 -> ${globalProxy}` : '未发现全局代理设置'));
  const proxy = await askProxy(globalProxy);
  log(chalk.cyan('  Using Proxy -> ' + (proxy || 'none')));
  const spinner = ora(`Pulling template from ${chalk.blue.underline(repository)}`).start();
  const templateDir: string | Object = await loadRepository(repository, isClone, proxy).catch((e) => e);
  //const templateDir: any = 'C:\\my\\cli\\src';
  if (typeof templateDir === 'object') {
    spinner.color = 'red';
    spinner.fail(`${chalk.red('Pull failed from')} ${chalk.blue.underline(repository)}`);
    log(`${chalk.gray(templateDir.toString())}, Maybe you should change an proxy agent.`);
    log(`${chalk.green('Please reselect...')}\n`);
    setTimeout(() => getTemplates(args), 0);
  } else {
    spinner.color = 'green';
    spinner.succeed(`${chalk.green('Pull successful!')}\n\n`);
    const templates = parseTemplates(templateDir);
    const title = args.title + `\ntotally [${chalk.red(templates.length + 'P')}] templates are pulled from ${chalk.blue.underline(repository)}\n`;
    const {projectName, projectDir, options} = args;
    const creator = new Creator(projectName, projectDir, templateDir, options, templates, title);
    creator.create();
  }
}
function parseTemplates(floder: string): ITemplate[] {
  const subDirs = readDirSync(floder)
    .filter((file) => file.isDirectory)
    .map((file) => file.name);
  const templates: any[] = subDirs
    .map((name) => {
      const dir = path.join(floder, name);
      const creatorFile = path.join(dir, TEMPLATE_CREATOR);
      if (!fs.existsSync(creatorFile)) {
        return null;
      }
      const {
        framework = [],
        platform = [],
        title = '',
        css = [],
        data = (options) => options,
        include = [],
        rename = {},
        install = ['./', './mock'],
      } = require(creatorFile) as ITemplate;
      return {
        name,
        title,
        platform,
        framework,
        css,
        path: dir,
        data,
        include,
        rename,
        install,
      };
    })
    .filter(Boolean);
  return templates as ITemplate[];
}

async function main(options: CommandOptions): Promise<void> {
  const spinner = ora('check the latest data...').start();
  const response: PackageJson = await got(PACKAGE_INFO_GITEE, {
    timeout: 15000,
    retry: 0,
    responseType: 'json' as const,
    headers: {
      'user-agent': USER_AGENT,
    },
  }).then(
    (response) => {
      spinner.stop();
      return response.body as PackageJson;
    },
    () => {
      spinner.warn(chalk.yellow('Failed to get the latest data. Use local cache.'));
      log('');
      return options.packageJson;
    }
  );
  const curVerison = options.packageJson.version;
  const {version: latestVesrion, templateResources} = response;
  let title = '@elux/cli ' + curVerison;
  if (semver.lt(curVerison, latestVesrion)) {
    title += `, ${chalk.magenta('New version available ' + latestVesrion)}`;
  }
  getProjectName({title, templateResources, options});
}

export = main;
