"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const base_1 = require("./base");
const build_1 = __importDefault(require("./build"));
class Creator {
    constructor(projectName, projectDir, templateDir, options, templates, title) {
        this.projectName = projectName;
        this.projectDir = projectDir;
        this.templateDir = templateDir;
        this.options = options;
        this.templates = templates;
        this.title = title;
    }
    askPlatform(templates) {
        const data = {
            [base_1.Platform.csr]: [],
            [base_1.Platform.ssr]: [],
            [base_1.Platform.taro]: [],
            [base_1.Platform.micro]: [],
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
                name: `CSR: 基于浏览器渲染的单页应用 [${cli_utils_1.chalk.red(getPics(data[base_1.Platform.csr]) + 'P')}]`,
                value: base_1.Platform.csr,
            });
        }
        if (data[base_1.Platform.ssr].length > 0) {
            choices.push({
                name: `SSR: 基于服务器渲染+浏览器渲染的同构应用 [${cli_utils_1.chalk.red(getPics(data[base_1.Platform.ssr]) + 'P')}]`,
                value: base_1.Platform.ssr,
            });
        }
        if (data[base_1.Platform.taro].length > 0) {
            choices.push({
                name: `Taro: 基于Taro的跨平台应用，常用于各类小程序 [${cli_utils_1.chalk.red(getPics(data[base_1.Platform.taro]) + 'P')}]`,
                value: base_1.Platform.taro,
            });
        }
        if (data[base_1.Platform.micro].length > 0) {
            choices.push({
                name: `Micro: 基于Webpack5 Module Federation的微前端应用 [${cli_utils_1.chalk.red(getPics(data[base_1.Platform.micro]) + 'P')}]`,
                value: base_1.Platform.micro,
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
    askFramework(templates) {
        const data = {
            [base_1.Framework.reactRedux]: [],
            [base_1.Framework.vueVuex]: [],
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
        if (data[base_1.Framework.reactRedux].length > 0) {
            choices.push({
                name: `React + Redux [${cli_utils_1.chalk.red(getPics(data[base_1.Framework.reactRedux]) + 'P')}]`,
                value: base_1.Framework.reactRedux,
            });
        }
        if (data[base_1.Framework.vueVuex].length > 0) {
            choices.push({
                name: `Vue3 + Vuex [${cli_utils_1.chalk.red(getPics(data[base_1.Framework.vueVuex]) + 'P')}]`,
                value: base_1.Framework.vueVuex,
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
    askCss(templates) {
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
                name: `Less [${cli_utils_1.chalk.red(data[base_1.CSS.less].length + 'P')}]`,
                value: base_1.CSS.less,
            });
        }
        if (data[base_1.CSS.sass].length > 0) {
            choices.push({
                name: `Sass [${cli_utils_1.chalk.red(data[base_1.CSS.sass].length + 'P')}]`,
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
    askTemplate(templates) {
        return inquirer_1.default
            .prompt({
            type: 'list',
            name: 'template',
            message: '请选择模板',
            pageSize: 8,
            loop: false,
            choices: templates.map((item) => ({
                name: item.title,
                value: item,
            })),
        })
            .then(({ template }) => {
            return template;
        });
    }
    parseTemplates(floder) {
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
            const { framework = '', platform = '', title = '' } = require(creatorFile);
            return {
                name,
                title,
                platform,
                framework,
                path: dir,
            };
        })
            .filter(Boolean);
        this.templates = templates;
    }
    askEnsure() {
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
    async create() {
        cli_utils_1.clearConsole(this.title);
        const featChoices = {};
        let feat = '', templates = this.templates;
        ({ feat, templates } = await this.askPlatform(templates));
        featChoices.platform = feat;
        ({ feat, templates } = await this.askFramework(templates));
        featChoices.framework = feat;
        ({ feat, templates } = await this.askCss(templates));
        featChoices.css = feat;
        const template = await this.askTemplate(templates);
        const ensure = await this.askEnsure();
        if (ensure) {
            build_1.default({ projectName: this.projectName, projectDir: this.projectDir, templateDir: this.templateDir, featChoices, template });
        }
        else {
            this.create();
        }
    }
}
module.exports = Creator;
