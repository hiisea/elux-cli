import { Express } from 'express';
interface WebpackLoader {
    loader?: string;
    options?: Record<string, any>;
    [key: string]: any;
}
interface WebpackConfig {
    name: 'client' | 'server';
    [key: string]: any;
}
interface DevServerConfig {
    port?: number;
    https?: boolean;
    host?: string;
    devMiddleware?: {
        publicPath?: string;
        serverSideRender?: boolean;
    };
    onBeforeSetupMiddleware?: (server: {
        app: Express;
    }) => void;
    onAfterSetupMiddleware?: (server: {
        app: Express;
    }) => void;
    [key: string]: any;
}
interface ConfigOptions {
    cache: boolean | Record<string, any>;
    sourceMap: string;
    nodeEnv: 'production' | 'development';
    rootPath: string;
    srcPath: string;
    distPath: string;
    publicPath: string;
    clientPublicPath: string;
    envPath: string;
    cssProcessors: {
        less?: Record<string, any> | boolean;
        sass?: Record<string, any> | boolean;
    };
    cssModulesOptions: Record<string, any>;
    limitSize: number;
    globalVar: {
        client?: any;
        server?: any;
    };
    defineConstants: Record<string, string>;
    apiProxy: {
        [key: string]: any;
    };
    useSSR: boolean;
    UIType: 'react' | 'vue';
    serverPort: number;
    ssrNodeVersion: string;
    resolveAlias: Record<string, string>;
    moduleFederation?: Record<string, any>;
    enableEslintPlugin: boolean;
    enableStylelintPlugin: boolean;
    clientMinimize: boolean;
    serverMinimize: boolean;
    analyzerPort?: number;
}
declare function moduleExports({ cache, sourceMap, nodeEnv, rootPath, srcPath, distPath, publicPath, clientPublicPath, envPath, cssProcessors, cssModulesOptions, enableEslintPlugin, enableStylelintPlugin, clientMinimize, serverMinimize, analyzerPort, UIType, limitSize, globalVar, defineConstants, apiProxy, useSSR, serverPort, ssrNodeVersion, resolveAlias, moduleFederation, }: ConfigOptions): {
    clientWebpackConfig: WebpackConfig;
    serverWebpackConfig: WebpackConfig;
    devServerConfig: DevServerConfig;
};
declare namespace moduleExports {
    export { ConfigOptions, WebpackLoader, WebpackConfig, DevServerConfig };
}
export = moduleExports;
