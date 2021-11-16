"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const base_1 = require("./create/base");
const loadRepository_1 = require("./create/loadRepository");
const create_1 = __importDefault(require("./create"));
function parseProjectName(input) {
    const cwd = process.cwd();
    const inCurrent = input === '.';
    const projectName = inCurrent ? path_1.default.relative('../', cwd) : input;
    const projectDir = path_1.default.resolve(cwd, input);
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
        const title = args.title + `\ncreate project: ${cli_utils_1.chalk.green.underline(projectDir)}`;
        cli_utils_1.log('');
        cli_utils_1.log(title);
        getTemplates({ title, projectName, projectDir, templateResources, options });
    }
}
function askTemplateSource(templateResources) {
    return inquirer_1.default
        .prompt([
        {
            type: 'list',
            name: 'templateSource',
            message: '请选择或输入远程模板源',
            choices: [
                ...templateResources.map((item) => ({ name: `${item.title} [${cli_utils_1.chalk.red(item.count + 'P')}]`, value: item.url })),
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
            when(answers) {
                return answers.templateSource === 'inputHttp';
            },
        },
        {
            type: 'input',
            name: 'templateSourceInputClone',
            message: '输入GitClone地址',
            when(answers) {
                return answers.templateSource === 'inputClone';
            },
        },
    ])
        .then(({ templateSource, templateSourceInputHttp, templateSourceInputClone }) => {
        if (templateSourceInputClone) {
            return 'clone://' + templateSourceInputClone;
        }
        else if (templateSourceInputHttp) {
            return templateSourceInputHttp;
        }
        else {
            return templateSource === 'inputHttp' || templateSource === 'inputClone' ? '' : templateSource;
        }
    });
}
function askProxy(systemProxy) {
    const prompts = [
        {
            type: 'confirm',
            name: 'customProxy',
            default: false,
            message: '是否需要设置代理',
        },
    ];
    if (!systemProxy) {
        prompts.push({
            type: 'input',
            name: 'inputProxy',
            message: '请输入代理地址',
            default: 'http://127.0.0.1:1080',
            when(answers) {
                return answers.customProxy;
            },
        });
    }
    else {
        prompts.push({
            type: 'list',
            name: 'proxy',
            message: '代理设置',
            choices: [
                {
                    name: '使用系统代理',
                    value: systemProxy,
                },
                {
                    name: '不使用代理',
                    value: '',
                },
                {
                    name: '输入代理...',
                    value: 'inputProxy',
                },
            ],
            when(answers) {
                return answers.customProxy;
            },
        });
        prompts.push({
            type: 'input',
            name: 'inputProxy',
            message: '请输入代理地址',
            default: systemProxy,
            when(answers) {
                return answers.proxy === 'inputProxy';
            },
        });
    }
    return inquirer_1.default.prompt(prompts).then(({ customProxy, proxy, inputProxy }) => {
        if (!customProxy) {
            return systemProxy;
        }
        else if (typeof proxy === 'string' && proxy !== 'inputProxy') {
            return proxy;
        }
        else {
            return inputProxy || systemProxy;
        }
    });
}
async function getTemplates(args) {
    cli_utils_1.log('');
    let repository = await askTemplateSource(args.templateResources);
    if (!repository) {
        cli_utils_1.log(`${cli_utils_1.chalk.green('Please reselect...')}\n`);
        setTimeout(() => getTemplates(args), 0);
        return;
    }
    let isClone = false;
    if (repository.startsWith('clone://')) {
        isClone = true;
        repository = repository.replace('clone://', '');
    }
    const spinner = cli_utils_1.ora(`Pulling template from ${cli_utils_1.chalk.blue.underline(repository)}`).start();
    const templateDir = await loadRepository_1.loadRepository(repository, isClone, args.options.proxy).catch((e) => e);
    if (typeof templateDir === 'object') {
        spinner.color = 'red';
        spinner.fail(`${cli_utils_1.chalk.red('Pull failed from')} ${cli_utils_1.chalk.blue.underline(repository)}`);
        cli_utils_1.log(`${cli_utils_1.chalk.gray(templateDir.toString())}`);
        cli_utils_1.log(`${cli_utils_1.chalk.green('Please reselect...')}\n`);
        setTimeout(() => getTemplates(args), 0);
    }
    else {
        spinner.color = 'green';
        spinner.succeed(`${cli_utils_1.chalk.green('Pull successful!')}\n\n`);
        const templates = parseTemplates(templateDir);
        const title = args.title + `\ntotally [${cli_utils_1.chalk.red(templates.length + 'P')}] templates are pulled from ${cli_utils_1.chalk.blue.underline(repository)}\n`;
        const { projectName, projectDir, options } = args;
        const creator = new create_1.default(projectName, projectDir, templateDir, options, templates, title);
        creator.create();
    }
}
function parseTemplates(floder) {
    const subDirs = cli_utils_1.readDirSync(floder)
        .filter((file) => file.isDirectory)
        .map((file) => file.name);
    const templates = subDirs
        .map((name) => {
        const dir = path_1.default.join(floder, name);
        const creatorFile = path_1.default.join(dir, base_1.TEMPLATE_CREATOR);
        if (!cli_utils_1.fs.existsSync(creatorFile)) {
            return null;
        }
        const { framework = [], platform = [], title = '', css = [], data = (options) => options, include = [], rename = {}, install = ['./', './mock'], } = require(creatorFile);
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
    return templates;
}
async function main(options) {
    const spinner = cli_utils_1.ora('checking...').start();
    const proxyUrl = await cli_utils_1.getProxy();
    spinner.stop();
    let proxyMessage = '';
    if (!proxyUrl) {
        proxyMessage = cli_utils_1.chalk.green('system proxy: not found');
    }
    else if (proxyUrl.startsWith('error://')) {
        proxyMessage = cli_utils_1.chalk.green('system proxy: ' + proxyUrl.replace('error://', '')) + cli_utils_1.chalk.red(' (connect failed!)');
    }
    else {
        proxyMessage = cli_utils_1.chalk.green('system proxy: ' + proxyUrl);
    }
    cli_utils_1.log(proxyMessage);
    const proxy = await askProxy(proxyUrl.replace('error://', ''));
    const response = await cli_utils_1.got(base_1.PACKAGE_INFO_GITEE, {
        timeout: 15000,
        retry: 1,
        responseType: 'json',
        headers: {
            'user-agent': 'node/14.0.0',
        },
        agent: cli_utils_1.createProxyAgent(base_1.PACKAGE_INFO_GITEE, proxy),
    }).then((response) => {
        spinner.stop();
        return response.body;
    }, () => {
        spinner.warn(cli_utils_1.chalk.yellow('Failed to get the latest data. Use local cache.'));
        return options.packageJson;
    });
    const curVerison = options.packageJson.version;
    const { version: latestVesrion, templateResources } = response;
    let title = '@elux/cli ' + curVerison;
    if (cli_utils_1.semver.lt(curVerison, latestVesrion)) {
        title += `, ${cli_utils_1.chalk.magenta('New version available ' + latestVesrion)}`;
    }
    title += cli_utils_1.chalk.green('\nproxy -> ' + proxy);
    getProjectName({ title, templateResources, options });
}
module.exports = main;
