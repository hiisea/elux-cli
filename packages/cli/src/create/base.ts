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
  scss = 'scss',
}
export interface ITemplate {
  name: string;
  path: string;
  title: string;
  css: CSS[];
  framework: Framework[];
  platform: Platform[];
  include: string[];
  data: (args: FeatChoices & {projectName: string}) => {[key: string]: string};
  rename: {[key: string]: (params: any, fpath: string) => string};
  install: string[];
}
export const TEMPLATE_CREATOR: string = 'elux.template.js';
export const PACKAGE_INFO_GITEE: string = 'https://gitee.com/hiisea/elux-cli/raw/master/packages/cli/package.json';
export const PACKAGE_INFO_GITHUB: string = 'https://raw.githubusercontent.com/hiisea/elux-cli/main/package.json';
