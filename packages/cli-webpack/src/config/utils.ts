import fs from 'fs';
import path from 'path';
import {getCssScopedName} from '@elux/cli-utils';
import {Express} from 'express';
import webpack from 'webpack';
import getSsrInjectPlugin from '../plugin/ssr-inject';
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const EslintWebpackPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const openInEditor = require('launch-editor-middleware');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
//const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;
const ContainerReferencePlugin = require('../../libs/ContainerReferencePlugin');
const ModuleFederationPlugin = require('../../libs/ModuleFederationPlugin');

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
  devMiddleware?: {publicPath?: string; serverSideRender?: boolean};
  onBeforeSetupMiddleware?: (server: {app: Express}) => void;
  onAfterSetupMiddleware?: (server: {app: Express}) => void;
  [key: string]: any;
}

function oneOfCssLoader(
  isProdModel: boolean,
  srcPath: string,
  isVue: boolean,
  isServer: boolean,
  cssModulesOptions: Record<string, any>,
  cssType: 'less' | 'sass' | '',
  options?: Record<string, any>
): WebpackLoader[] {
  let cssProcessors: WebpackLoader | null = null;
  if (cssType === 'less') {
    cssProcessors = {
      loader: 'less-loader',
      options: {
        lessOptions: options || {javascriptEnabled: true},
      },
    };
  } else if (cssType === 'sass') {
    cssProcessors = {
      loader: 'sass-loader',
      options: {
        sassOptions: options || {},
      },
    };
  }
  const styleLoader = isProdModel
    ? {loader: MiniCssExtractPlugin.loader}
    : isVue
    ? {
        loader: 'vue-style-loader',
        options: {
          sourceMap: false,
          shadowMode: false,
        },
      }
    : {
        loader: 'style-loader',
      };
  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: false,
      importLoaders: 2,
    },
  };
  const cssLoaderWithModule = {
    loader: 'css-loader',
    options: {
      sourceMap: false,
      importLoaders: 2,
      modules: {
        // localIdentName: '[name]_[local]_[hash:base64:5]',
        getLocalIdent: (context: {resourcePath: string}, localIdentName: string, localName: string) => {
          return getCssScopedName(srcPath, localName, context.resourcePath);
        },
        localIdentContext: srcPath,
        ...cssModulesOptions,
        exportOnlyLocals: isServer,
      },
    },
  };
  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: false,
    },
  };
  const withModule = (isServer ? [cssLoaderWithModule, cssProcessors] : [styleLoader, cssLoaderWithModule, postcssLoader, cssProcessors]).filter(
    Boolean
  ) as WebpackLoader[];
  const withoutModule = (isServer ? ['null-loader'] : [styleLoader, cssLoader, postcssLoader, cssProcessors].filter(Boolean)) as WebpackLoader[];
  return isVue
    ? [
        {
          resourceQuery: /module/,
          use: withModule,
        },
        {
          resourceQuery: /\?vue/,
          use: withoutModule,
        },
        {
          test: /\.module\.\w+$/,
          use: withModule,
        },
        {use: withoutModule},
      ]
    : [
        {
          test: /\.module\.\w+$/,
          use: withModule,
        },
        {use: withoutModule},
      ];
}

function oneOfTsLoader(isProdModel: boolean, isVue: boolean, isServer: boolean, ssrNodeVersion: string): WebpackLoader[] {
  const loaders: WebpackLoader[] = [
    {
      loader: 'babel-loader',
      options: {caller: {versions: isServer ? `{"node":"${ssrNodeVersion}"}` : ''}},
    },
  ];
  if (!isVue && !isServer && !isProdModel) {
    loaders[0].options!.plugins = [require.resolve('react-refresh/babel')];
  }
  if (isServer) {
    return [
      {
        test: /[/\\]index\.ts$/,
        use: [...loaders, {loader: '@elux/cli-webpack/dist/loader/server-module-loader'}],
      },
      {use: loaders},
    ];
  }
  return [
    {
      test: /[/\\]index\.ts$/,
      use: [...loaders, {loader: '@elux/cli-webpack/dist/loader/client-module-loader'}],
    },
    {use: loaders},
  ];
}

function tsxLoaders(isProdModel: boolean, isVue: boolean, isServer: boolean, ssrNodeVersion: string): WebpackLoader[] {
  const loaders: WebpackLoader[] = [
    {
      loader: 'babel-loader',
      options: {caller: {versions: isServer ? `{"node":"${ssrNodeVersion}"}` : ''}},
    },
  ];
  if (!isVue && !isServer && !isProdModel) {
    loaders[0].options!.plugins = [require.resolve('react-refresh/babel')];
  }
  return loaders;
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
  cssProcessors: {less?: Record<string, any> | boolean; sass?: Record<string, any> | boolean};
  cssModulesOptions: Record<string, any>;
  limitSize: number;
  globalVar: {client?: any; server?: any};
  defineConstants: Record<string, string>;
  apiProxy: {[key: string]: any};
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

function moduleExports({
  cache,
  sourceMap,
  nodeEnv,
  rootPath,
  srcPath,
  distPath,
  publicPath,
  clientPublicPath,
  envPath,
  cssProcessors,
  cssModulesOptions,
  enableEslintPlugin,
  enableStylelintPlugin,
  clientMinimize,
  serverMinimize,
  analyzerPort,
  UIType,
  limitSize,
  globalVar,
  defineConstants,
  apiProxy,
  useSSR,
  serverPort,
  ssrNodeVersion,
  resolveAlias,
  moduleFederation,
}: ConfigOptions): {clientWebpackConfig: WebpackConfig; serverWebpackConfig: WebpackConfig; devServerConfig: DevServerConfig} {
  const isProdModel = nodeEnv === 'production';

  if (!isProdModel) {
    clientPublicPath = `${clientPublicPath.replace('//', '``').replace(/\/.+$/, '').replace('``', '//')}/client/`;
  }
  if (moduleFederation && !/^(http:|https:|)\/\//.test(clientPublicPath)) {
    clientPublicPath = `http://localhost:${serverPort}${clientPublicPath}`;
  }
  if (moduleFederation) {
    ContainerReferencePlugin.__setModuleMap__(moduleFederation.modules || {});
    delete moduleFederation.modules;
  }
  const isVue = UIType === 'vue';
  const tsconfigPathTest: string[] = [path.join(srcPath, 'tsconfig.json'), path.join(rootPath, 'tsconfig.json')];
  const tsconfigPath = fs.existsSync(tsconfigPathTest[0]) ? tsconfigPathTest[0] : tsconfigPathTest[1];
  const tsconfig = require(tsconfigPath);
  const {paths = {}, baseUrl = ''} = tsconfig.compilerOptions || {};
  const scriptExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  const cssExtensions = ['css'];
  let VueLoaderPlugin: any = function () {
    return;
  };
  if (isVue) {
    scriptExtensions.unshift('.vue');
    cssExtensions.unshift('vue');
    VueLoaderPlugin = require('vue-loader').VueLoaderPlugin;
  }
  cssProcessors.less && cssExtensions.push('less');
  cssProcessors.sass && cssExtensions.push('sass', 'scss');
  const commonAlias = Object.keys(paths).reduce((obj, name) => {
    const target = path.resolve(path.dirname(tsconfigPath), baseUrl, paths[name][0].replace(/\/\*$/, ''));
    if (name.endsWith('/*')) {
      obj[name.replace(/\/\*$/, '')] = target;
    } else {
      obj[`${name}$`] = target;
    }
    return obj;
  }, {});
  const clientAlias = {};
  const serverAlias = {};

  Object.keys(resolveAlias).forEach((key) => {
    let target = resolveAlias[key];
    if (target.startsWith('./')) {
      target = path.join(rootPath, target);
    }
    if (key.startsWith('server//')) {
      serverAlias[key.replace('server//', '')] = target;
    } else if (key.startsWith('client//')) {
      clientAlias[key.replace('client//', '')] = target;
    } else {
      commonAlias[key] = target;
    }
  });

  const SsrPlugin = getSsrInjectPlugin(path.join(distPath, './server/main.js'), path.join(distPath, './client/index.html'));
  const clientWebpackConfig: WebpackConfig = {
    cache,
    context: rootPath,
    name: 'client',
    mode: nodeEnv,
    target: 'browserslist',
    stats: 'minimal',
    bail: isProdModel,
    devtool: sourceMap,
    entry: path.join(srcPath, './index'),
    performance: false,
    watchOptions: {
      ignored: /node_modules/,
    },
    ignoreWarnings: [/export .* was not found in/, /Critical dependency:\s+require function.*/],
    output: {
      publicPath: clientPublicPath,
      path: path.join(distPath, './client'),
      hashDigestLength: 8,
      filename: isProdModel ? 'js/[name].[contenthash].js' : 'js/[name].js',
      assetModuleFilename: isProdModel ? 'imgs/[hash][ext][query]' : 'imgs/[name]-[hash][ext][query]',
    },
    resolve: {extensions: [...scriptExtensions, '.json'], alias: {...commonAlias, ...clientAlias}},
    optimization: {
      ...(moduleFederation
        ? {
            runtimeChunk: false,
          }
        : {
            splitChunks: {
              chunks: 'all',
            },
          }),
      minimize: isProdModel ? clientMinimize : false,
      minimizer: ['...', new CssMinimizerPlugin()],
    },
    module: {
      rules: [
        isVue && {
          test: /\.vue$/,
          use: {
            loader: 'vue-loader',
          },
        },
        moduleFederation && {
          test: /src[/\\]bootstrap\.ts$/,
          loader: 'bundle-loader',
          options: {
            lazy: true,
          },
        },
        {
          oneOf: [
            {
              test: /\.(svg|png|jpe?g|gif|webp)$/i,
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: limitSize,
                },
              },
            },
            {
              test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
              type: 'asset/resource',
              generator: {
                filename: 'media/[hash][ext][query]',
              },
            },
            {
              test: /\.(woff2?|eot|ttf|otf)$/i,
              type: 'asset/resource',
              generator: {
                filename: 'fonts/[hash][ext][query]',
              },
            },
            {
              test: /\.txt/,
              type: 'asset/source',
            },
            {
              test: /\.(jsx|js)$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  caller: {versions: ''},
                  plugins: !isVue && !isProdModel ? [require.resolve('react-refresh/babel')] : [],
                },
              },
            },
            {
              test: /\.ts$/,
              oneOf: oneOfTsLoader(isProdModel, isVue, false, ssrNodeVersion),
            },
            {
              test: /\.tsx$/,
              use: tsxLoaders(isProdModel, isVue, false, ssrNodeVersion),
            },
            {
              test: /\.css$/,
              oneOf: oneOfCssLoader(isProdModel, srcPath, isVue, false, cssModulesOptions, ''),
            },
            cssProcessors.less && {
              test: /\.less$/,
              oneOf: oneOfCssLoader(
                isProdModel,
                srcPath,
                isVue,
                false,
                cssModulesOptions,
                'less',
                typeof cssProcessors.less === 'object' ? cssProcessors.less : undefined
              ),
            },
            cssProcessors.sass && {
              test: /\.s[ac]ss$/,
              oneOf: oneOfCssLoader(
                isProdModel,
                srcPath,
                isVue,
                false,
                cssModulesOptions,
                'sass',
                typeof cssProcessors.sass === 'object' ? cssProcessors.sass : undefined
              ),
            },
          ].filter(Boolean),
        },
      ].filter(Boolean),
    },
    plugins: [
      moduleFederation && new ModuleFederationPlugin(moduleFederation),
      isVue && new VueLoaderPlugin(),
      isVue
        ? new ForkTsCheckerWebpackPlugin({
            typescript: {
              configFile: tsconfigPath,
              diagnosticOptions: {
                semantic: true,
                syntactic: false,
              },
              extensions: {vue: {enabled: true, compiler: '@vue/compiler-sfc'}},
            },
          })
        : new ForkTsCheckerWebpackPlugin({
            typescript: {
              configFile: tsconfigPath,
              diagnosticOptions: {
                semantic: true,
                syntactic: true,
              },
            },
          }),
      enableEslintPlugin && new EslintWebpackPlugin({cache: true, extensions: scriptExtensions, failOnWarning: true}),
      enableStylelintPlugin && new StylelintPlugin({files: `src/**/*.{${cssExtensions.join(',')}}`, failOnWarning: true}),
      new webpack.DefinePlugin({
        'process.env.PROJ_ENV': JSON.stringify(globalVar.client || {}),
        ...defineConstants,
        ...(isVue ? {__VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false} : {}),
      }),
      new HtmlWebpackPlugin({
        clientPublicPath: clientPublicPath,
        minify: false,
        inject: 'body',
        template: path.join(publicPath, './client/index.html'),
      }),
      isProdModel &&
        new MiniCssExtractPlugin({
          ignoreOrder: true,
          filename: 'css/[name].[contenthash].css',
        }),
      useSSR && SsrPlugin.client,
      !isProdModel && !isVue && new ReactRefreshWebpackPlugin({overlay: false}),
      analyzerPort && new BundleAnalyzerPlugin({reportTitle: 'client', generateStatsFile: true, analyzerPort}),
      new webpack.ProgressPlugin(),
    ].filter(Boolean),
  };

  const serverWebpackConfig: WebpackConfig = useSSR
    ? {
        cache,
        context: rootPath,
        name: 'server',
        mode: nodeEnv,
        target: `node${ssrNodeVersion}`,
        stats: 'minimal',
        bail: isProdModel,
        optimization: {
          minimize: isProdModel ? serverMinimize : false,
        },
        devtool: sourceMap,
        watchOptions: {
          ignored: /node_modules/,
        },
        ignoreWarnings: [/export .* was not found in/, /Critical dependency:\s+require function.*/],
        entry: path.join(srcPath, './server'),
        output: {
          libraryTarget: 'commonjs2',
          publicPath: clientPublicPath,
          path: path.join(distPath, './server'),
          hashDigestLength: 8,
          filename: '[name].js',
          assetModuleFilename: isProdModel ? 'imgs/[hash][ext][query]' : 'imgs/[name]-[hash][ext][query]',
        },
        resolve: {extensions: [...scriptExtensions, '.json'], alias: {...commonAlias, ...serverAlias}},
        module: {
          rules: [
            isVue && {
              test: /\.vue$/,
              use: {
                loader: 'vue-loader',
              },
            },
            {
              oneOf: [
                {
                  test: /\.(svg|png|jpe?g|gif|webp)$/i,
                  type: 'asset',
                  parser: {
                    dataUrlCondition: {
                      maxSize: limitSize,
                    },
                  },
                },
                {
                  test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
                  type: 'asset/resource',
                  generator: {
                    filename: 'media/[hash][ext][query]',
                  },
                },
                {
                  test: /\.(woff2?|eot|ttf|otf)$/i,
                  type: 'asset/resource',
                  generator: {
                    filename: 'fonts/[hash][ext][query]',
                  },
                },
                {
                  test: /\.txt/,
                  type: 'asset/source',
                },
                {
                  test: /\.(jsx|js)$/,
                  exclude: /node_modules/,
                  use: {
                    loader: 'babel-loader',
                    options: {caller: {versions: `{"node":"${ssrNodeVersion}"}`}},
                  },
                },
                {
                  test: /\.ts$/,
                  oneOf: oneOfTsLoader(isProdModel, isVue, true, ssrNodeVersion),
                },
                {
                  test: /\.tsx$/,
                  use: tsxLoaders(isProdModel, isVue, true, ssrNodeVersion),
                },
                {
                  test: /\.css$/,
                  oneOf: oneOfCssLoader(isProdModel, srcPath, isVue, true, cssModulesOptions, ''),
                },
                cssProcessors.less && {
                  test: /\.less$/,
                  oneOf: oneOfCssLoader(
                    isProdModel,
                    srcPath,
                    isVue,
                    true,
                    cssModulesOptions,
                    'less',
                    typeof cssProcessors.less === 'object' ? cssProcessors.less : undefined
                  ),
                },
                cssProcessors.sass && {
                  test: /\.s[ac]ss$/,
                  oneOf: oneOfCssLoader(
                    isProdModel,
                    srcPath,
                    isVue,
                    true,
                    cssModulesOptions,
                    'sass',
                    typeof cssProcessors.sass === 'object' ? cssProcessors.sass : undefined
                  ),
                },
              ].filter(Boolean),
            },
          ].filter(Boolean),
        },
        plugins: [
          isVue && new VueLoaderPlugin(),
          SsrPlugin.server,
          new webpack.DefinePlugin({
            'process.env.PROJ_ENV': JSON.stringify(globalVar.server || {}),
            ...defineConstants,
            ...(isVue ? {__VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false} : {}),
          }),
          analyzerPort && new BundleAnalyzerPlugin({reportTitle: 'server', generateStatsFile: true, analyzerPort: analyzerPort + 1}),
          new webpack.ProgressPlugin(),
        ].filter(Boolean),
      }
    : {name: 'server'};

  const devServerConfig: DevServerConfig = {
    static: [
      {publicPath: clientPublicPath, directory: path.join(envPath, './client')},
      {
        publicPath: clientPublicPath,
        directory: path.join(publicPath, './client'),
        staticOptions: {fallthrough: false},
      },
    ],
    historyApiFallback: {index: '/client/index.html'},
    proxy: apiProxy,
    port: serverPort,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    onBeforeSetupMiddleware: function (devServer: {app: Express}) {
      devServer.app.use('/__open-in-editor', openInEditor());
    },
  };
  if (useSSR) {
    const errorHandler = (e: any, res: any) => {
      if (e.code === 'ELIX.ROUTE_REDIRECT') {
        res.redirect(e.detail);
      } else if (e.code === 'ELIX.ROUTE_RETURN') {
        const {status = 200, body = ''} = e.detail;
        res.status(status).end(body);
      } else {
        const message = `[${e.code}]${e.message}（${e.toString()}）`;
        console.error(message);
        res.status(500).end(message);
      }
    };
    devServerConfig.historyApiFallback = false;
    devServerConfig.devMiddleware = {serverSideRender: true};
    devServerConfig.onAfterSetupMiddleware = function (devServer: {app: Express}) {
      devServer.app.use((req, res, next) => {
        const passUrls = [/\w+.hot-update.\w+$/];
        if (passUrls.some((reg) => reg.test(req.url))) {
          next();
        } else {
          const serverBundle = require(SsrPlugin.getEntryPath(res));
          try {
            serverBundle
              .default(req, res)
              .then((str: string) => {
                res.end(str);
              })
              .catch((e: any) => errorHandler(e, res));
          } catch (e: any) {
            errorHandler(e, res);
          }
        }
      });
    };
  }
  return {clientWebpackConfig, serverWebpackConfig, devServerConfig};
}

declare namespace moduleExports {
  export {ConfigOptions, WebpackLoader, WebpackConfig, DevServerConfig};
}
export = moduleExports;
