import path from 'path';
import {chalk, checkVersion} from '@elux/cli-utils';
import program from 'commander';
const cliPackageJson: BundlePackage = require('../package.json');

type BundlePackage = {name: string; version: string; engines: {node?: string}; peerDependencies: {'@elux/cli'?: string}};

type WebpackBundle = {
  dev(args: {env: string; port: number}): void;
  build(args: {env: string; port: number; analyzerPort: number}): void;
  pack(args: {input: string; output: string; target: string; minimize: boolean}): void;
};

type MockBundle = {
  run(args: {env: string; port: number; watch: boolean; dir: string}): void;
};

type SSGBundle = {
  run(args: {env: string}): void;
};

type DemoteBundle = {
  patchActions(args: {echoOnly: boolean}): void;
};

type TPLBundle = {
  buildLock(args: {dir: string}): void;
};

function getBundle<T>(bundleName: string): T {
  let bundlePath: string, bundle: T, bundlePackageJson: BundlePackage;
  try {
    bundlePath = require.resolve(bundleName);
    bundle = require(bundlePath);
    bundlePackageJson = require(path.join(bundleName, 'package.json'));
    console.log(chalk.bright.bgCyan(`-> Using the package ${bundleName + '@' + bundlePackageJson.version}`));
    console.log('');
    checkVersion(bundleName, bundlePackageJson.version, '@elux/cli', bundlePackageJson.peerDependencies['@elux/cli'], cliPackageJson.version);
    console.log('');
    return bundle;
  } catch (error) {
    console.error(chalk.redBright(`✖ ${chalk.bright.bgRedBright(' ' + bundleName + ' ')} was not found!`));
    console.log(chalk.yellow('  Please install it with npm...'));
    console.log('');
    throw error;
  }
}

console.log(chalk.green.bold(`${cliPackageJson.name}@${cliPackageJson.version}`));
checkVersion(cliPackageJson.name, cliPackageJson.version, 'NODE', cliPackageJson.engines.node, process.version);

program.version(`${cliPackageJson.name} ${cliPackageJson.version}`).usage('<command> [options]');

program
  .command('webpack-dev [env]')
  .description('Use a preset env configurations to start the devServer. Default env is local')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, {port}) => {
    const bundle = getBundle<WebpackBundle>('@elux/cli-webpack');
    bundle.dev({env: env || 'local', port: parseInt(port || '0')});
  });

program
  .command('webpack-build [env]')
  .description('Use a preset env configurations to build the project. Default env is local')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .option('-a, --analyzer [value]', 'Enable webpack-bundle-analyzer and Set the server port. Default is 8888')
  .action((env, {port, analyzer}) => {
    const analyzerPort = analyzer === true ? 8888 : parseInt(analyzer || '0');
    const bundle = getBundle<WebpackBundle>('@elux/cli-webpack');
    bundle.build({env: env || 'local', port: parseInt(port || '0'), analyzerPort});
  });

program
  .command('webpack-pack <input> <output>')
  .description('Packaging JS bundle using webpack')
  .option('-m, --minimize', 'Minimize for output')
  .option('-t, --target <type>', 'Refer to the target of webpack. Default is es5')
  .action((input, output, {target, minimize}) => {
    const bundle = getBundle<WebpackBundle>('@elux/cli-webpack');
    bundle.pack({input: input || '', output: output || '', target: target || 'es5', minimize: !!minimize});
  });

program
  .command('mock [env]')
  .description('Use a preset env configurations to start the mockServer. Default env is local')
  .option('-w, --watch', 'Watching for file changes')
  .option('-d, --dir <value>', 'Specify the mock dir path. Default is to load from elux.config.js')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, {watch, dir, port}) => {
    const bundle = getBundle<MockBundle>('@elux/cli-mock');
    bundle.run({env: env || 'local', port: parseInt(port || '0'), watch: !!watch, dir: dir || ''});
  });

program
  .command('ssg [env]')
  .description('Use a preset env configurations to download and generate web page. Default env is local')
  .action((env) => {
    const bundle = getBundle<SSGBundle>('@elux/cli-ssg');
    bundle.run({env: env || 'local'});
  });

program
  .command('demote')
  .description('Patch the actions without proxy, Make it compatible with lower version browsers')
  .option('--echo', 'echo only, do not write')
  .action(({echo}) => {
    const bundle = getBundle<DemoteBundle>('@elux/cli-demote');
    bundle.patchActions({echoOnly: !!echo});
  });

program
  .command('tpl-lock <dir>')
  .description('Generate npm lock-file')
  .action((dir) => {
    const bundle = getBundle<TPLBundle>('@elux/cli-tpl');
    bundle.buildLock({dir: dir || ''});
  });

program.on('command:*', ([cmd]) => {
  program.outputHelp();
  console.log(chalk.redBright(`✖ Unknown Command: ${chalk.bright.bgRedBright(' ' + cmd + ' ')}`));
  if (cmd === 'init') {
    console.log(`Did you mean ${chalk.yellow('elux-init')}?`);
  }
  console.log('');
});

program.on('--help', () => {
  console.log('');
  console.log(`  Run ${chalk.cyan(`elux <command> --help`)} for detailed usage of given command.`);
  console.log('');
});

program.commands.forEach((c) => c.on('--help', () => console.log('')));

program.parse(process.argv);
