import path from 'path';
import validateProjectName from 'validate-npm-package-name';
import {log, chalk, fs, semver, ora, readDirSync, got} from '@elux/cli-utils';
import inquirer from 'inquirer';
import {CommandOptions, PackageJson, TemplateResources, ITemplate, TEMPLATE_CREATOR, PACKAGE_INFO_GITEE, PACKAGE_INFO_GITHUB} from './create/base';
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
    const title = args.title + `\ncreate project: ${chalk.green.underline(projectDir)}`;
    log('');
    log(title);
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
        message: 'Please enter the URL to download',
        when(answers: {templateSource: string}) {
          return answers.templateSource === 'inputHttp';
        },
      },
      {
        type: 'input',
        name: 'templateSourceInputClone',
        message: 'Please enter the URL to clone',
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
    log(`${chalk.green('  Please reselect...')}\n`);
    setTimeout(() => getTemplates(args), 0);
    return;
  }
  let isClone = false;
  if (repository.startsWith('clone://')) {
    isClone = true;
    repository = repository.replace('clone://', '');
  }
  const spinner = ora(`Pulling template from ${chalk.blue.underline(repository)}`).start();
  const templateDir: string | Object = await loadRepository(repository, isClone).catch((e) => e);
  //const templateDir: any = 'C:\\my\\cli\\src';
  if (typeof templateDir === 'object') {
    spinner.color = 'red';
    spinner.fail(`${chalk.red('Pull failed from')} ${chalk.blue.underline(repository)}`);
    log(`${chalk.gray(templateDir.toString())}`);
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
  const spinner = ora('Check the latest data...').start();
  const requestOptions = {timeout: 15000, retry: 0, responseType: 'json' as const};
  const response: PackageJson = await Promise.race([got(PACKAGE_INFO_GITEE, requestOptions), got(PACKAGE_INFO_GITHUB, requestOptions)]).then(
    (response) => {
      spinner.stop();
      return response.body as PackageJson;
    },
    () => {
      spinner.warn(chalk.yellow('Failed to get the latest data. Use local cache.'));
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
