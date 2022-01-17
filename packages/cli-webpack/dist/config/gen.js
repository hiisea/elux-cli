"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const utils_1 = __importDefault(require("./utils"));
const EluxConfigSchema = {
    type: 'object',
    additionalProperties: true,
    definitions: {
        EnvConfig: {
            type: 'object',
            additionalProperties: false,
            properties: {
                clientPublicPath: { type: 'string' },
                clientGlobalVar: { type: 'object' },
                serverGlobalVar: { type: 'object' },
                onCompiled: { instanceof: 'Function' },
                sourceMap: { type: 'string' },
                cache: {
                    anyOf: [
                        {
                            type: 'boolean',
                        },
                        {
                            type: 'object',
                        },
                    ],
                },
                eslint: { type: 'boolean' },
                stylelint: { type: 'boolean' },
                clientMinimize: { type: 'boolean' },
                serverMinimize: { type: 'boolean' },
                resolveAlias: {
                    type: 'object',
                },
                urlLoaderLimitSize: {
                    type: 'number',
                    description: 'Default is 4096',
                },
                apiProxy: { type: 'object' },
                serverPort: {
                    type: 'number',
                    description: 'Default is 4003',
                },
                webpackConfigTransform: {
                    instanceof: 'Function',
                    description: 'Provides an custom function to transform webpackConfig: (webpackConfig) => webpackConfig',
                },
            },
        },
    },
    properties: {
        type: {
            enum: ['vue', 'vue ssr', 'react', 'react ssr'],
        },
        srcPath: {
            type: 'string',
            description: 'Relative to the project root directory. Defalut is ./src',
        },
        distPath: {
            type: 'string',
            description: 'Relative to the project root directory. Defalut is ./dist',
        },
        publicPath: {
            type: 'string',
            description: 'Relative to the project root directory. Defalut is ./public',
        },
        cssModulesOptions: {
            type: 'object',
        },
        cssProcessors: {
            type: 'object',
            additionalProperties: false,
            properties: {
                less: {
                    anyOf: [
                        {
                            type: 'boolean',
                        },
                        {
                            type: 'object',
                        },
                    ],
                },
                sass: {
                    anyOf: [
                        {
                            type: 'boolean',
                        },
                        {
                            type: 'object',
                        },
                    ],
                },
            },
        },
        moduleFederation: {
            type: 'object',
        },
        devServerConfigTransform: {
            instanceof: 'Function',
            description: 'Provides an custom function to transform webpack devServerConfig: (devServerConfig) => devServerConfig',
        },
        all: {
            $ref: '#/definitions/EnvConfig',
        },
        dev: {
            $ref: '#/definitions/EnvConfig',
        },
        prod: {
            $ref: '#/definitions/EnvConfig',
        },
    },
};
function moduleExports(rootPath, baseEluxConfig, envName, envPath, nodeEnv, ssrNodeVersion, _serverPort, analyzerPort) {
    cli_utils_1.schemaValidate(EluxConfigSchema, baseEluxConfig, { name: '@elux/cli-webpack' });
    const defaultBaseConfig = {
        type: 'react',
        srcPath: './src',
        distPath: './dist',
        publicPath: './public',
        cssProcessors: { less: false, sass: false },
        cssModulesOptions: {},
        moduleFederation: {},
        devServerConfigTransform: (config) => config,
        all: {
            serverPort: 4003,
            eslint: true,
            stylelint: true,
            clientMinimize: true,
            serverMinimize: false,
            cache: true,
            resolveAlias: {},
            urlLoaderLimitSize: 4096,
            clientPublicPath: '/client/',
            clientGlobalVar: {},
            serverGlobalVar: {},
            sourceMap: 'eval-cheap-module-source-map',
            webpackConfigTransform: (config) => config,
            onCompiled: () => undefined,
            apiProxy: {},
        },
        prod: {
            sourceMap: 'hidden-source-map',
        },
    };
    const eluxConfig = cli_utils_1.deepExtend(defaultBaseConfig, baseEluxConfig);
    const envConfig = cli_utils_1.deepExtend(eluxConfig.all, eluxConfig[nodeEnv === 'development' ? 'dev' : 'prod']);
    const { srcPath, publicPath, type, moduleFederation, devServerConfigTransform, cssProcessors, cssModulesOptions } = eluxConfig;
    const { serverPort, cache, eslint, stylelint, clientMinimize, serverMinimize, urlLoaderLimitSize, resolveAlias, clientPublicPath, clientGlobalVar, serverGlobalVar, sourceMap, onCompiled, webpackConfigTransform, apiProxy, } = envConfig;
    const useSSR = type === 'react ssr' || type === 'vue ssr';
    const UIType = type.split(' ')[0];
    const distPath = path_1.default.resolve(rootPath, eluxConfig.distPath, envName);
    let { devServerConfig, clientWebpackConfig, serverWebpackConfig } = utils_1.default({
        cache,
        sourceMap,
        nodeEnv,
        rootPath,
        envPath,
        srcPath: path_1.default.resolve(rootPath, srcPath),
        distPath: path_1.default.resolve(rootPath, distPath),
        publicPath: path_1.default.resolve(rootPath, publicPath),
        clientPublicPath,
        cssProcessors,
        cssModulesOptions,
        enableEslintPlugin: eslint,
        enableStylelintPlugin: stylelint,
        clientMinimize,
        serverMinimize,
        analyzerPort,
        UIType,
        limitSize: urlLoaderLimitSize,
        globalVar: { client: clientGlobalVar, server: serverGlobalVar },
        apiProxy,
        useSSR,
        serverPort: _serverPort || serverPort,
        ssrNodeVersion,
        resolveAlias,
        moduleFederation: Object.keys(moduleFederation).length > 0 ? moduleFederation : undefined,
    });
    devServerConfig = devServerConfigTransform(devServerConfig);
    clientWebpackConfig = webpackConfigTransform(clientWebpackConfig);
    if (useSSR) {
        serverWebpackConfig = webpackConfigTransform(serverWebpackConfig);
    }
    return {
        devServerConfig,
        clientWebpackConfig,
        serverWebpackConfig,
        projectConfig: {
            rootPath,
            envName,
            envPath,
            nodeEnv,
            srcPath: path_1.default.resolve(rootPath, srcPath),
            distPath: path_1.default.resolve(rootPath, distPath),
            publicPath: path_1.default.resolve(rootPath, publicPath),
            sourceMap,
            cache: cache === true ? 'memory' : cache === false ? '' : cache.type,
            projectType: type,
            envConfig,
            useSSR,
            serverPort: _serverPort || serverPort,
            apiProxy,
            onCompiled,
        },
    };
}
module.exports = moduleExports;
