"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const getFeats_1 = __importDefault(require("./getFeats"));
const download_1 = __importDefault(require("./libs/download"));
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
                ...templateResources.map((item) => ({ name: item.title, value: item })),
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
            when(answers) {
                return answers.templateSource === 'inputUrl';
            },
            validate(input) {
                if (!input) {
                    return true;
                }
                return (0, cli_utils_1.testHttpUrl)(input) || cli_utils_1.chalk.redBright('请输入模版文件的Url');
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
        const input = (templateSourceInputPath || templateSourceInputUrl || '').trim();
        if (input) {
            const repository = input.startsWith('http://') || input.startsWith('https://') ? input : path_1.default.resolve(process.cwd(), input);
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
async function askProxy() {
    const prompts = [];
    prompts.push({
        type: 'input',
        name: 'inputProxy',
        message: '是否需要代理(翻墙)【输入代理地址或回车跳过】',
        validate(input) {
            if (!input) {
                return true;
            }
            return (0, cli_utils_1.testHttpUrl)(input) || cli_utils_1.chalk.redBright('格式如:http://127.0.0.1:1087');
        },
    });
    console.log('');
    return inquirer_1.default.prompt(prompts).then(({ inputProxy }) => {
        return inputProxy;
    });
}
async function downloadRepository(repository) {
    let templateDir;
    if (repository.startsWith('http://') || repository.startsWith('https://')) {
        const proxy = await askProxy();
        global['GLOBAL_AGENT'].HTTP_PROXY = proxy || '';
        templateDir = path_1.default.join(os_1.default.tmpdir(), 'elux-cli-tpl');
        try {
            await (0, download_1.default)(repository + '/src.zip', templateDir, true);
        }
        catch (error) {
            console.log(cli_utils_1.chalk.yellow(error.toString()));
            templateDir = '';
        }
    }
    else {
        templateDir = path_1.default.join(repository, 'src');
    }
    return templateDir;
}
function parseTemplate(templateDir, cliVerison) {
    try {
        const configCode = cli_utils_1.fse.readFileSync(path_1.default.join(templateDir, './config.js')).toString();
        const [, versionMatch] = configCode.split('\n', 1)[0].match(/create-elux@([^ ]+)/) || [];
        if (versionMatch && versionMatch != '*' && !cli_utils_1.semver.satisfies(cliVerison, versionMatch)) {
            throw `您选择的模版需要安装器:create-elux@${versionMatch}，当前安装器版本为:create-elux@${cliVerison}\n请选择其它模版，或重装安装器: npm create elux@${versionMatch} 或 yarn create elux@${versionMatch}`;
        }
        const configFun = new Function(configCode);
        return configFun();
    }
    catch (error) {
        console.log(cli_utils_1.chalk.redBright('\n✖ 模版解析失败！'));
        console.log(cli_utils_1.chalk.yellow(error.toString()));
        return;
    }
}
async function main(args) {
    console.log('');
    const templateSource = await askTemplateSource(args.templateResources);
    const repository = templateSource.repository.trim().replace(/\/+$/, '');
    const summary = templateSource.summary.trim();
    if (!repository) {
        console.log(cli_utils_1.chalk.green('Please reselect...'));
        setTimeout(() => main(args), 0);
        return;
    }
    (0, cli_utils_1.clearConsole)('\n' + cli_utils_1.chalk.bright.bgBlue('【 ' + (summary || repository) + ' 】'));
    const templateDir = await downloadRepository(repository);
    if (!templateDir) {
        console.log(cli_utils_1.chalk.green('Please reselect...'));
        setTimeout(() => main(args), 0);
        return;
    }
    const template = parseTemplate(templateDir, args.cliVersion);
    if (!template) {
        console.log(cli_utils_1.chalk.green('Please reselect...'));
        setTimeout(() => main(args), 0);
        return;
    }
    const { projectName, projectDir, title } = args;
    title.push(`pulled from ${cli_utils_1.chalk.cyan.underline(repository)}`);
    (0, getFeats_1.default)({ title, template, projectName, projectDir, repository, templateDir });
}
exports.default = main;
