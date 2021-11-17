"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const memFs = __importStar(require("mem-fs"));
const editor = __importStar(require("mem-fs-editor"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const util_1 = require("mem-fs-editor/lib/util");
const cli_utils_1 = require("@elux/cli-utils");
const base_1 = require("./base");
let logInstallInfo = () => undefined;
let logSuccessInfo = () => undefined;
async function build({ projectName, projectDir, templateDir, template, featChoices, }) {
    cli_utils_1.log(cli_utils_1.chalk.red('\n🚀 Generating files...\n'));
    const cdPath = path_1.default.relative(process.cwd(), projectDir);
    const excludeFiles = {
        [path_1.default.resolve(projectDir, base_1.TEMPLATE_CREATOR)]: true,
    };
    const filter = util_1.createTransform(function (file, enc, cb) {
        if (excludeFiles[file.path]) {
            cb();
        }
        else {
            this.push(file);
            cb();
        }
    });
    logInstallInfo = function () {
        cli_utils_1.log('');
        cli_utils_1.log('- 进入项目 ' + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        cli_utils_1.log('- 以下目录需要安装依赖 ' + cli_utils_1.chalk.cyan('yarn install') + cli_utils_1.chalk.yellow(' (推荐使用yarn，支持workspaces一次性安装所有依赖)'));
        template.install.forEach((dir) => {
            cli_utils_1.log(cli_utils_1.chalk.green(`  ${dir}`));
        });
        cli_utils_1.log('- 运行程序 ' + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或留意查看readme.txt)'));
        cli_utils_1.log('');
    };
    logSuccessInfo = function () {
        cli_utils_1.log('');
        cli_utils_1.log(cli_utils_1.chalk.black.bold('✨ 准备好啦！开始工作吧！\n'));
        cli_utils_1.log(cli_utils_1.chalk.green('- 进入目录 ') + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        cli_utils_1.log(cli_utils_1.chalk.green('- 运行程序 ') + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或留意查看readme.txt)'));
        cli_utils_1.log('');
    };
    const store = memFs.create();
    const mfs = editor.create(store);
    template.include.forEach((dir) => {
        const src = path_1.default.join(template.path, dir);
        cli_utils_1.fs.copySync(src, template.path);
    });
    mfs.copyTpl(template.path, projectDir, template.data({ ...featChoices, projectName }), { escape: (str) => str }, {
        globOptions: {
            dot: true,
        },
        processDestinationPath: (filepath) => {
            filepath = filepath.replace(/.ejs$/, '');
            let rpath = './' + cli_utils_1.slash(path_1.default.relative(projectDir, filepath));
            if (template.rename['*']) {
                const changedPath = template.rename['*'](featChoices, rpath);
                if (changedPath) {
                    filepath = path_1.default.resolve(projectDir, changedPath);
                }
                else {
                    excludeFiles[filepath] = true;
                    return filepath;
                }
            }
            rpath = './' + cli_utils_1.slash(path_1.default.relative(projectDir, filepath));
            const handler = template.rename[rpath];
            if (handler) {
                const changedPath = handler(featChoices, rpath);
                if (changedPath) {
                    filepath = path_1.default.resolve(projectDir, changedPath);
                }
                else {
                    excludeFiles[filepath] = true;
                    return filepath;
                }
            }
            cli_utils_1.log(`${cli_utils_1.chalk.green('✔ ')}${cli_utils_1.chalk.gray('Created:')} ${path_1.default.relative(projectDir, filepath)}`);
            return filepath;
        },
    });
    mfs.commit([filter], (error) => {
        if (!error) {
            cli_utils_1.clearConsole(cli_utils_1.chalk.magenta('🎉 项目创建成功!!! 接下来...\n'));
            logInstallInfo();
            cli_utils_1.log('');
            const { yarnVersion, npmVersion, cnpmVersion } = cli_utils_1.platform;
            const choices = [];
            if (yarnVersion) {
                choices.push({
                    name: 'yarn install(推荐)',
                    value: 'yarn',
                });
            }
            if (npmVersion) {
                choices.push({
                    name: 'npm install' + (cli_utils_1.semver.lt(npmVersion, '6.9.0') ? cli_utils_1.chalk.red('(Current version < 6.9.0,May cause exceptions!)') : ''),
                    value: 'npm',
                });
            }
            if (cnpmVersion) {
                choices.push({
                    name: 'cnpm install',
                    value: 'cnpm',
                });
            }
            choices.push({
                name: '稍后安装...',
                value: '',
            });
            return inquirer_1.default
                .prompt({
                type: 'list',
                name: 'installCmd',
                message: cli_utils_1.chalk.green('是否自动安装依赖'),
                choices,
            })
                .then(({ installCmd }) => {
                if (installCmd) {
                    const subDirs = installCmd === 'yarn' ? [template.install[0]] : template.install;
                    const installExec = installCmd === 'npm' && cli_utils_1.semver.gte(npmVersion, '7.0.0') ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
                    cli_utils_1.log('');
                    setTimeout(() => install(installExec, projectDir, subDirs), 0);
                }
            });
        }
        else {
            throw error;
        }
    });
}
function install(installExec, projectDir, subDirs) {
    const dir = subDirs.shift();
    cli_utils_1.log(`  正在为 ${cli_utils_1.chalk.green(dir)} 安装依赖，请稍后...`);
    const spinner = cli_utils_1.ora('...').start();
    process.chdir(path_1.default.resolve(projectDir, dir));
    const subProcess = cli_utils_1.execa(installExec[0], installExec[1]);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    subProcess.then(() => {
        spinner.stop();
        if (subDirs.length > 0) {
            setTimeout(() => install(installExec, projectDir, subDirs), 0);
        }
        else {
            cli_utils_1.log(cli_utils_1.chalk.green('\n✔ 项目依赖安装成功！'));
            logSuccessInfo();
        }
    }, () => {
        spinner.stop();
        cli_utils_1.log(cli_utils_1.chalk.red('\n✖ 项目依赖安装失败，请稍后自行安装！\n\n'));
        logInstallInfo();
    });
}
module.exports = build;
