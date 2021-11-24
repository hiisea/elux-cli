import inquirer from 'inquirer';
import path from 'path';
import {fs, readDirSync, clearConsole, chalk} from '@elux/cli-utils';
import {CommandOptions, FeatChoices, TEMPLATE_CREATOR, Platform, ITemplate, Framework, CSS} from './base';
import build from './build';

class Creator {
  constructor(
    private projectName: string,
    private projectDir: string,
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
    };
    templates.forEach((item) => {
      item.platform.forEach((platform) => {
        data[platform].push(item);
      });
    });
    const choices: any[] = [];
    if (data[Platform.csr].length > 0) {
      choices.push({
        name: `CSR: 基于浏览器渲染的单页应用 [${chalk.red(data[Platform.csr].length + 'P')}]`,
        value: Platform.csr,
      });
    }
    if (data[Platform.ssr].length > 0) {
      choices.push({
        name: `SSR: 基于服务器渲染+浏览器渲染的同构应用 [${chalk.red(data[Platform.ssr].length + 'P')}]`,
        value: Platform.ssr,
      });
    }
    if (data[Platform.taro].length > 0) {
      choices.push({
        name: `Taro: 基于Taro的跨平台应用，常用于各类小程序 [${chalk.red(data[Platform.taro].length + 'P')}]`,
        value: Platform.taro,
      });
    }
    if (data[Platform.micro].length > 0) {
      choices.push({
        name: `Micro: 基于Webpack5 Module Federation的微前端应用 [${chalk.red(data[Platform.micro].length + 'P')}]`,
        value: Platform.micro,
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
      [Framework.reactRedux]: [],
      [Framework.vueVuex]: [],
    };
    templates.forEach((item) => {
      item.framework.forEach((framework) => {
        data[framework].push(item);
      });
    });
    const choices: any[] = [];
    if (data[Framework.reactRedux].length > 0) {
      choices.push({
        name: `React + Redux [${chalk.red(data[Framework.reactRedux].length + 'P')}]`,
        value: Framework.reactRedux,
      });
    }
    if (data[Framework.vueVuex].length > 0) {
      choices.push({
        name: `Vue3 + Vuex [${chalk.red(data[Framework.vueVuex].length + 'P')}]`,
        value: Framework.vueVuex,
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
  askTemplate(templates: ITemplate[]): Promise<ITemplate> {
    return inquirer
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
      .then(({template}) => {
        return template;
      });
  }
  parseTemplates(floder: string): void {
    const subDirs = readDirSync(floder)
      .filter((file) => file.isDirectory)
      .map((file) => file.name);
    const templates = subDirs
      .map((name) => {
        const dir = path.join(floder, name);
        const creatorFile = path.join(dir, TEMPLATE_CREATOR);
        if (!fs.existsSync(creatorFile)) {
          return null;
        }
        const {framework = '', platform = '', title = ''} = require(creatorFile);
        return {
          name,
          title,
          platform,
          framework,
          path: dir,
        };
      })
      .filter(Boolean);
    this.templates = templates as any;
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
    const template = await this.askTemplate(templates);
    const ensure = await this.askEnsure();
    if (ensure) {
      build({projectName: this.projectName, projectDir: this.projectDir, templateDir: this.templateDir, featChoices, template});
    } else {
      this.create();
    }
  }
}

export = Creator;
