import {chalk, clearConsole} from '@elux/cli-utils';
import inquirer from 'inquirer';
import buildProject from './buildProject';
import {CSS, FeatChoices, Framework, ITemplate, Platform} from './libs/base';

function askPlatform(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
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
      name: `CSR: 基于浏览器渲染的应用 [${chalk.redBright(getPics(data[Platform.csr]) + 'P')}]`,
      value: Platform.csr,
    });
  }
  if (data[Platform.ssr].length > 0) {
    choices.push({
      name: `SSR: 基于服务器渲染 + 浏览器渲染的同构应用 [${chalk.redBright(getPics(data[Platform.ssr]) + 'P')}]`,
      value: Platform.ssr,
    });
  }
  if (data[Platform.micro].length > 0) {
    choices.push({
      name: `Micro: 基于Webpack5的微前端 + 微模块方案 [${chalk.redBright(getPics(data[Platform.micro]) + 'P')}]`,
      value: Platform.micro,
    });
  }
  if (data[Platform.taro].length > 0) {
    choices.push({
      name: `Taro: 基于Taro的跨平台应用（各类小程序） [${chalk.redBright(getPics(data[Platform.taro]) + 'P')}]`,
      value: Platform.taro,
    });
  }
  if (data[Platform.rn].length > 0) {
    choices.push({
      name: `RN: 基于ReactNative的原生APP（开发中...） [${chalk.redBright(getPics(data[Platform.rn]) + 'P')}]`,
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
function askFramework(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
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
      name: `React [${chalk.redBright(getPics(data[Framework.react]) + 'P')}]`,
      value: Framework.react,
    });
  }
  if (data[Framework.vue].length > 0) {
    choices.push({
      name: `Vue3 [${chalk.redBright(getPics(data[Framework.vue]) + 'P')}]`,
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
function askCss(templates: ITemplate[]): Promise<{feat: string; templates: ITemplate[]}> {
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
      name: `Less [${chalk.redBright(data[CSS.less].length + 'P')}]`,
      value: CSS.less,
    });
  }
  if (data[CSS.sass].length > 0) {
    choices.push({
      name: `Sass [${chalk.redBright(data[CSS.sass].length + 'P')}]`,
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
function askTemplate(templates: ITemplate[], featChoices: FeatChoices): Promise<ITemplate> {
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
function askEnsure(): Promise<boolean> {
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
export default async function main(args: {
  title: string[];
  templates: ITemplate[];
  projectName: string;
  projectDir: string;
  repository: string;
  templateDir: string;
}): Promise<void> {
  clearConsole(args.title.join('\n') + '\n');
  const featChoices: FeatChoices = {};
  let feat = '',
    templates = args.templates;
  ({feat, templates} = await askPlatform(templates));
  featChoices.platform = feat;
  ({feat, templates} = await askFramework(templates));
  featChoices.framework = feat;
  ({feat, templates} = await askCss(templates));
  featChoices.css = feat;
  const template = await askTemplate(templates, featChoices);
  const ensure = await askEnsure();
  if (ensure) {
    const {projectName, projectDir, repository, templateDir} = args;
    buildProject({
      projectName,
      projectDir,
      repository,
      templateDir,
      featChoices,
      template,
    });
  } else {
    setTimeout(() => main(args), 0);
  }
}
