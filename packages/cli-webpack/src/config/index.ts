import path from 'path';
import WebpackDevServer from 'webpack-dev-server';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, {Compiler, MultiCompiler} from 'webpack';
import {fs, chalk, localIP, log, err, checkPort} from '@elux/cli-utils';
import genConfig from './gen';

export async function dev(
  rootPath: string,
  baseEluxConfig: Record<string, any>,
  envName: string,
  envPath: string,
  packageJSON: Record<string, any>,
  port?: number
): Promise<void> {
  const ssrNodeVersion: string = (packageJSON.ssrnode || process.version)
    .replace(/[^\d.]/g, '')
    .split('.', 2)
    .join('.');
  const config = genConfig(rootPath, baseEluxConfig, envName, envPath, 'development', ssrNodeVersion, port);
  const {
    devServerConfig,
    clientWebpackConfig,
    serverWebpackConfig,
    projectConfig: {
      cache,
      sourceMap,
      projectType,
      serverPort,
      nodeEnv,
      envConfig: {clientPublicPath, clientGlobalVar, serverGlobalVar},
      useSSR,
      onCompiled,
    },
  } = config;
  const protAvailable = await checkPort(serverPort);
  if (!protAvailable) {
    err(chalk.red(`\n\n[error] The port: ${serverPort} is occupied. DevServer startup failed!\n\n`));
    process.exit(1);
  }
  const envInfo: any = {
    clientPublicPath,
    clientGlobalVar,
  };
  if (useSSR) {
    envInfo.serverGlobalVar = serverGlobalVar;
  }
  log(`projectType: ${chalk.magenta(projectType)} runMode: ${chalk.magenta(nodeEnv)} sourceMap: ${chalk.magenta(sourceMap)}`);
  log(`EnvName: ${chalk.magenta(envName)} EnvPath: ${chalk.magenta(envPath)} EnvData: \n${chalk.gray(JSON.stringify(envInfo, null, 4))} \n`);

  let webpackCompiler: MultiCompiler | Compiler;
  if (useSSR) {
    const compiler = webpack([clientWebpackConfig, serverWebpackConfig]);
    compiler.compilers[0].hooks.failed.tap('elux-webpack-client dev', (msg) => {
      err(msg.toString());
      process.exit(1);
    });
    compiler.compilers[1].hooks.failed.tap('elux-webpack-server dev', (msg) => {
      err(msg.toString());
      process.exit(1);
    });
    webpackCompiler = compiler;
  } else {
    const compiler = webpack(clientWebpackConfig);
    compiler.hooks.failed.tap('elux-webpack-client dev', (msg) => {
      err(msg.toString());
      process.exit(1);
    });
    webpackCompiler = compiler;
  }

  const protocol = devServerConfig.https ? 'https' : 'http';
  // const host = devServerConfig.host || '0.0.0.0';
  const publicPath = devServerConfig.dev?.publicPath || '/';
  const localUrl = `${protocol}://localhost:${serverPort}${publicPath}`;
  const localIpUrl = `${protocol}://${localIP}:${serverPort}${publicPath}`;

  const devServer = new WebpackDevServer(devServerConfig, webpackCompiler);

  let isFirstCompile = true;
  webpackCompiler.hooks.done.tap('elux-webpack dev', (stats: any) => {
    if (stats.hasErrors()) {
      return;
    }

    if (isFirstCompile) {
      isFirstCompile = false;
      log(`

***************************************
*                                     *
*           ${chalk.green.bold('Welcome to Elux')}           *
*                                     *
***************************************
`);
      log(`.....${chalk.magenta(useSSR ? 'Enabled Server-Side Rendering!' : 'DevServer')} running at ${chalk.magenta.underline(localUrl)}`);
      log(`.....${chalk.magenta(useSSR ? 'Enabled Server-Side Rendering!' : 'DevServer')} running at ${chalk.magenta.underline(localIpUrl)} \n`);
      log(`WebpackCache: ${chalk.blue(cache)}`);
      if (cache !== 'filesystem') {
        log(`${chalk.gray('You can set filesystem cache to speed up compilation: https://webpack.js.org/configuration/cache/')} \n`);
      }
      onCompiled();
    }
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      devServer.stop();
    });
  });

  devServer.start().catch(() => process.exit(1));

  // devServer.startCallback((err: any) => {
  //   if (err) {
  //     err(err);
  //     process.exit(1);
  //   }
  // });
}

export function build(
  rootPath: string,
  baseEluxConfig: Record<string, any>,
  envName: string,
  envPath: string,
  packageJSON: Record<string, any>,
  port?: number
): void {
  const ssrNodeVersion: string = (packageJSON.ssrnode || process.version)
    .replace(/[^\d.]/g, '')
    .split('.', 2)
    .join('.');
  const config = genConfig(rootPath, baseEluxConfig, envName, envPath, 'production', ssrNodeVersion, port);
  const {
    clientWebpackConfig,
    serverWebpackConfig,
    projectConfig: {
      cache,
      sourceMap,
      publicPath,
      distPath,
      projectType,
      nodeEnv,
      envConfig: {clientPublicPath, clientGlobalVar, serverGlobalVar},
      useSSR,
      serverPort,
      apiProxy,
      onCompiled,
    },
  } = config;

  const envInfo = {
    clientPublicPath,
    clientGlobalVar,
    serverGlobalVar,
  };
  log(`projectType: ${chalk.magenta(projectType)} runMode: ${chalk.magenta(nodeEnv)} sourceMap: ${chalk.magenta(sourceMap)}`);
  log(`EnvName: ${chalk.magenta(envName)} EnvPath: ${chalk.magenta(envPath)} EnvData: \n${chalk.blue(JSON.stringify(envInfo, null, 4))} \n`);

  fs.ensureDirSync(distPath);
  fs.emptyDirSync(distPath);
  fs.copySync(publicPath, distPath, {dereference: true});
  if (fs.existsSync(envPath)) {
    fs.copySync(envPath, distPath, {dereference: true, filter: (fpath) => !fpath.endsWith('elux.config.js')});
  }
  fs.outputFileSync(
    path.join(distPath, 'config.js'),
    `module.exports = ${JSON.stringify(
      {projectType, port: serverPort, proxy: apiProxy, clientGlobalVar, serverGlobalVar, node: ssrNodeVersion},
      null,
      4
    )}`
  );
  const webpackCompiler = useSSR ? webpack([clientWebpackConfig, serverWebpackConfig]) : webpack(clientWebpackConfig);

  webpackCompiler.run((error: any, stats: any) => {
    if (error) throw error;
    if (stats?.hasErrors() || stats?.hasWarnings()) {
      err(stats.toString('errors-warnings'));
      process.exit(1);
    }
    process.stdout.write(
      `${stats!.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
      })}\n\n`
    );
    log(`WebpackCache: ${chalk.blue(cache)}`);
    if (useSSR) {
      ['imgs', 'media', 'fonts'].forEach((dir) => {
        fs.removeSync(path.join(distPath, 'server', dir));
      });
    }
    onCompiled();
  });
}

export function pack(input: string, output: string, target: string, minimize: boolean): void {
  let outputPath;
  let ouputName;
  if (path.extname(output)) {
    outputPath = path.dirname(output);
    ouputName = path.basename(output);
  } else {
    outputPath = output;
    ouputName = path.basename(input);
  }
  const webpackConfig: any = {
    mode: 'production',
    target: ['web', target],
    stats: 'minimal',
    devtool: false,
    entry: path.resolve(input),
    optimization: minimize
      ? {
          minimizer: [
            new TerserPlugin({
              extractComments: false,
            }),
          ],
        }
      : {minimize: false},
    output: {
      path: path.resolve(outputPath),
      filename: ouputName,
    },
    plugins: [new webpack.BannerPlugin({banner: 'eslint-disable', entryOnly: true})],
  };
  const compiler = webpack(webpackConfig);

  compiler.run((error, stats) => {
    if (error) throw error;
    if (stats?.hasErrors() || stats?.hasWarnings()) {
      err(stats.toString('errors-warnings'));
      process.exit(1);
    }
    process.stdout.write(
      `${stats!.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
      })}\n\n`
    );
  });
}
