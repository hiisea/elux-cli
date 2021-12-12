import path from 'path';
import {log, chalk, Listr, fs, got} from '@elux/cli-utils';

interface Task {
  url: string;
  dist: string;
  timeout?: number;
  override?: number;
  replace?: (code: string) => string;
}
interface Config {
  timeout?: number;
  override?: number;
  replace?: (code: string) => string;
  onComplete?: (skipItems: Record<string, string>, errorItems: Record<string, string>, successItems: number) => void;
  entries: Array<() => Task[]>;
}

interface MetaData {
  config: Config;
  skipItems: Record<string, string>;
  errorItems: Record<string, string>;
  successItems: number;
}

// function download(): Promise<{body: string}> {
//   return new Promise((resove, reject) => {
//     setTimeout(() => {
//       if (Math.random() > 0.5) {
//         resove({body: '222'});
//       } else {
//         reject('111');
//       }
//     }, 10000);
//   });
// }

async function execTask(task: Task, ctx: {title: string}, metaData: MetaData): Promise<void> {
  const {url, dist} = task;
  const {config, skipItems} = metaData;
  const timeout = task.timeout || config.timeout || 10000;
  const override = task.override ?? config.override ?? false;
  const replace = task.replace || config.replace;
  if (!override && fs.existsSync(dist)) {
    skipItems[url + '|' + dist] = 'exists';
    ctx.title = '[s]' + ctx.title;
    return Promise.resolve();
  }
  let {body = ''} = await got(url, {timeout, retry: 0});
  if (replace) {
    body = replace(body);
  }
  fs.ensureDirSync(path.dirname(dist));
  return fs.writeFile(dist, body);
}

async function execEntryTasks(entryTasks: Task[], metaData: MetaData) {
  const n = entryTasks.length;
  while (entryTasks.length) {
    log(`本任务共${chalk.blue(n)}条生成，还剩${chalk.blue(entryTasks.length)}条...`);
    const tasks = entryTasks.splice(0, 10);
    const listr = new Listr<any>(
      tasks.map((item) => {
        return {
          title: item.url,
          retry: 1,
          task: (_, task) =>
            execTask(item, task, metaData).then(
              () => {
                metaData.successItems++;
              },
              (e: Error) => {
                metaData.errorItems[item.url + '|' + item.dist] = e.message;
                throw e;
              }
            ),
        };
      }),
      {concurrent: true, exitOnError: false}
    );
    await listr.run();
  }
}

async function execEntries(metaData: MetaData) {
  const config = metaData.config;
  const entries = config.entries;
  const n = entries.length;
  while (entries.length) {
    log(`共${chalk.red(n)}个任务，正在执行第${chalk.red(n - entries.length + 1)}个`);
    const entry = entries.shift();
    await execEntryTasks(entry!(), metaData);
  }
}
export = async function moduleExports(root: string, configPath: string): Promise<void> {
  const config = require(path.resolve(root, configPath)) as Config;
  const skipItems: Record<string, string> = {};
  const errorItems: Record<string, string> = {};
  const metaData: MetaData = {
    config,
    skipItems,
    errorItems,
    successItems: 0,
  };
  await execEntries(metaData);
  log(
    '执行完成！' +
      chalk.green(`成功${metaData.successItems}条(`) +
      chalk.yellow(`跳过${Object.keys(metaData.skipItems).length}条`) +
      chalk.green(')') +
      '，' +
      chalk.red(`失败${Object.keys(metaData.errorItems).length}条`) +
      '\n'
  );
  if (config.onComplete) {
    config.onComplete(skipItems, errorItems, metaData.successItems);
  }
};
