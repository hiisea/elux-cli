import path from 'path';
import {chalk, fse, getEluxConfig, schemaValidate} from '@elux/cli-utils';
import got from 'got';
import {Listr} from 'listr2';

interface Task {
  url: string;
  dist: string;
  timeout?: number;
  override?: boolean;
  replace?: (code: string) => string;
}
interface Config {
  timeout?: number;
  override?: boolean;
  replace?: (code: string) => string;
  onComplete?: (skipItems: Record<string, string>, errorItems: Record<string, string>, successItems: number) => void;
  entries: Array<(envName: string) => Task[]>;
}

interface EluxConfig {
  gen: Config;
}

interface MetaData {
  rootPath: string;
  config: Config;
  skipItems: Record<string, string>;
  errorItems: Record<string, string>;
  successItems: number;
}

const EluxConfigSchema: any = {
  type: 'object',
  additionalProperties: true,
  properties: {
    gen: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timeout: {
          type: 'number',
          description: 'Default is 10000',
        },
        override: {
          type: 'boolean',
          description: 'Defalut is false',
        },
        replace: {
          instanceof: 'Function',
          description: '(html:string)=>string',
        },
        onComplete: {
          instanceof: 'Function',
          description: '(skipItems:Record<string,string>,errorItems:Record<string,string>,successItems:number) => void',
        },
        entries: {
          type: 'array',
          description: 'Array<(envName: string)=>{url:string;dist:string;timeout?:number;override?:boolean;replace?:(code:string)=>string}[]>',
          minItems: 1,
          items: {
            instanceof: 'Function',
          },
        },
      },
    },
  },
};

async function execTask(task: Task, ctx: {title: string}, metaData: MetaData): Promise<void> {
  const {url} = task;
  const dist = path.resolve(metaData.rootPath, task.dist);
  const {config, skipItems} = metaData;
  const timeout = task.timeout || config.timeout || 10000;
  const override = task.override ?? config.override ?? false;
  const replace = task.replace || config.replace;
  if (!override && fse.existsSync(dist)) {
    skipItems[url + '|' + dist] = 'exists';
    ctx.title = '[s]' + ctx.title;
    return Promise.resolve();
  }
  let {body = ''} = await got(url, {timeout, retry: 1});
  if (replace) {
    body = replace(body);
  }
  fse.ensureDirSync(path.dirname(dist));
  return fse.writeFile(dist, body);
}

async function execEntryTasks(entryTasks: Task[], metaData: MetaData) {
  const n = entryTasks.length;
  while (entryTasks.length) {
    console.log(`本任务共${chalk.cyan(n)}条生成，还剩${chalk.cyan(entryTasks.length)}条...`);
    const tasks = entryTasks.splice(0, 10);
    const listr = new Listr<any>(
      tasks.map((item) => {
        return {
          title: item.url,
          retry: 0,
          task: (_, task) =>
            execTask(item, task, metaData).then(
              () => {
                metaData.successItems++;
              },
              (e: Error) => {
                metaData.errorItems[item.url + '|' + item.dist] = e.message;
                throw new Error(item.url + ' | ' + e.message.replace(item.url, ''));
              }
            ),
        };
      }),
      {concurrent: true, exitOnError: false}
    );
    await listr.run();
  }
}

async function execEntries(metaData: MetaData, envName: string) {
  const config = metaData.config;
  const entries = config.entries;
  const n = entries.length;
  while (entries.length) {
    console.log(`共${chalk.cyan(n)}个任务，正在执行第${chalk.cyan(n - entries.length + 1)}个`);
    const entry = entries.shift();
    await execEntryTasks(entry!(envName), metaData);
  }
}

export async function run({env}: {env: string}): Promise<void> {
  const {config: eluxConfig} = getEluxConfig(env) as {config: EluxConfig; envPath: string};
  schemaValidate(EluxConfigSchema, eluxConfig, {name: '@elux/cli/gen'});
  const config = eluxConfig.gen;
  const skipItems: Record<string, string> = {};
  const errorItems: Record<string, string> = {};
  const metaData: MetaData = {
    rootPath: process.cwd(),
    config,
    skipItems,
    errorItems,
    successItems: 0,
  };
  await execEntries(metaData, env);
  console.log(
    '执行完成！' +
      chalk.green(`成功${metaData.successItems}条(`) +
      chalk.yellow(`跳过${Object.keys(metaData.skipItems).length}条`) +
      chalk.green(')') +
      '，' +
      chalk.redBright(`失败${Object.keys(metaData.errorItems).length}条`) +
      '\n'
  );
  if (config.onComplete) {
    config.onComplete(skipItems, errorItems, metaData.successItems);
  }
}
