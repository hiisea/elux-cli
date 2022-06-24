"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const commander_1 = __importDefault(require("commander"));
const cliPackageJson = require('../package.json');
function getBundle(bundleName) {
    let bundlePath, bundle, bundlePackageJson;
    try {
        bundlePath = require.resolve(bundleName);
        bundle = require(bundlePath);
        bundlePackageJson = require(path_1.default.join(bundleName, 'package.json'));
        console.log(cli_utils_1.chalk.bright.bgBlue(`-> Using the package ${bundleName + '@' + bundlePackageJson.version}`));
        console.log('');
        cli_utils_1.checkVersion(bundleName, bundlePackageJson.version, '@elux/cli', bundlePackageJson.peerDependencies['@elux/cli'], cliPackageJson.version);
        console.log('');
        return bundle;
    }
    catch (error) {
        console.error(cli_utils_1.chalk.redBright(`✖ ${cli_utils_1.chalk.bright.bgRedBright(' ' + bundleName + ' ')} was not found!`));
        console.log(cli_utils_1.chalk.yellow('  Please install it with npm...'));
        console.log('');
        throw error;
    }
}
console.log(cli_utils_1.chalk.green.bold(`${cliPackageJson.name}@${cliPackageJson.version}`));
cli_utils_1.checkVersion(cliPackageJson.name, cliPackageJson.version, 'NODE', cliPackageJson.engines.node, process.version);
commander_1.default.version(`${cliPackageJson.name} ${cliPackageJson.version}`).usage('<command> [options]');
commander_1.default
    .command('webpack-dev [env]')
    .description('Use a preset env configurations to start the devServer. Default env is local')
    .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
    .action((env, { port }) => {
    const bundle = getBundle('@elux/cli-webpack');
    bundle.dev({ env: env || 'local', port: parseInt(port || '0') });
});
commander_1.default
    .command('webpack-build [env]')
    .description('Use a preset env configurations to build the project. Default env is local')
    .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
    .option('-a, --analyzer [value]', 'Enable webpack-bundle-analyzer and Set the server port. Default is 8888')
    .action((env, { port, analyzer }) => {
    const analyzerPort = analyzer === true ? 8888 : parseInt(analyzer || '0');
    const bundle = getBundle('@elux/cli-webpack');
    bundle.build({ env: env || 'local', port: parseInt(port || '0'), analyzerPort });
});
commander_1.default
    .command('webpack-pack <input> <output>')
    .description('Packaging JS bundle using webpack')
    .option('-m, --minimize', 'Minimize for output')
    .option('-t, --target <type>', 'Refer to the target of webpack. Default is es5')
    .action((input, output, { target, minimize }) => {
    const bundle = getBundle('@elux/cli-webpack');
    bundle.pack({ input: input || '', output: output || '', target: target || 'es5', minimize: !!minimize });
});
commander_1.default
    .command('mock [env]')
    .description('Use a preset env configurations to start the mockServer. Default env is local')
    .option('-w, --watch', 'Watching for file changes')
    .option('-d, --dir <value>', 'Specify the mock dir path. Default is to load from elux.config.js')
    .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
    .action((env, { watch, dir, port }) => {
    const bundle = getBundle('@elux/cli-mock');
    bundle.run({ env: env || 'local', port: parseInt(port || '0'), watch: !!watch, dir: dir || '' });
});
commander_1.default
    .command('ssg [env]')
    .description('Use a preset env configurations to download and generate web page. Default env is local')
    .action((env) => {
    const bundle = getBundle('@elux/cli-ssg');
    bundle.run({ env: env || 'local' });
});
commander_1.default
    .command('demote')
    .description('Patch the actions without proxy, Make it compatible with lower version browsers')
    .option('--echo', 'echo only, do not write')
    .action(({ echo }) => {
    const bundle = getBundle('@elux/cli-demote');
    bundle.patchActions({ echoOnly: !!echo });
});
commander_1.default
    .command('tpl-lock <dir>')
    .description('Generate npm lock-file')
    .action((dir) => {
    const bundle = getBundle('@elux/cli-tpl');
    bundle.buildLock({ dir: dir || '' });
});
commander_1.default.on('command:*', ([cmd]) => {
    commander_1.default.outputHelp();
    console.log(cli_utils_1.chalk.redBright(`✖ Unknown Command: ${cli_utils_1.chalk.bright.bgRedBright(' ' + cmd + ' ')}`));
    if (cmd === 'init') {
        console.log(`Did you mean ${cli_utils_1.chalk.yellow('elux-init')}?`);
    }
    console.log('');
});
commander_1.default.on('--help', () => {
    console.log('');
    console.log(`  Run ${cli_utils_1.chalk.cyan(`elux <command> --help`)} for detailed usage of given command.`);
    console.log('');
});
commander_1.default.commands.forEach((c) => c.on('--help', () => console.log('')));
commander_1.default.parse(process.argv);
