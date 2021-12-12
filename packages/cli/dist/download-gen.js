"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
function download() {
    return new Promise((resove, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.5) {
                resove({ body: '222' });
            }
            else {
                reject('111');
            }
        }, 10000);
    });
}
async function execTask(task, ctx, metaData) {
    const { url, dist } = task;
    const { config, skipItems } = metaData;
    const timeout = task.timeout || config.timeout || 10000;
    const override = task.override ?? config.override ?? false;
    const replace = task.replace || config.replace;
    if (!override && cli_utils_1.fs.existsSync(dist)) {
        skipItems[url + '|' + dist] = 'exists';
        ctx.title = '[s]' + ctx.title;
        return Promise.resolve();
    }
    let { body = '' } = await cli_utils_1.got(url, { timeout, retry: 0 });
    if (replace) {
        body = replace(body);
    }
    cli_utils_1.fs.ensureDirSync(path_1.default.dirname(dist));
    return cli_utils_1.fs.writeFile(dist, body);
}
async function execEntryTasks(entryTasks, metaData) {
    const n = entryTasks.length;
    while (entryTasks.length) {
        cli_utils_1.log(`本任务共${cli_utils_1.chalk.blue(n)}条生成，还剩${cli_utils_1.chalk.blue(entryTasks.length)}条...`);
        const tasks = entryTasks.splice(0, 10);
        const listr = new cli_utils_1.Listr(tasks.map((item) => {
            return {
                title: item.url,
                retry: 1,
                task: (_, task) => execTask(item, task, metaData).then(() => {
                    metaData.successItems++;
                }, (e) => {
                    metaData.errorItems[item.url + '|' + item.dist] = e.message;
                    throw e;
                }),
            };
        }), { concurrent: true, exitOnError: false });
        await listr.run();
    }
}
async function execEntries(metaData) {
    const config = metaData.config;
    const entries = config.entries;
    const n = entries.length;
    while (entries.length) {
        cli_utils_1.log(`共${cli_utils_1.chalk.red(n)}个任务，正在执行第${cli_utils_1.chalk.red(n - entries.length + 1)}个`);
        const entry = entries.shift();
        await execEntryTasks(entry(), metaData);
    }
}
module.exports = async function moduleExports(root, configPath) {
    const config = require(path_1.default.resolve(root, configPath));
    const skipItems = {};
    const errorItems = {};
    const metaData = {
        config,
        skipItems,
        errorItems,
        successItems: 0,
    };
    await execEntries(metaData);
    cli_utils_1.log('执行完成！' +
        cli_utils_1.chalk.green(`成功${metaData.successItems}条(`) +
        cli_utils_1.chalk.yellow(`跳过${Object.keys(metaData.skipItems).length}条`) +
        cli_utils_1.chalk.green(')') +
        '，' +
        cli_utils_1.chalk.red(`失败${Object.keys(metaData.errorItems).length}条`) +
        '\n');
    if (config.onComplete) {
        config.onComplete(skipItems, errorItems, metaData.successItems);
    }
};
