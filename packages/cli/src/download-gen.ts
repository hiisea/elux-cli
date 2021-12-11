import path from 'path';
import {log, chalk, Listr} from '@elux/cli-utils';

interface Task {
  url: string;
  dist: string;
}
interface Config {
  entries: Array<() => Task[]>;
}

function download() {
  return new Promise((resove) => {
    setTimeout(() => resove(undefined), 10000);
  });
}

async function execTask({url, dist}: {url: string; dist: string}): Promise<void> {
  //const spinner = ora(`${chalk.underline(url)} -> ${dist}`).start();
  await download();
  //spinner.succeed();
  // const pipeline = promisify(stream.pipeline);
  // return pipeline(got.stream(task.url), fs.createWriteStream(task.dist));
}

async function execEntryTasks(entryTasks: Task[]) {
  const n = entryTasks.length;
  while (entryTasks.length) {
    log(`本次任务共 ${chalk.blue(n)} 条生成，还剩 ${chalk.blue(entryTasks.length)} 条...`);
    const tasks = entryTasks.splice(0, 10);
    //const list = tasks.map(execTask);
    const listr = new Listr(
      tasks.map((item) => {
        return {
          title: item.url,
          task: () => execTask(item),
        };
      })
    );
    await listr.run();
  }
}

async function execEntries(entries: Array<() => Task[]>) {
  const n = entries.length;
  while (entries.length) {
    log(`共发现 ${chalk.red(n)} 个任务，正在执行第 ${chalk.red(n - entries.length + 1)} 个任务`);
    const entry = entries.shift();
    await execEntryTasks(entry!());
  }
}
export = async function moduleExports(configPath: string): Promise<void> {
  const config: Config = require(path.resolve(process.cwd(), configPath));
  execEntries(config.entries);
};
