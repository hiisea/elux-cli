"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@elux/cli-utils");
const download_1 = __importDefault(require("download"));
function default_1(url, targetDir, removeTarget) {
    if (removeTarget && cli_utils_1.fse.existsSync(targetDir)) {
        cli_utils_1.fse.removeSync(targetDir);
    }
    const proxyUrl = global['GLOBAL_AGENT'].HTTP_PROXY;
    console.log(cli_utils_1.chalk.yellow('using proxy -> ' + (proxyUrl || 'none')));
    console.log(cli_utils_1.chalk.cyan.underline('Pulling from ' + url));
    const spinner = (0, cli_utils_1.ora)('Loading...').start();
    return (0, download_1.default)(url, targetDir, {
        extract: true,
        strip: 1,
        headers: {
            'user-agent': 'Chrome/99.0',
        },
    }).then(() => {
        spinner.succeed(`${cli_utils_1.chalk.green('Pull successful!!!')}\n`);
    }, (e) => {
        spinner.fail(cli_utils_1.chalk.redBright('Pull failed!!!'));
        throw e;
    });
}
exports.default = default_1;
