export interface TemplateResources {
  title: string;
  url: string;
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

export interface TPLOptions {
  projectName: string;
  [key: string]: any;
}
export interface GetOptionsResult {
  subject: string;
  choices: string[];
  onSelect: (selected: string, options: TPLOptions) => GetOptionsResult | undefined;
}
export interface ITemplate {
  getOptions: (options: TPLOptions) => GetOptionsResult | undefined;
  shouldEslint?: (options: TPLOptions) => boolean;
  getNpmLockFile?: (options: TPLOptions) => string;
  getOperation?: (options: TPLOptions) => {action: 'copy' | 'move'; from: string; to: string}[];
  rename?: (params: any, fpath: string) => string;
  beforeRender?: (params: any, fpath: string, content: string) => string;
  afterRender?: (params: any, fpath: string, content: string) => string;
}
