"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
function download() {
    return new Promise((resove) => {
        setTimeout(() => resove(undefined), 10000);
    });
}
async function execTask({ url, dist }) {
    await download();
}
async function execEntryTasks(entryTasks) {
    const n = entryTasks.length;
    while (entryTasks.length) {
        cli_utils_1.log(`本次任务共 ${cli_utils_1.chalk.blue(n)} 条生成，还剩 ${cli_utils_1.chalk.blue(entryTasks.length)} 条...`);
        const tasks = entryTasks.splice(0, 10);
        const listr = new cli_utils_1.Listr(tasks.map((item) => {
            return {
                title: item.url,
                task: () => execTask(item),
            };
        }));
        await listr.run();
    }
}
async function execEntries(entries) {
    const n = entries.length;
    while (entries.length) {
        cli_utils_1.log(`共发现 ${cli_utils_1.chalk.red(n)} 个任务，正在执行第 ${cli_utils_1.chalk.red(n - entries.length + 1)} 个任务`);
        const entry = entries.shift();
        await execEntryTasks(entry());
    }
}
module.exports = async function moduleExports(configPath) {
    const config = require(path_1.default.resolve(process.cwd(), configPath));
    execEntries(config.entries);
};
