"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRepository = void 0;
const cli_utils_1 = require("@elux/cli-utils");
function loadRepository(url, targetDir, removeTarget) {
    if (removeTarget && cli_utils_1.fs.existsSync(targetDir)) {
        cli_utils_1.fs.removeSync(targetDir);
    }
    const proxyUrl = global['GLOBAL_AGENT'].HTTP_PROXY;
    cli_utils_1.log(cli_utils_1.chalk.yellow('using proxy -> ' + (proxyUrl || 'none')));
    cli_utils_1.log(cli_utils_1.chalk.blue.underline('Pulling from ' + url));
    const spinner = cli_utils_1.ora('Loading...').start();
    return cli_utils_1.download(url, targetDir, {
        extract: true,
        headers: {
            'user-agent': 'Chrome/99.0',
        },
    }).then(() => {
        spinner.succeed(`${cli_utils_1.chalk.green('Pull successful!!!')}\n`);
    }, (e) => {
        spinner.fail(cli_utils_1.chalk.red('Pull failed!!!'));
        cli_utils_1.log(cli_utils_1.chalk.yellow(e.toString()));
        throw e;
    });
}
exports.loadRepository = loadRepository;
