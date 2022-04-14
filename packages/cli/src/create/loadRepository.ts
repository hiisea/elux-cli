import {fs, log, chalk, ora, download} from '@elux/cli-utils';

export function loadRepository(url: string, targetDir: string, removeTarget: boolean): Promise<void> {
  if (removeTarget && fs.existsSync(targetDir)) {
    fs.removeSync(targetDir);
  }
  const proxyUrl = global['GLOBAL_AGENT'].HTTP_PROXY;
  log(chalk.yellow('using proxy -> ' + (proxyUrl || 'none')));
  log(chalk.blue.underline('Pulling from ' + url));
  const spinner = ora('Loading...').start();

  return download(url, targetDir, {
    extract: true,
    headers: {
      //accept: 'application/zip',
      'user-agent': 'Chrome/99.0',
    },
  }).then(
    () => {
      spinner.succeed(`${chalk.green('Pull successful!!!')}\n`);
    },
    (e) => {
      spinner.fail(chalk.red('Pull failed!!!'));
      log(chalk.yellow(e.toString()));
      throw e;
    }
  );
}
