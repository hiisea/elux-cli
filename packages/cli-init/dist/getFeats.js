"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const buildProject_1 = __importDefault(require("./buildProject"));
const base_1 = require("./libs/base");
function askPlatform(templates) {
    const data = {
        [base_1.Platform.csr]: [],
        [base_1.Platform.ssr]: [],
        [base_1.Platform.taro]: [],
        [base_1.Platform.micro]: [],
        [base_1.Platform.rn]: [],
    };
    templates.forEach((item) => {
        item.platform.forEach((platform) => {
            data[platform].push(item);
        });
    });
    const choices = [];
    const getPics = (templates) => {
        return templates.reduce((pre, cur) => {
            return pre + cur.framework.length * cur.css.length;
        }, 0);
    };
    if (data[base_1.Platform.csr].length > 0) {
        choices.push({
            name: `CSR: 基于浏览器渲染的应用 [${cli_utils_1.chalk.redBright(getPics(data[base_1.Platform.csr]) + 'P')}]`,
            value: base_1.Platform.csr,
        });
    }
    if (data[base_1.Platform.ssr].length > 0) {
        choices.push({
            name: `SSR: 基于服务器渲染 + 浏览器渲染的同构应用 [${cli_utils_1.chalk.redBright(getPics(data[base_1.Platform.ssr]) + 'P')}]`,
            value: base_1.Platform.ssr,
        });
    }
    if (data[base_1.Platform.micro].length > 0) {
        choices.push({
            name: `Micro: 基于Webpack5的微前端 + 微模块方案 [${cli_utils_1.chalk.redBright(getPics(data[base_1.Platform.micro]) + 'P')}]`,
            value: base_1.Platform.micro,
        });
    }
    if (data[base_1.Platform.taro].length > 0) {
        choices.push({
            name: `Taro: 基于Taro的跨平台应用（各类小程序） [${cli_utils_1.chalk.redBright(getPics(data[base_1.Platform.taro]) + 'P')}]`,
            value: base_1.Platform.taro,
        });
    }
    if (data[base_1.Platform.rn].length > 0) {
        choices.push({
            name: `RN: 基于ReactNative的原生APP（开发中...） [${cli_utils_1.chalk.redBright(getPics(data[base_1.Platform.rn]) + 'P')}]`,
            value: base_1.Platform.rn,
        });
    }
    return inquirer_1.default
        .prompt([
        {
            type: 'list',
            name: 'feat',
            message: '请选择平台架构',
            choices,
        },
    ])
        .then(({ feat }) => {
        return { feat, templates: data[feat] };
    });
}
function askFramework(templates) {
    const data = {
        [base_1.Framework.react]: [],
        [base_1.Framework.vue]: [],
    };
    templates.forEach((item) => {
        item.framework.forEach((framework) => {
            data[framework].push(item);
        });
    });
    const choices = [];
    const getPics = (templates) => {
        return templates.reduce((pre, cur) => {
            return pre + cur.css.length;
        }, 0);
    };
    if (data[base_1.Framework.react].length > 0) {
        choices.push({
            name: `React [${cli_utils_1.chalk.redBright(getPics(data[base_1.Framework.react]) + 'P')}]`,
            value: base_1.Framework.react,
        });
    }
    if (data[base_1.Framework.vue].length > 0) {
        choices.push({
            name: `Vue3 [${cli_utils_1.chalk.redBright(getPics(data[base_1.Framework.vue]) + 'P')}]`,
            value: base_1.Framework.vue,
        });
    }
    return inquirer_1.default
        .prompt({
        type: 'list',
        name: 'feat',
        message: '请选择UI框架',
        choices,
    })
        .then(({ feat }) => {
        return { feat, templates: data[feat] };
    });
}
function askCss(templates) {
    const data = {
        [base_1.CSS.less]: [],
        [base_1.CSS.sass]: [],
    };
    templates.forEach((item) => {
        item.css.forEach((css) => {
            data[css].push(item);
        });
    });
    const choices = [];
    if (data[base_1.CSS.less].length > 0) {
        choices.push({
            name: `Less [${cli_utils_1.chalk.redBright(data[base_1.CSS.less].length + 'P')}]`,
            value: base_1.CSS.less,
        });
    }
    if (data[base_1.CSS.sass].length > 0) {
        choices.push({
            name: `Sass [${cli_utils_1.chalk.redBright(data[base_1.CSS.sass].length + 'P')}]`,
            value: base_1.CSS.sass,
        });
    }
    return inquirer_1.default
        .prompt({
        type: 'list',
        name: 'feat',
        message: '请选择CSS预处理器',
        choices,
    })
        .then(({ feat }) => {
        return { feat, templates: data[feat] };
    });
}
function askTemplate(templates, featChoices) {
    return inquirer_1.default
        .prompt({
        type: 'list',
        name: 'template',
        message: '请选择模板',
        pageSize: 8,
        loop: false,
        choices: templates.map((item) => ({
            name: item.getTitle(featChoices),
            value: item,
        })),
    })
        .then(({ template }) => {
        return template;
    });
}
function askEnsure() {
    return inquirer_1.default
        .prompt({
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
    })
        .then(({ ensure }) => {
        return ensure;
    });
}
async function main(args) {
    (0, cli_utils_1.clearConsole)(args.title.join('\n') + '\n');
    const featChoices = {};
    let feat = '', templates = args.templates;
    ({ feat, templates } = await askPlatform(templates));
    featChoices.platform = feat;
    ({ feat, templates } = await askFramework(templates));
    featChoices.framework = feat;
    ({ feat, templates } = await askCss(templates));
    featChoices.css = feat;
    const template = await askTemplate(templates, featChoices);
    const ensure = await askEnsure();
    if (ensure) {
        const { projectName, projectDir, repository, templateDir } = args;
        (0, buildProject_1.default)({
            projectName,
            projectDir,
            repository,
            templateDir,
            featChoices,
            template,
        });
    }
    else {
        setTimeout(() => main(args), 0);
    }
}
exports.default = main;
