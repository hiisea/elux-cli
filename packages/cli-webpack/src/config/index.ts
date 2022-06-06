import path from 'path';
import {chalk, checkPort, fse, getEluxConfig, getLocalIP} from '@elux/cli-utils';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, {Compiler, MultiCompiler} from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import genConfig from './gen';

export async function dev({env, port}: {env: string; port: number}): Promise<void> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = fse.existsSync(packageJsonPath) ? require(packageJsonPath) : {};
  const ssrNodeVersion: string = (packageJson.ssrnode || process.version)
    .replace(/[^\d.]/g, '')
    .split('.', 2)
    .join('.');
  const {config: baseEluxConfig, envPath} = getEluxConfig(env);
  const config = genConfig(process.cwd(), baseEluxConfig, env, envPath, 'development', ssrNodeVersion, port);
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
      envConfig: {clientPublicPath, clientGlobalVar, serverGlobalVar, defineConstants},
      useSSR,
      onCompiled,
    },
  } = config;
  const protAvailable = await checkPort(serverPort);
  if (!protAvailable) {
    console.error(chalk.redBright(`\n\n[error] The port: ${serverPort} is occupied. DevServer startup failed!\n\n`));
    process.exit(1);
  }
  const envInfo: any = {
    clientPublicPath,
    defineConstants,
    clientGlobalVar,
  };
  if (useSSR) {
    envInfo.serverGlobalVar = serverGlobalVar;
  }
  console.log(`projectType: ${chalk.green(projectType)} runMode: ${chalk.green(nodeEnv)} sourceMap: ${chalk.green(sourceMap)}`);
  console.log(`EnvName: ${chalk.green(env)} EnvPath: ${chalk.green(envPath)} EnvData: \n${chalk.gray(JSON.stringify(envInfo, null, 4))} \n`);

  let webpackCompiler: MultiCompiler | Compiler;
  if (useSSR) {
    const compiler = webpack([clientWebpackConfig, serverWebpackConfig]);
    compiler.compilers[0].hooks.failed.tap('elux-webpack-client dev', (msg) => {
      console.error(msg.toString());
      process.exit(1);
    });
    compiler.compilers[1].hooks.failed.tap('elux-webpack-server dev', (msg) => {
      console.error(msg.toString());
      process.exit(1);
    });
    webpackCompiler = compiler;
  } else {
    const compiler = webpack(clientWebpackConfig);
    compiler.hooks.failed.tap('elux-webpack-client dev', (msg) => {
      console.error(msg.toString());
      process.exit(1);
    });
    webpackCompiler = compiler;
  }

  const protocol = devServerConfig.https ? 'https' : 'http';
  // const host = devServerConfig.host || '0.0.0.0';
  const publicPath = devServerConfig.dev?.publicPath || '/';
  const localUrl = `${protocol}://localhost:${serverPort}${publicPath}`;
  const localIpUrl = `${protocol}://${getLocalIP()}:${serverPort}${publicPath}`;

  const devServer = new WebpackDevServer(devServerConfig, webpackCompiler);

  let isFirstCompile = true;
  webpackCompiler.hooks.done.tap('elux-webpack dev', (stats: any) => {
    if (stats.hasErrors()) {
      return;
    }

    if (isFirstCompile) {
      isFirstCompile = false;
      console.log(`

***************************************
*                                     *
*           ${chalk.green.bold('Welcome to Elux')}           *
*                                     *
***************************************
`);
      console.log(`🚀...${chalk.bright.bgRedBright(useSSR ? ' SSR DevServer ' : ' DevServer ')} running at ${chalk.green.underline(localUrl)}`);
      console.log(`🚀...${chalk.bright.bgRedBright(useSSR ? ' SSR DevServer ' : ' DevServer ')} running at ${chalk.green.underline(localIpUrl)} \n`);
      console.log(`WebpackCache: ${chalk.cyan(cache)}`);
      if (cache !== 'filesystem') {
        console.log(`${chalk.yellow('You can set filesystem cache to speed up compilation: https://webpack.js.org/configuration/cache/')} \n`);
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
  //     console.error(err);
  //     process.exit(1);
  //   }
  // });
}

export function build({env, port, analyzerPort}: {env: string; port: number; analyzerPort: number}): void {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = fse.existsSync(packageJsonPath) ? require(packageJsonPath) : {};
  const ssrNodeVersion: string = (packageJson.ssrnode || process.version)
    .replace(/[^\d.]/g, '')
    .split('.', 2)
    .join('.');
  const {config: baseEluxConfig, envPath} = getEluxConfig(env);
  const config = genConfig(process.cwd(), baseEluxConfig, env, envPath, 'production', ssrNodeVersion, port, analyzerPort);
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
  console.log(`projectType: ${chalk.green(projectType)} runMode: ${chalk.green(nodeEnv)} sourceMap: ${chalk.green(sourceMap)}`);
  console.log(`EnvName: ${chalk.green(env)} EnvPath: ${chalk.green(envPath)} EnvData: \n${chalk.cyan(JSON.stringify(envInfo, null, 4))} \n`);

  fse.ensureDirSync(distPath);
  fse.emptyDirSync(distPath);
  fse.copySync(publicPath, distPath, {dereference: true});
  if (fse.existsSync(envPath)) {
    fse.copySync(envPath, distPath, {dereference: true, filter: (fpath) => !fpath.endsWith('elux.config.js')});
  }
  fse.outputFileSync(
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
      console.error(stats.toString('errors-warnings'));
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
    console.log(`WebpackCache: ${chalk.cyan(cache)}`);
    if (useSSR) {
      ['imgs', 'media', 'fonts'].forEach((dir) => {
        fse.removeSync(path.join(distPath, 'server', dir));
      });
    }
    onCompiled();
  });
}

export function pack({input, output, target, minimize}: {input: string; output: string; target: string; minimize: boolean}): void {
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
      console.error(stats.toString('errors-warnings'));
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
