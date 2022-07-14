"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const memFs = __importStar(require("mem-fs"));
const editor = __importStar(require("mem-fs-editor"));
const util_1 = require("mem-fs-editor/lib/util");
const installProject_1 = __importDefault(require("./installProject"));
const download_1 = __importDefault(require("./libs/download"));
function main({ projectName, projectDir, repository, templateDir, template, tplOptions, }) {
    console.log('');
    console.log(cli_utils_1.chalk.yellow('🚀 Generating files...\n'));
    const excludeFiles = {};
    const filter = (0, util_1.createTransform)(function (file, enc, cb) {
        if (excludeFiles[file.path]) {
            cb();
        }
        else {
            this.push(file);
            cb();
        }
    });
    const tempDir = path_1.default.join(templateDir, './$');
    const operations = template.getOperation ? template.getOperation(tplOptions) : [];
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
        if ((0, util_1.isBinary)(filename, contents)) {
            return contents;
        }
        let code = contents.toString();
        const rpath = './' + (0, cli_utils_1.slash)(path_1.default.relative(tempDir, filename.replace(/.ejs$/, '')));
        if (template.beforeRender) {
            code = template.beforeRender(tplOptions, rpath, code);
        }
        try {
            code = processTpl.call(this, { ...args, contents: code });
        }
        catch (error) {
            cli_utils_1.chalk.redBright(rpath);
            throw error;
        }
        if (template.afterRender) {
            code = template.afterRender(tplOptions, rpath, code);
        }
        return code;
    };
    mfs.copyTpl(tempDir, projectDir, tplOptions, { escape: (str) => str }, {
        globOptions: {
            dot: true,
        },
        processDestinationPath: (filepath) => {
            filepath = filepath.replace(/.ejs$/, '');
            const rpath = './' + (0, cli_utils_1.slash)(path_1.default.relative(projectDir, filepath));
            if (template.rename) {
                const changedPath = template.rename(tplOptions, rpath);
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
            const shouldEslint = template.shouldEslint ? template.shouldEslint(tplOptions) : false;
            if (!template.getNpmLockFile) {
                (0, installProject_1.default)(projectDir, shouldEslint);
                return;
            }
            const lockFileName = template.getNpmLockFile(tplOptions);
            buildLockFile({ lockFileName, projectDir, repository, shouldEslint });
        }
        else {
            throw error;
        }
    });
}
exports.default = main;
async function buildLockFile(args) {
    const { lockFileName, projectDir, repository, shouldEslint } = args;
    if (!lockFileName) {
        (0, installProject_1.default)(projectDir, shouldEslint);
        return;
    }
    console.log('\n正在拉取[' + cli_utils_1.chalk.green('yarn.lock,package-lock.json') + ']用于锁定各依赖安装版本,确保安装顺利...');
    let success = false;
    if (repository.startsWith('http://') || repository.startsWith('https://')) {
        try {
            await (0, download_1.default)(`${repository}/${lockFileName}.zip`, projectDir, false);
            success = true;
        }
        catch (error) {
            console.log(cli_utils_1.chalk.yellow(error.toString()));
        }
    }
    else {
        const dir = path_1.default.join(repository, lockFileName);
        console.log(cli_utils_1.chalk.cyan.underline('Pulling from ' + dir));
        try {
            cli_utils_1.fse.copySync(dir, projectDir);
            console.log(`${cli_utils_1.chalk.green('✔ Pull successful!!!')}\n`);
            success = true;
        }
        catch (error) {
            console.log(cli_utils_1.chalk.redBright('✖ Pull failed!!!'));
            console.log(cli_utils_1.chalk.yellow(error.toString()));
        }
    }
    if (success) {
        (0, installProject_1.default)(projectDir, shouldEslint);
        return;
    }
    console.log('');
    inquirer_1.default
        .prompt({
        type: 'confirm',
        name: 'skip',
        message: 'Lock文件拉取失败，该文件非必需，是否跳过该文件?',
        default: true,
    })
        .then(({ skip }) => {
        if (skip) {
            (0, installProject_1.default)(projectDir, shouldEslint);
            return;
        }
        else {
            setTimeout(() => buildLockFile(args), 0);
        }
    });
}
