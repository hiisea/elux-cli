export interface TemplateResources {
  title: string;
  url: string;
  count: number;
}
export interface PackageJson {
  version: string;
  templateResources: TemplateResources[];
}
export interface CommandOptions {
  packageJson: PackageJson;
}
export interface FeatChoices {
  platform?: string;
  framework?: string;
  css?: string;
}
export enum Platform {
  csr = 'csr',
  ssr = 'ssr',
  taro = 'taro',
  micro = 'micro',
}
export enum Framework {
  reactRedux = 'reactRedux',
  vueVuex = 'vueVuex',
}
export enum CSS {
  less = 'less',
  sass = 'sass',
}
export interface ITemplate {
  name: string;
  path: string;
  title: string;
  css: CSS[];
  framework: Framework[];
  platform: Platform[];
  include: string[];
  install: string[];
  data?: (args: FeatChoices & {projectName: string}) => {[key: string]: string};
  rename?: (params: any, fpath: string) => string;
  beforeRender?: (params: any, fpath: string, content: string) => string;
  afterRender?: (params: any, fpath: string, content: string) => string;
}
export const TEMPLATE_CREATOR: string = 'elux.template.js';
export const PACKAGE_INFO_GITEE: string = 'https://gitee.com/hiisea/elux-cli/raw/master/packages/cli/package.json';
export const PACKAGE_INFO_GITHUB: string = 'https://raw.githubusercontent.com/hiisea/elux-cli/main/packages/cli/package.json';
export const USER_AGENT: string = 'elux-cli/1.0.0';
