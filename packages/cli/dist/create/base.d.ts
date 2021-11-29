export interface TemplateResources {
    title: string;
    url: string;
    count: number;
    summary: string;
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
export declare enum Platform {
    csr = "csr",
    ssr = "ssr",
    taro = "taro",
    micro = "micro"
}
export declare enum Framework {
    reactRedux = "reactRedux",
    vueVuex = "vueVuex"
}
export declare enum CSS {
    less = "less",
    sass = "sass"
}
export interface ITemplate {
    platform: Platform[];
    framework: Framework[];
    css: CSS[];
    install: string[];
    getTitle: (args: FeatChoices) => string;
    operation?: {
        action: 'copy' | 'move';
        from: string;
        to: string;
    }[];
    data?: (args: FeatChoices & {
        projectName: string;
    }) => {
        [key: string]: string;
    };
    rename?: (params: any, fpath: string) => string;
    beforeRender?: (params: any, fpath: string, content: string) => string;
    afterRender?: (params: any, fpath: string, content: string) => string;
}
export declare const PACKAGE_INFO_GITEE: string;
export declare const PACKAGE_INFO_GITHUB: string;
export declare const USER_AGENT: string;
