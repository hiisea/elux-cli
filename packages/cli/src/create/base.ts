export interface TemplateResources {
  title: string;
  url: string;
  count: number;
  summary: string;
}
export interface PackageJson {
  name: string;
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
  rn = 'rn',
}
export enum Framework {
  react = 'react',
  vue = 'vue',
}
export enum CSS {
  less = 'less',
  sass = 'sass',
}
export interface ITemplate {
  platform: Platform[];
  framework: Framework[];
  css: CSS[];
  getTitle: (args: FeatChoices) => string;
  getNpmLockFile: (args: FeatChoices) => string;
  operation?: (args: FeatChoices & {projectName: string}) => {action: 'copy' | 'move'; from: string; to: string}[];
  data?: (args: FeatChoices & {projectName: string}) => {[key: string]: string};
  rename?: (params: any, fpath: string) => string;
  beforeRender?: (params: any, fpath: string, content: string) => string;
  afterRender?: (params: any, fpath: string, content: string) => string;
}
//export const PACKAGE_INFO_GITEE: string = 'https://gitee.com/hiisea/elux-cli/raw/master/packages/cli/package.json';
//export const PACKAGE_INFO_GITHUB: string = 'https://raw.githubusercontent.com/hiisea/elux-cli/main/packages/cli/package.json';
//export const USER_AGENT: string = 'elux-cli/1.0.0';
