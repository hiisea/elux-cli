#!/usr/bin/env node

const {chalk, log, checkNodeVersion} = require('@elux/cli-utils');
const leven = require('leven');
const packageJson = require('../package.json');

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
    const args = [process.cwd(), env || 'local', options.port];
    require(moduleName).dev(...args);
  });

program
  .command('build [env]')
  .description('Use a preset env configurations to build the project. Default env is local')
  .option('-c, --compiler <value>', 'Default is webpack')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, options) => {
    const moduleName = `@elux/cli-${options.compiler || 'webpack'}`;
    const args = [process.cwd(), env || 'local', options.port];
    require(moduleName).build(...args);
  });

program
  .command('mock [env]')
  .description('Use a preset env configurations to start the mockServer')
  .option('-w, --watch', 'Watching for file changes')
  .option('-d, --dir <value>', 'Specify the mock dir path. Default is to load from elux.config.js')
  .option('-p, --port <value>', 'Normalize a port into a number. Default is to load from elux.config.js')
  .action((env, options) => {
    const args = [process.cwd(), env || 'local', options];
    require('@elux/cli-mock')(...args);
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
  .option('-c, --compiler <value>', 'Default is webpack')
  .option('-t, --target <type>', 'Refer to the target of webpack. Default is es5')
  .action((input, output, options) => {
    const moduleName = `@elux/cli-${options.compiler || 'webpack'}`;
    const args = [input, output, options.target || 'es5'];
    require(moduleName).pack(...args);
  });

program
  .command('gen [configPath]')
  .description('Download and generate web pages from URLs. Default config is ./elux.gen.js')
  .action((configPath) => {
    require('../dist/download-gen')(process.cwd(), configPath || './elux.gen.js');
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
