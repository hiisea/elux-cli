#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const leven = require('leven');
const {chalk, log, checkNodeVersion, deepExtend} = require('@elux/cli-utils');
const packageJson = require('../package.json');
const projectPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json')) ? require(path.join(process.cwd(), 'package.json')) : {};
checkNodeVersion(packageJson.engines.node, '@elux/cli');

const program = require('commander');
program.version(`@elux/cli ${require('../package').version}`).usage('<command> [options]');

program
  .command('init')
  .description('Initialize new project')
  .action(() => {
    require('../dist/create-project')({packageJson});
  });

program
  .command('dev [env]')
  .description('Use a preset env configurations to start the devServer. Default env is local')
  .option('-c, --compiler <value>', 'Default is webpack')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, options) => {
    const moduleName = `@elux/cli-${options.compiler || 'webpack'}`;
    env = env || 'local';
    const {config, envPath} = getConfig(process.cwd(), env);
    const args = [process.cwd(), config, env, envPath, projectPackageJson, options.port];
    require(moduleName).dev(...args);
  });

program
  .command('build [env]')
  .description('Use a preset env configurations to build the project. Default env is local')
  .option('-c, --compiler <value>', 'Default is webpack')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, options) => {
    const moduleName = `@elux/cli-${options.compiler || 'webpack'}`;
    env = env || 'local';
    const {config, envPath} = getConfig(process.cwd(), env);
    const args = [process.cwd(), config, env, envPath, projectPackageJson, options.port];
    require(moduleName).build(...args);
  });

program
  .command('mock [env]')
  .description('Use a preset env configurations to start the mockServer. Default env is local')
  .option('-w, --watch', 'Watching for file changes')
  .option('-d, --dir <value>', 'Specify the mock dir path. Default is to load from elux.config.js')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, options) => {
    env = env || 'local';
    const {config} = getConfig(process.cwd(), env);
    const args = [process.cwd(), config, options];
    require('@elux/cli-mock')(...args);
  });

program
  .command('gen [env]')
  .description('Use a preset env configurations to download and generate web page. Default env is local')
  .action((env) => {
    env = env || 'local';
    const {config} = getConfig(process.cwd(), env);
    const args = [process.cwd(), config, env];
    require('../dist/download-gen')(...args);
  });

program
  .command('demote [entry]')
  .description('Patch the actions without proxy, Make it compatible with lower version browsers')
  .option('--echo', 'echo only, do not write')
  .action((entry, options) => {
    const args = [entry, !!options.echo];
    require('../dist/patch-actions')(...args);
  });

program
  .command('pack <input> <output>')
  .description('Packaging JS bundle using a packager. Default is webpack')
  .option('-m, --minimize', 'Minimize for output')
  .option('-c, --compiler <value>', 'Default is webpack')
  .option('-t, --target <type>', 'Refer to the target of webpack. Default is es5')
  .action((input, output, options) => {
    const moduleName = `@elux/cli-${options.compiler || 'webpack'}`;
    const args = [input, output, options.target || 'es5', !!options.minimize];
    require(moduleName).pack(...args);
  });

// output help information on unknown commands
program.on('command:*', ([cmd]) => {
  program.outputHelp();
  log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  log('');
  suggestCommands(cmd);
  process.exitCode = 1;
});

// add some useful info on help
program.on('--help', () => {
  log('');
  log(`  Run ${chalk.cyan(`elux <command> --help`)} for detailed usage of given command.`);
  log('');
});

program.commands.forEach((c) => c.on('--help', () => log('')));

program.parse(process.argv);

function suggestCommands(unknownCommand) {
  const availableCommands = program.commands.map((cmd) => cmd._name);

  let suggestion;

  availableCommands.forEach((cmd) => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand);
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd;
    }
  });

  if (suggestion) {
    log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`));
  }
}

function getConfig(rootPath, env) {
  const baseEluxConfig = fs.existsSync(path.join(rootPath, 'elux.config.js')) ? require(path.join(rootPath, 'elux.config.js')) : {};
  const envDir = baseEluxConfig.envDir || './env';
  const envPath = path.resolve(rootPath, envDir, `./${env}`);
  const envEluxConfig = fs.existsSync(path.join(envPath, `elux.config.js`)) ? require(path.join(envPath, `elux.config.js`)) : {};
  return {config: deepExtend(baseEluxConfig, envEluxConfig), envPath};
}
