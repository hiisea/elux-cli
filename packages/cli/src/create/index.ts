import inquirer from 'inquirer';
import {clearConsole, chalk} from '@elux/cli-utils';
import {CommandOptions, FeatChoices, Platform, ITemplate, Framework, CSS} from './base';
import build from './build';

class Creator {
  constructor(
    private projectName: string,
    private projectDir: string,
    private repository: string,
    private templateDir: string,
    private options: CommandOptions,
    private templates: ITemplate[],
    private title: string
  ) {}

  askPlatform(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
    const data: {[key in Platform]: ITemplate[]} = {
      [Platform.csr]: [],
      [Platform.ssr]: [],
      [Platform.taro]: [],
      [Platform.micro]: [],
      [Platform.rn]: [],
    };
    templates.forEach((item) => {
      item.platform.forEach((platform) => {
        data[platform].push(item);
      });
    });
    const choices: any[] = [];
    const getPics = (templates: ITemplate[]) => {
      return templates.reduce((pre, cur) => {
        return pre + cur.framework.length * cur.css.length;
      }, 0);
    };
    if (data[Platform.csr].length > 0) {
      choices.push({
        name: `CSR: 基于浏览器渲染的应用 [${chalk.red(getPics(data[Platform.csr]) + 'P')}]`,
        value: Platform.csr,
      });
    }
    if (data[Platform.ssr].length > 0) {
      choices.push({
        name: `SSR: 基于服务器渲染 + 浏览器渲染的同构应用 [${chalk.red(getPics(data[Platform.ssr]) + 'P')}]`,
        value: Platform.ssr,
      });
    }
    if (data[Platform.micro].length > 0) {
      choices.push({
        name: `Micro: 基于Webpack5的微前端 + 微模块方案 [${chalk.red(getPics(data[Platform.micro]) + 'P')}]`,
        value: Platform.micro,
      });
    }
    if (data[Platform.taro].length > 0) {
      choices.push({
        name: `Taro: 基于Taro的跨平台应用（各类小程序） [${chalk.red(getPics(data[Platform.taro]) + 'P')}]`,
        value: Platform.taro,
      });
    }
    if (data[Platform.rn].length > 0) {
      choices.push({
        name: `RN: 基于ReactNative的原生APP（开发中...） [${chalk.red(getPics(data[Platform.rn]) + 'P')}]`,
        value: Platform.rn,
      });
    }
    return inquirer
      .prompt([
        {
          type: 'list',
          name: 'feat',
          message: '请选择平台架构',
          choices,
        },
      ])
      .then(({feat}) => {
        return {feat, templates: data[feat]};
      });
  }
  askFramework(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
    const data: {[key in Framework]: ITemplate[]} = {
      [Framework.react]: [],
      [Framework.vue]: [],
    };
    templates.forEach((item) => {
      item.framework.forEach((framework) => {
        data[framework].push(item);
      });
    });
    const choices: any[] = [];
    const getPics = (templates: ITemplate[]) => {
      return templates.reduce((pre, cur) => {
        return pre + cur.css.length;
      }, 0);
    };
    if (data[Framework.react].length > 0) {
      choices.push({
        name: `React [${chalk.red(getPics(data[Framework.react]) + 'P')}]`,
        value: Framework.react,
      });
    }
    if (data[Framework.vue].length > 0) {
      choices.push({
        name: `Vue3 [${chalk.red(getPics(data[Framework.vue]) + 'P')}]`,
        value: Framework.vue,
      });
    }
    return inquirer
      .prompt({
        type: 'list',
        name: 'feat',
        message: '请选择UI框架',
        choices,
      })
      .then(({feat}) => {
        return {feat, templates: data[feat]};
      });
  }
  askCss(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
    const data: {[key in CSS]: ITemplate[]} = {
      [CSS.less]: [],
      [CSS.sass]: [],
    };
    templates.forEach((item) => {
      item.css.forEach((css) => {
        data[css].push(item);
      });
    });
    const choices: any[] = [];
    if (data[CSS.less].length > 0) {
      choices.push({
        name: `Less [${chalk.red(data[CSS.less].length + 'P')}]`,
        value: CSS.less,
      });
    }
    if (data[CSS.sass].length > 0) {
      choices.push({
        name: `Sass [${chalk.red(data[CSS.sass].length + 'P')}]`,
        value: CSS.sass,
      });
    }
    return inquirer
      .prompt({
        type: 'list',
        name: 'feat',
        message: '请选择CSS预处理器',
        choices,
      })
      .then(({feat}) => {
        return {feat, templates: data[feat]};
      });
  }
  askTemplate(templates: ITemplate[], featChoices: FeatChoices): Promise<ITemplate> {
    return inquirer
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
      .then(({template}) => {
        return template;
      });
  }
  askEnsure(): Promise<boolean> {
    return inquirer
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
      .then(({ensure}) => {
        return ensure;
      });
  }
  async create(): Promise<void> {
    clearConsole(this.title);
    const featChoices: FeatChoices = {};
    let feat = '',
      templates = this.templates;
    ({feat, templates} = await this.askPlatform(templates));
    featChoices.platform = feat;
    ({feat, templates} = await this.askFramework(templates));
    featChoices.framework = feat;
    ({feat, templates} = await this.askCss(templates));
    featChoices.css = feat;
    const template = await this.askTemplate(templates, featChoices);
    const ensure = await this.askEnsure();
    if (ensure) {
      build({
        projectName: this.projectName,
        projectDir: this.projectDir,
        repository: this.repository,
        templateDir: this.templateDir,
        featChoices,
        template,
      });
    } else {
      this.create();
    }
  }
}

export = Creator;
