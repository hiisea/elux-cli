export interface TemplateResources {
  title: string;
  url: string;
  count: number;
  summary: string;
}
export interface PackageJson {
  name: string;
  version: string;
  engines: {
    node: string;
  };
  templateResources: TemplateResources[];
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
export interface FeatChoices {
  platform?: string;
  framework?: string;
  css?: string;
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
