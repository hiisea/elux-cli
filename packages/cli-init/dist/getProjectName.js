"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const getTemplates_1 = __importDefault(require("./getTemplates"));
function parseProjectName(input) {
    const cwd = process.cwd();
    const projectDir = path_1.default.resolve(cwd, input);
    const projectName = projectDir.split(path_1.default.sep).pop() || '';
    return { projectName, projectDir };
}
function askProjectName() {
    console.log('');
    return inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectNameInput',
            message: '请输入项目名称或目录',
            validate(input) {
                if (!input) {
                    return '项目名称不能为空';
                }
                const { projectName } = parseProjectName(input);
                const result = (0, cli_utils_1.packageNameValidate)(projectName);
                if (!result.validForNewPackages) {
                    const errors = [cli_utils_1.chalk.redBright(`无效的项目名称: ${projectName}`)];
                    [...(result.errors || []), ...(result.warnings || [])].forEach((error) => {
                        errors.push(cli_utils_1.chalk.yellow(`   ${error}`));
                    });
                    return errors.join('\n');
                }
                return true;
            },
        },
        {
            type: 'confirm',
            name: 'override',
            message: '目录已经存在, 要合并覆盖它吗?',
            default: false,
            when: ({ projectNameInput }) => {
                const { projectDir } = parseProjectName(projectNameInput);
                return cli_utils_1.fse.existsSync(projectDir);
            },
        },
    ]);
}
async function main(args) {
    const { title, templateResources, cliVersion } = args;
    const { projectNameInput, override } = await askProjectName();
    if (override === false) {
        setTimeout(() => main(args), 0);
        return;
    }
    else {
        const { projectName, projectDir } = parseProjectName(projectNameInput);
        const projectPathTips = `新建项目: ${cli_utils_1.chalk.green(projectDir)}`;
        console.log(projectPathTips);
        title.push(projectPathTips);
        (0, getTemplates_1.default)({ title, projectName, projectDir, templateResources, cliVersion });
    }
}
exports.default = main;
