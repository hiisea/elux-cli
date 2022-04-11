"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const loadRepository_1 = require("./create/loadRepository");
const create_1 = __importDefault(require("./create"));
function parseProjectName(input) {
    const cwd = process.cwd();
    const projectDir = path_1.default.resolve(cwd, input);
    const projectName = projectDir.split(path_1.default.sep).pop() || '';
    return { projectName, projectDir };
}
function askProjectName() {
    return inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectNameInput',
            message: 'Enter the new project name',
            validate(input) {
                if (!input) {
                    return 'Can not be empty';
                }
                const { projectName } = parseProjectName(input);
                const result = validate_npm_package_name_1.default(projectName);
                if (!result.validForNewPackages) {
                    const errors = [cli_utils_1.chalk.red(`Invalid project name: ${projectName}`)];
                    [...(result.errors || []), ...(result.warnings || [])].forEach((error) => {
                        errors.push(cli_utils_1.chalk.red(`   ${error}`));
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
            when: ({ projectNameInput }) => {
                const { projectDir } = parseProjectName(projectNameInput);
                return cli_utils_1.fs.existsSync(projectDir);
            },
        },
    ]);
}
async function getProjectName(args) {
    const { templateResources, options } = args;
    const { projectNameInput, override } = await askProjectName();
    if (override === false) {
        setTimeout(() => getProjectName(args), 0);
    }
    else {
        const { projectName, projectDir } = parseProjectName(projectNameInput);
        const title = args.title + `\ncreate project: ${cli_utils_1.chalk.green(projectDir)}`;
        cli_utils_1.clearConsole(title);
        getTemplates({ title, projectName, projectDir, templateResources, options });
    }
}
function askTemplateSource(templateResources) {
    return inquirer_1.default
        .prompt([
        {
            type: 'list',
            name: 'templateSource',
            message: '请选择或输入模板源',
            pageSize: 8,
            loop: false,
            choices: [
                ...templateResources.map((item) => ({ name: `${item.title} [${cli_utils_1.chalk.red(item.count + 'P')}]`, value: item })),
                {
                    name: '输入模版文件URL...',
                    value: 'inputUrl',
                    short: 'Url格式如:http://xxx/xxx.zip',
                },
                {
                    name: '输入本地模版目录...',
                    value: 'inputPath',
                    short: '相对或绝对路径如:../xxx/xxx',
                },
            ],
        },
        {
            type: 'input',
            name: 'templateSourceInputUrl',
            message: '输入模版文件URL',
            when(answers) {
                return answers.templateSource === 'inputUrl';
            },
        },
        {
            type: 'input',
            name: 'templateSourceInputPath',
            message: '输入本地模版目录',
            when(answers) {
                return answers.templateSource === 'inputPath';
            },
        },
    ])
        .then(({ templateSource, templateSourceInputUrl, templateSourceInputPath }) => {
        if (templateSourceInputPath || templateSourceInputUrl) {
            const repository = templateSourceInputPath ? path_1.default.resolve(process.cwd(), templateSourceInputPath) : templateSourceInputUrl;
            return {
                repository,
                summary: repository,
            };
        }
        else {
            return templateSource === 'inputUrl' || templateSource === 'inputPath'
                ? { repository: '', summary: '' }
                : { repository: templateSource.url, summary: templateSource.summary };
        }
    });
}
async function askProxy(systemProxy) {
    const prompts = [];
    if (!systemProxy) {
        prompts.push({
            type: 'input',
            name: 'inputProxy',
            message: '是否需要代理(翻墙)【输入代理地址或回车跳过】',
            validate(input) {
                if (!input) {
                    return true;
                }
                return cli_utils_1.testHttpUrl(input) || cli_utils_1.chalk.red('格式错误如:http://127.0.0.1:1080');
            },
        });
    }
    else {
        prompts.push({
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
        }, {
            type: 'input',
            name: 'inputProxy',
            message: '请输入代理地址',
            validate(input) {
                if (!input) {
                    return true;
                }
                return cli_utils_1.testHttpUrl(input) || cli_utils_1.chalk.red('地址格式错误');
            },
            when(answers) {
                return answers.proxy === 'inputProxy';
            },
        });
    }
    return inquirer_1.default.prompt(prompts).then(({ proxy, inputProxy }) => {
        return typeof proxy === 'string' && proxy !== 'inputProxy' ? proxy : inputProxy || systemProxy;
    });
}
async function getTemplates(args) {
    cli_utils_1.log('');
    const templateSource = await askTemplateSource(args.templateResources);
    const { repository, summary } = templateSource;
    if (!repository) {
        cli_utils_1.log(`${cli_utils_1.chalk.green('Please reselect...')}\n`);
        setTimeout(() => getTemplates(args), 0);
        return;
    }
    summary && cli_utils_1.log('\n' + cli_utils_1.chalk.green.underline(summary));
    let templateDir = repository;
    if (repository.startsWith('http://') || repository.startsWith('https://')) {
        const globalProxy = cli_utils_1.getProxy() || '';
        cli_utils_1.log(cli_utils_1.chalk.magenta('\n* ' + (globalProxy ? `发现全局代理 -> ${globalProxy}` : '未发现全局代理')));
        const proxy = await askProxy(globalProxy);
        cli_utils_1.log(cli_utils_1.chalk.cyan('  Using Proxy -> ' + (proxy || 'none')));
        const spinner = cli_utils_1.ora(`Pulling template from ${cli_utils_1.chalk.blue.underline(repository)}`).start();
        const loadData = await loadRepository_1.loadRepository(repository, proxy).catch((e) => e);
        if (typeof loadData === 'object') {
            spinner.color = 'red';
            spinner.fail(`${cli_utils_1.chalk.red('Pull failed from')} ${cli_utils_1.chalk.blue.underline(repository)}`);
            cli_utils_1.log(`${cli_utils_1.chalk.gray(loadData.toString())}, Maybe you should change an proxy agent.`);
            cli_utils_1.log(`${cli_utils_1.chalk.green('Please reselect...')}\n`);
            setTimeout(() => getTemplates(args), 0);
            return;
        }
        templateDir = loadData;
        spinner.color = 'green';
        spinner.succeed(`${cli_utils_1.chalk.green('Pull successful!')}\n\n`);
    }
    const { projectName, projectDir, options } = args;
    let templates;
    try {
        templates = parseTemplates(templateDir, options.packageJson.version);
    }
    catch (error) {
        cli_utils_1.log(cli_utils_1.chalk.red('✖ 模版解析失败！'));
        cli_utils_1.log(cli_utils_1.chalk.yellow('  ' + error.toString()) + '\n');
        setTimeout(() => getTemplates(args), 0);
        return;
    }
    const pics = templates.reduce((pre, cur) => {
        return pre + cur.platform.length * cur.framework.length * cur.css.length;
    }, 0);
    const title = args.title + `\ntotally [${cli_utils_1.chalk.red(pics + 'P')}] templates are pulled from ${cli_utils_1.chalk.blue.underline(repository)}\n`;
    const creator = new create_1.default(projectName, projectDir, templateDir, options, templates, title);
    creator.create();
}
function parseTemplates(floder, curVerison) {
    const baseFuns = cli_utils_1.fs.readFileSync(path_1.default.join(floder, './base.conf.js')).toString();
    const versionMatch = baseFuns
        .split('\n', 1)[0]
        .replace(/(^\/\*)|(\*\/$)|(^\/\/)/g, '')
        .trim();
    if (!cli_utils_1.semver.satisfies(curVerison, versionMatch)) {
        throw `该模版不能使用当前@elux/cli版本安装（v${curVerison}不满足${versionMatch}）`;
    }
    const templates = [];
    cli_utils_1.readDirSync(floder).forEach((file) => {
        if (file.isFile && file.name.endsWith('.conf.js') && !file.name.endsWith('base.conf.js')) {
            const tplPath = path_1.default.join(floder, file.name);
            const tplScript = cli_utils_1.fs.readFileSync(tplPath).toString();
            const tplFun = new Function(baseFuns + '\n' + tplScript);
            const tpl = tplFun();
            templates.push(tpl);
        }
    });
    return templates;
}
async function main(options) {
    const spinner = cli_utils_1.ora('check the latest data...').start();
    const { packageJson } = options;
    const curVerison = packageJson.version;
    let templateResources = packageJson.templateResources;
    let compatibleVersion = curVerison, latestVesrion = curVerison;
    try {
        [compatibleVersion, latestVesrion] = cli_utils_1.loadPackageVesrion(packageJson.name, curVerison);
        const data = cli_utils_1.loadPackageFields(`${packageJson.name}@${compatibleVersion}`, 'templateResources') || templateResources;
        templateResources = Array.isArray(data) ? data : [data];
    }
    catch (error) {
        spinner.warn(cli_utils_1.chalk.yellow('获取最新数据失败，将使用本地缓存...'));
        cli_utils_1.log('');
    }
    spinner.stop();
    let title = '@elux/cli ' + curVerison;
    if (cli_utils_1.semver.lt(curVerison, latestVesrion)) {
        title += `, ${cli_utils_1.chalk.magenta.underline('可升级最新版本 ' + latestVesrion)}`;
    }
    getProjectName({ title, templateResources, options });
}
module.exports = main;
