"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const got_1 = __importDefault(require("got"));
const listr2_1 = require("listr2");
const EluxConfigSchema = {
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
async function execTask(task, ctx, metaData) {
    const { url } = task;
    const dist = path_1.default.resolve(metaData.rootPath, task.dist);
    const { config, skipItems } = metaData;
    const timeout = task.timeout || config.timeout || 10000;
    const override = task.override ?? config.override ?? false;
    const replace = task.replace || config.replace;
    if (!override && cli_utils_1.fse.existsSync(dist)) {
        skipItems[url + '|' + dist] = 'exists';
        ctx.title = '[s]' + ctx.title;
        return Promise.resolve();
    }
    let { body = '' } = await got_1.default(url, { timeout, retry: 1 });
    if (replace) {
        body = replace(body);
    }
    cli_utils_1.fse.ensureDirSync(path_1.default.dirname(dist));
    return cli_utils_1.fse.writeFile(dist, body);
}
async function execEntryTasks(entryTasks, metaData) {
    const n = entryTasks.length;
    while (entryTasks.length) {
        console.log(`本任务共${cli_utils_1.chalk.cyan(n)}条生成，还剩${cli_utils_1.chalk.cyan(entryTasks.length)}条...`);
        const tasks = entryTasks.splice(0, 10);
        const listr = new listr2_1.Listr(tasks.map((item) => {
            return {
                title: item.url,
                retry: 0,
                task: (_, task) => execTask(item, task, metaData).then(() => {
                    metaData.successItems++;
                }, (e) => {
                    metaData.errorItems[item.url + '|' + item.dist] = e.message;
                    throw new Error(item.url + ' | ' + e.message.replace(item.url, ''));
                }),
            };
        }), { concurrent: true, exitOnError: false });
        await listr.run();
    }
}
async function execEntries(metaData, envName) {
    const config = metaData.config;
    const entries = config.entries;
    const n = entries.length;
    while (entries.length) {
        console.log(`共${cli_utils_1.chalk.cyan(n)}个任务，正在执行第${cli_utils_1.chalk.cyan(n - entries.length + 1)}个`);
        const entry = entries.shift();
        await execEntryTasks(entry(envName), metaData);
    }
}
async function run({ env }) {
    const { config: eluxConfig } = cli_utils_1.getEluxConfig(env);
    cli_utils_1.schemaValidate(EluxConfigSchema, eluxConfig, { name: '@elux/cli/gen' });
    const config = eluxConfig.gen;
    const skipItems = {};
    const errorItems = {};
    const metaData = {
        rootPath: process.cwd(),
        config,
        skipItems,
        errorItems,
        successItems: 0,
    };
    await execEntries(metaData, env);
    console.log('执行完成！' +
        cli_utils_1.chalk.green(`成功${metaData.successItems}条(`) +
        cli_utils_1.chalk.yellow(`跳过${Object.keys(metaData.skipItems).length}条`) +
        cli_utils_1.chalk.green(')') +
        '，' +
        cli_utils_1.chalk.redBright(`失败${Object.keys(metaData.errorItems).length}条`) +
        '\n');
    if (config.onComplete) {
        config.onComplete(skipItems, errorItems, metaData.successItems);
    }
}
exports.run = run;
