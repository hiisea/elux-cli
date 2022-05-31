import {chalk, download, fse, ora} from '@elux/cli-utils';

export function loadRepository(url: string, targetDir: string, removeTarget: boolean): Promise<void> {
  if (removeTarget && fse.existsSync(targetDir)) {
    fse.removeSync(targetDir);
  }
  const proxyUrl = global['GLOBAL_AGENT'].HTTP_PROXY;
  console.log(chalk.yellow('using proxy -> ' + (proxyUrl || 'none')));
  console.log(chalk.cyan.underline('Pulling from ' + url));
  const spinner = ora('Loading...').start();

  return download(url, targetDir, {
    extract: true,
    strip: 1,
    headers: {
      //accept: 'application/zip',
      'user-agent': 'Chrome/99.0',
    },
  }).then(
    () => {
      spinner.succeed(`${chalk.green('Pull successful!!!')}\n`);
    },
    (e: any) => {
      spinner.fail(chalk.redBright('Pull failed!!!'));
      console.log(chalk.yellow(e.toString()));
      throw e;
    }
  );
}
