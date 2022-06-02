"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = exports.build = exports.dev = void 0;
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_server_1 = __importDefault(require("webpack-dev-server"));
const gen_1 = __importDefault(require("./gen"));
async function dev({ env, port }) {
    const packageJsonPath = path_1.default.join(process.cwd(), 'package.json');
    const packageJson = cli_utils_1.fse.existsSync(packageJsonPath) ? require(packageJsonPath) : {};
    const ssrNodeVersion = (packageJson.ssrnode || process.version)
        .replace(/[^\d.]/g, '')
        .split('.', 2)
        .join('.');
    const { config: baseEluxConfig, envPath } = cli_utils_1.getEluxConfig(env);
    const config = gen_1.default(process.cwd(), baseEluxConfig, env, envPath, 'development', ssrNodeVersion, port);
    const { devServerConfig, clientWebpackConfig, serverWebpackConfig, projectConfig: { cache, sourceMap, projectType, serverPort, nodeEnv, envConfig: { clientPublicPath, clientGlobalVar, serverGlobalVar, defineConstants }, useSSR, onCompiled, }, } = config;
    const protAvailable = await cli_utils_1.checkPort(serverPort);
    if (!protAvailable) {
        console.error(cli_utils_1.chalk.redBright(`\n\n[error] The port: ${serverPort} is occupied. DevServer startup failed!\n\n`));
        process.exit(1);
    }
    const envInfo = {
        clientPublicPath,
        defineConstants,
        clientGlobalVar,
    };
    if (useSSR) {
        envInfo.serverGlobalVar = serverGlobalVar;
    }
    console.log(`projectType: ${cli_utils_1.chalk.green(projectType)} runMode: ${cli_utils_1.chalk.green(nodeEnv)} sourceMap: ${cli_utils_1.chalk.green(sourceMap)}`);
    console.log(`EnvName: ${cli_utils_1.chalk.green(env)} EnvPath: ${cli_utils_1.chalk.green(envPath)} EnvData: \n${cli_utils_1.chalk.gray(JSON.stringify(envInfo, null, 4))} \n`);
    let webpackCompiler;
    if (useSSR) {
        const compiler = webpack_1.default([clientWebpackConfig, serverWebpackConfig]);
        compiler.compilers[0].hooks.failed.tap('elux-webpack-client dev', (msg) => {
            console.error(msg.toString());
            process.exit(1);
        });
        compiler.compilers[1].hooks.failed.tap('elux-webpack-server dev', (msg) => {
            console.error(msg.toString());
            process.exit(1);
        });
        webpackCompiler = compiler;
    }
    else {
        const compiler = webpack_1.default(clientWebpackConfig);
        compiler.hooks.failed.tap('elux-webpack-client dev', (msg) => {
            console.error(msg.toString());
            process.exit(1);
        });
        webpackCompiler = compiler;
    }
    const protocol = devServerConfig.https ? 'https' : 'http';
    const publicPath = devServerConfig.dev?.publicPath || '/';
    const localUrl = `${protocol}://localhost:${serverPort}${publicPath}`;
    const localIpUrl = `${protocol}://${cli_utils_1.getLocalIP()}:${serverPort}${publicPath}`;
    const devServer = new webpack_dev_server_1.default(devServerConfig, webpackCompiler);
    let isFirstCompile = true;
    webpackCompiler.hooks.done.tap('elux-webpack dev', (stats) => {
        if (stats.hasErrors()) {
            return;
        }
        if (isFirstCompile) {
            isFirstCompile = false;
            console.log(`

***************************************
*                                     *
*           ${cli_utils_1.chalk.green.bold('Welcome to Elux')}           *
*                                     *
***************************************
`);
            console.log(`🚀...${cli_utils_1.chalk.yellow.bgRedBright(useSSR ? ' SSR DevServer ' : ' DevServer ')} running at ${cli_utils_1.chalk.green.underline(localUrl)}`);
            console.log(`🚀...${cli_utils_1.chalk.yellow.bgRedBright(useSSR ? ' SSR DevServer ' : ' DevServer ')} running at ${cli_utils_1.chalk.green.underline(localIpUrl)} \n`);
            console.log(`WebpackCache: ${cli_utils_1.chalk.cyan(cache)}`);
            if (cache !== 'filesystem') {
                console.log(`${cli_utils_1.chalk.yellow('You can set filesystem cache to speed up compilation: https://webpack.js.org/configuration/cache/')} \n`);
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
}
exports.dev = dev;
function build({ env, port, analyzerPort }) {
    const packageJsonPath = path_1.default.join(process.cwd(), 'package.json');
    const packageJson = cli_utils_1.fse.existsSync(packageJsonPath) ? require(packageJsonPath) : {};
    const ssrNodeVersion = (packageJson.ssrnode || process.version)
        .replace(/[^\d.]/g, '')
        .split('.', 2)
        .join('.');
    const { config: baseEluxConfig, envPath } = cli_utils_1.getEluxConfig(env);
    const config = gen_1.default(process.cwd(), baseEluxConfig, env, envPath, 'production', ssrNodeVersion, port, analyzerPort);
    const { clientWebpackConfig, serverWebpackConfig, projectConfig: { cache, sourceMap, publicPath, distPath, projectType, nodeEnv, envConfig: { clientPublicPath, clientGlobalVar, serverGlobalVar }, useSSR, serverPort, apiProxy, onCompiled, }, } = config;
    const envInfo = {
        clientPublicPath,
        clientGlobalVar,
        serverGlobalVar,
    };
    console.log(`projectType: ${cli_utils_1.chalk.green(projectType)} runMode: ${cli_utils_1.chalk.green(nodeEnv)} sourceMap: ${cli_utils_1.chalk.green(sourceMap)}`);
    console.log(`EnvName: ${cli_utils_1.chalk.green(env)} EnvPath: ${cli_utils_1.chalk.green(envPath)} EnvData: \n${cli_utils_1.chalk.cyan(JSON.stringify(envInfo, null, 4))} \n`);
    cli_utils_1.fse.ensureDirSync(distPath);
    cli_utils_1.fse.emptyDirSync(distPath);
    cli_utils_1.fse.copySync(publicPath, distPath, { dereference: true });
    if (cli_utils_1.fse.existsSync(envPath)) {
        cli_utils_1.fse.copySync(envPath, distPath, { dereference: true, filter: (fpath) => !fpath.endsWith('elux.config.js') });
    }
    cli_utils_1.fse.outputFileSync(path_1.default.join(distPath, 'config.js'), `module.exports = ${JSON.stringify({ projectType, port: serverPort, proxy: apiProxy, clientGlobalVar, serverGlobalVar, node: ssrNodeVersion }, null, 4)}`);
    const webpackCompiler = useSSR ? webpack_1.default([clientWebpackConfig, serverWebpackConfig]) : webpack_1.default(clientWebpackConfig);
    webpackCompiler.run((error, stats) => {
        if (error)
            throw error;
        if (stats?.hasErrors() || stats?.hasWarnings()) {
            console.error(stats.toString('errors-warnings'));
            process.exit(1);
        }
        process.stdout.write(`${stats.toString({
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false,
        })}\n\n`);
        console.log(`WebpackCache: ${cli_utils_1.chalk.cyan(cache)}`);
        if (useSSR) {
            ['imgs', 'media', 'fonts'].forEach((dir) => {
                cli_utils_1.fse.removeSync(path_1.default.join(distPath, 'server', dir));
            });
        }
        onCompiled();
    });
}
exports.build = build;
function pack({ input, output, target, minimize }) {
    let outputPath;
    let ouputName;
    if (path_1.default.extname(output)) {
        outputPath = path_1.default.dirname(output);
        ouputName = path_1.default.basename(output);
    }
    else {
        outputPath = output;
        ouputName = path_1.default.basename(input);
    }
    const webpackConfig = {
        mode: 'production',
        target: ['web', target],
        stats: 'minimal',
        devtool: false,
        entry: path_1.default.resolve(input),
        optimization: minimize
            ? {
                minimizer: [
                    new terser_webpack_plugin_1.default({
                        extractComments: false,
                    }),
                ],
            }
            : { minimize: false },
        output: {
            path: path_1.default.resolve(outputPath),
            filename: ouputName,
        },
        plugins: [new webpack_1.default.BannerPlugin({ banner: 'eslint-disable', entryOnly: true })],
    };
    const compiler = webpack_1.default(webpackConfig);
    compiler.run((error, stats) => {
        if (error)
            throw error;
        if (stats?.hasErrors() || stats?.hasWarnings()) {
            console.error(stats.toString('errors-warnings'));
            process.exit(1);
        }
        process.stdout.write(`${stats.toString({
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false,
        })}\n\n`);
    });
}
exports.pack = pack;
