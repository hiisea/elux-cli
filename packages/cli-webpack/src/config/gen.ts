import path from 'path';
import {deepExtend, schemaValidate} from '@elux/cli-utils';
import genConfig from './utils';
import type {WebpackLoader, WebpackConfig, DevServerConfig} from './utils';

interface EnvConfig {
  clientPublicPath: string;
  clientGlobalVar: Record<string, any>;
  serverGlobalVar: Record<string, any>;
  onCompiled: () => void;
  sourceMap: string;
  cache: boolean | Record<string, any>;
  eslint: boolean;
  stylelint: boolean;
  clientMinimize: boolean;
  serverMinimize: boolean;
  resolveAlias: Record<string, string>;
  urlLoaderLimitSize: number;
  apiProxy: Record<string, {target: string}>;
  serverPort: number;
  webpackConfigTransform: (config: WebpackConfig) => WebpackConfig;
}

interface EluxConfig {
  type: 'vue' | 'react' | 'vue ssr' | 'react ssr';
  srcPath: string;
  distPath: string;
  publicPath: string;
  cssProcessors: {less: Record<string, any> | boolean; sass: Record<string, any> | boolean};
  cssModulesOptions: Record<string, any>;
  moduleFederation: Record<string, any>;
  devServerConfigTransform: (config: DevServerConfig) => DevServerConfig;
  all: EnvConfig;
  dev?: Partial<EnvConfig>;
  prod?: Partial<EnvConfig>;
}

const EluxConfigSchema: any = {
  type: 'object',
  additionalProperties: true,
  definitions: {
    EnvConfig: {
      type: 'object',
      additionalProperties: false,
      properties: {
        clientPublicPath: {type: 'string'},
        clientGlobalVar: {type: 'object'},
        serverGlobalVar: {type: 'object'},
        onCompiled: {instanceof: 'Function'},
        sourceMap: {type: 'string'},
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
        eslint: {type: 'boolean'},
        stylelint: {type: 'boolean'},
        clientMinimize: {type: 'boolean'},
        serverMinimize: {type: 'boolean'},
        resolveAlias: {
          type: 'object',
        },
        urlLoaderLimitSize: {
          type: 'number',
          description: 'Default is 4096',
        },
        apiProxy: {type: 'object'},
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
    apiProxy: Record<string, {target: string}>;
    sourceMap: string;
    onCompiled: () => void;
  };
}

function moduleExports(
  rootPath: string,
  baseEluxConfig: Partial<EluxConfig>,
  envName: string,
  envPath: string,
  nodeEnv: 'production' | 'development',
  ssrNodeVersion: string,
  _serverPort?: number,
  analyzerPort?: number
): Info {
  schemaValidate(EluxConfigSchema, baseEluxConfig, {name: '@elux/cli-webpack'});

  const defaultBaseConfig: EluxConfig = {
    type: 'react',
    srcPath: './src',
    distPath: './dist',
    publicPath: './public',
    cssProcessors: {less: false, sass: false},
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
  const eluxConfig: EluxConfig = deepExtend(defaultBaseConfig, baseEluxConfig);
  const envConfig: EnvConfig = deepExtend(eluxConfig.all, eluxConfig[nodeEnv === 'development' ? 'dev' : 'prod']);

  const {srcPath, publicPath, type, moduleFederation, devServerConfigTransform, cssProcessors, cssModulesOptions} = eluxConfig;

  const {
    serverPort,
    cache,
    eslint,
    stylelint,
    clientMinimize,
    serverMinimize,
    urlLoaderLimitSize,
    resolveAlias,
    clientPublicPath,
    clientGlobalVar,
    serverGlobalVar,
    sourceMap,
    onCompiled,
    webpackConfigTransform,
    apiProxy,
  } = envConfig;

  const useSSR = type === 'react ssr' || type === 'vue ssr';
  const UIType = type.split(' ')[0] as 'react' | 'vue';
  const distPath = path.resolve(rootPath, eluxConfig.distPath, envName);

  let {devServerConfig, clientWebpackConfig, serverWebpackConfig} = genConfig({
    cache,
    sourceMap,
    nodeEnv,
    rootPath,
    envPath,
    srcPath: path.resolve(rootPath, srcPath),
    distPath: path.resolve(rootPath, distPath),
    publicPath: path.resolve(rootPath, publicPath),
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
    globalVar: {client: clientGlobalVar, server: serverGlobalVar},
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
      srcPath: path.resolve(rootPath, srcPath),
      distPath: path.resolve(rootPath, distPath),
      publicPath: path.resolve(rootPath, publicPath),
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

declare namespace moduleExports {
  export {EnvConfig, EluxConfig, Info, WebpackLoader, WebpackConfig, DevServerConfig};
}

export = moduleExports;
