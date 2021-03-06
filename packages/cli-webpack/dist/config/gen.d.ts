import type { DevServerConfig, WebpackConfig, WebpackLoader } from './utils';
interface EnvConfig {
    clientPublicPath: string;
    clientGlobalVar: Record<string, any>;
    serverGlobalVar: Record<string, any>;
    defineConstants: Record<string, string>;
    onCompiled: () => void;
    sourceMap: string;
    cache: boolean | Record<string, any>;
    eslint: boolean;
    stylelint: boolean;
    clientMinimize: boolean;
    serverMinimize: boolean;
    resolveAlias: Record<string, string>;
    urlLoaderLimitSize: number;
    apiProxy: Record<string, {
        target: string;
    }>;
    serverPort: number;
    webpackConfigTransform: (config: WebpackConfig) => WebpackConfig;
}
interface EluxConfig {
    type: 'vue' | 'react' | 'vue ssr' | 'react ssr';
    srcPath: string;
    distPath: string;
    publicPath: string;
    cssProcessors: {
        less: Record<string, any> | boolean;
        sass: Record<string, any> | boolean;
    };
    cssModulesOptions: Record<string, any>;
    moduleFederation: Record<string, any>;
    devServerConfigTransform: (config: DevServerConfig) => DevServerConfig;
    all: EnvConfig;
    dev?: Partial<EnvConfig>;
    prod?: Partial<EnvConfig>;
}
interface Info {
    devServerConfig: DevServerConfig;
    clientWebpackConfig: WebpackConfig;
    serverWebpackConfig: WebpackConfig;
    projectConfig: {
        projectType: 'vue' | 'react' | 'vue ssr' | 'react ssr';
        nodeEnv: 'production' | 'development';
        cache: string;
        rootPath: string;
        envName: string;
        envPath: string;
        srcPath: string;
        distPath: string;
        publicPath: string;
        envConfig: EnvConfig;
        useSSR: boolean;
        serverPort: number;
        apiProxy: Record<string, {
            target: string;
        }>;
        sourceMap: string;
        onCompiled: () => void;
    };
}
declare function moduleExports(rootPath: string, baseEluxConfig: Partial<EluxConfig>, envName: string, envPath: string, nodeEnv: 'production' | 'development', ssrNodeVersion: string, _serverPort: number, analyzerPort?: number): Info;
declare namespace moduleExports {
    export { EnvConfig, EluxConfig, Info, WebpackLoader, WebpackConfig, DevServerConfig };
}
export = moduleExports;
