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
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const memFs = __importStar(require("mem-fs"));
const editor = __importStar(require("mem-fs-editor"));
const util_1 = require("mem-fs-editor/lib/util");
const loadRepository_1 = require("./loadRepository");
let logInstallInfo = () => undefined;
let logSuccessInfo = () => undefined;
function build({ projectName, projectDir, repository, templateDir, template, featChoices, }) {
    console.log('');
    console.log(cli_utils_1.chalk.yellow('🚀 Generating files...\n'));
    const excludeFiles = {};
    const filter = util_1.createTransform(function (file, enc, cb) {
        if (excludeFiles[file.path]) {
            cb();
        }
        else {
            this.push(file);
            cb();
        }
    });
    const tplArgs = { ...featChoices, projectName };
    const templateData = template.data ? template.data(tplArgs) : tplArgs;
    const tempDir = path_1.default.join(templateDir, './$');
    const operations = template.operation ? template.operation(tplArgs) : [];
    operations.forEach((item) => {
        if (item.from.includes('..') || item.to.includes('..')) {
            return;
        }
        const from = path_1.default.join(templateDir, item.from);
        const to = path_1.default.join(templateDir, item.to);
        if (item.action === 'copy') {
            cli_utils_1.fse.copySync(from, to);
        }
        else if (item.action === 'move') {
            if (item.to) {
                cli_utils_1.fse.moveSync(from, to, { overwrite: true });
            }
            else {
                cli_utils_1.fse.removeSync(from);
            }
        }
    });
    const store = memFs.create();
    const mfs = editor.create(store);
    const processTpl = mfs['_processTpl'];
    mfs['_processTpl'] = function (args) {
        const { filename, contents } = args;
        if (util_1.isBinary(filename, contents)) {
            return contents;
        }
        let code = contents.toString();
        const rpath = './' + cli_utils_1.slash(path_1.default.relative(tempDir, filename.replace(/.ejs$/, '')));
        if (template.beforeRender) {
            code = template.beforeRender(templateData, rpath, code);
        }
        try {
            code = processTpl.call(this, { ...args, contents: code });
        }
        catch (error) {
            cli_utils_1.chalk.redBright(rpath);
            throw error;
        }
        if (template.afterRender) {
            code = template.afterRender(templateData, rpath, code);
        }
        return code;
    };
    mfs.copyTpl(tempDir, projectDir, templateData, { escape: (str) => str }, {
        globOptions: {
            dot: true,
        },
        processDestinationPath: (filepath) => {
            filepath = filepath.replace(/.ejs$/, '');
            const rpath = './' + cli_utils_1.slash(path_1.default.relative(projectDir, filepath));
            if (template.rename) {
                const changedPath = template.rename(templateData, rpath);
                if (changedPath) {
                    filepath = path_1.default.resolve(projectDir, changedPath);
                }
                else {
                    excludeFiles[filepath] = true;
                    return filepath;
                }
            }
            console.log(`${cli_utils_1.chalk.green('✔ ')}${cli_utils_1.chalk.gray('Created:')} ${path_1.default.relative(projectDir, filepath)}`);
            return filepath;
        },
    });
    cli_utils_1.fse.removeSync(tempDir);
    mfs.commit([filter], (error) => {
        if (!error) {
            const lockFileName = template.getNpmLockFile(tplArgs);
            useLockFile(lockFileName, projectDir, repository, templateDir, featChoices.framework);
        }
        else {
            throw error;
        }
    });
}
async function buildLockFile(lockFileName, projectDir, repository, templateDir, framework) {
    if (repository.startsWith('http://') || repository.startsWith('https://')) {
        await loadRepository_1.loadRepository(`${repository}/${lockFileName}.zip`, projectDir, false);
    }
    else {
        const dir = path_1.default.join(repository, lockFileName);
        console.log(cli_utils_1.chalk.cyan.underline('Pulling from ' + dir));
        try {
            cli_utils_1.fse.copySync(dir, projectDir);
            console.log(`${cli_utils_1.chalk.green('Pull successful!!!')}\n`);
        }
        catch (e) {
            console.log(cli_utils_1.chalk.redBright('Pull failed!!!'));
            console.log(cli_utils_1.chalk.yellow(e.toString()));
            throw e;
        }
    }
}
function useLockFile(lockFileName, projectDir, repository, templateDir, framework) {
    if (!lockFileName) {
        onGenComplete(projectDir, framework);
        return;
    }
    console.log('\n正在拉取（' + cli_utils_1.chalk.green('yarn.lock,package-lock.json') + '）用于锁定各依赖安装版本,确保安装顺利');
    buildLockFile(lockFileName, projectDir, repository, templateDir, framework).then(() => onGenComplete(projectDir, framework), () => {
        console.log('');
        inquirer_1.default
            .prompt({
            type: 'confirm',
            name: 'skip',
            message: 'npm-lock文件拉取失败，该文件非必需，是否跳过该文件?',
            default: true,
        })
            .then(({ skip }) => {
            if (skip) {
                onGenComplete(projectDir, framework);
            }
            else {
                setTimeout(() => useLockFile(lockFileName, projectDir, repository, templateDir, framework), 0);
            }
        });
    });
}
function onGenComplete(projectDir, framework) {
    const cdPath = path_1.default.relative(process.cwd(), projectDir);
    process.chdir(path_1.default.resolve(projectDir));
    logInstallInfo = function () {
        console.log('');
        console.log('- 进入项目 ' + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        console.log('- 安装依赖 ' + cli_utils_1.chalk.cyan('yarn install') + cli_utils_1.chalk.yellow(' (或"npm install --legacy-peer-deps",npm版本需>=7.0)'));
        console.log('- 运行程序 ' + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或查看readme)'));
        console.log('');
    };
    logSuccessInfo = function () {
        console.log('');
        console.log(cli_utils_1.chalk.bold('✨ 准备好啦！开始工作吧！\n'));
        console.log('- 进入目录 ' + cli_utils_1.chalk.cyan(`cd ${cdPath}`));
        console.log('- 运行程序 ' + cli_utils_1.chalk.cyan('yarn start') + cli_utils_1.chalk.yellow(' (或查看readme)'));
        console.log('');
    };
    console.log('');
    console.log(cli_utils_1.chalk.cyan('🦋 正在执行ESLint...'));
    const eslintPath = require.resolve('eslint');
    const nodePath = path_1.default.join(eslintPath.substring(0, eslintPath.lastIndexOf('node_modules')), 'node_modules');
    const eslintCmd = path_1.default.join(nodePath, '.bin/eslint');
    const configPath = path_1.default.join(__dirname, `../format.js`);
    const subProcess = cli_utils_1.execa(eslintCmd, ['--config', configPath, '--no-eslintrc', '--fix', '--ext', '.js,.ts,.jsx,.tsx,.vue', './']);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    subProcess.then(() => {
        console.log('');
        cli_utils_1.clearConsole(cli_utils_1.chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(cli_utils_1.chalk.yellow('   ✔ ESLint执行成功!'));
        beforeInstall(projectDir);
    }, () => {
        console.log('');
        cli_utils_1.clearConsole(cli_utils_1.chalk.green('🎉 项目创建成功!!! 接下来...'));
        console.log(cli_utils_1.chalk.redBright('   ✖ ESLint执行失败，请稍后自行运行!'));
        beforeInstall(projectDir);
    });
}
function beforeInstall(projectDir) {
    logInstallInfo();
    console.log('');
    const yarnVersion = cli_utils_1.getCmdVersion('yarn');
    const npmVersion = cli_utils_1.getCmdVersion('npm');
    const choices = [];
    if (yarnVersion) {
        choices.push({
            name: 'yarn install',
            value: 'yarn',
        });
    }
    if (npmVersion) {
        choices.push({
            name: 'npm install' + (cli_utils_1.semver.lt(npmVersion, '7.0.0') ? cli_utils_1.chalk.redBright('(当前版本<7.0.0,不可用!)') : ''),
            value: cli_utils_1.semver.lt(npmVersion, '7.0.0') ? '' : 'npm',
        });
    }
    choices.push({
        name: '稍后安装...',
        value: '',
    });
    inquirer_1.default
        .prompt({
        type: 'list',
        name: 'installCmd',
        message: cli_utils_1.chalk.green('是否自动安装依赖'),
        choices,
    })
        .then(({ installCmd }) => {
        if (installCmd) {
            const installExec = installCmd === 'npm' ? [installCmd, ['install', '--legacy-peer-deps']] : [installCmd, ['install']];
            console.log('');
            setTimeout(() => installNpm(installExec, projectDir), 0);
        }
    });
}
function installNpm(installExec, projectDir) {
    console.log(`  正在安装依赖，请稍后...`);
    const spinner = cli_utils_1.ora('...').start();
    const subProcess = cli_utils_1.execa(installExec[0], installExec[1]);
    subProcess.stdin.pipe(process.stdin);
    subProcess.stdout.pipe(process.stdout);
    subProcess.stderr.pipe(process.stderr);
    subProcess.then(() => {
        spinner.stop();
        console.log('');
        console.log(cli_utils_1.chalk.green('✔ 项目依赖安装成功！'));
        logSuccessInfo();
    }, () => {
        spinner.stop();
        console.log('');
        console.log(cli_utils_1.chalk.redBright('✖ 项目依赖安装失败，请稍后自行安装！'));
        logInstallInfo();
    });
}
module.exports = build;
