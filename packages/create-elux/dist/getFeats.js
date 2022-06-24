"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@elux/cli-utils");
const inquirer_1 = __importDefault(require("inquirer"));
const buildProject_1 = __importDefault(require("./buildProject"));
function askEnsure() {
    return inquirer_1.default.prompt({
        type: 'list',
        name: 'ensure',
        message: '请确认...',
        choices: [
            {
                name: '✔ 确认安装',
                value: true,
            },
            {
                name: '✖ 返回重选',
                value: false,
            },
        ],
    });
}
function askOption(message, list) {
    const choices = list.map((item) => {
        const [value, ...others] = item.split('|');
        return { value, name: others.join('|') || value };
    });
    return inquirer_1.default.prompt({
        type: 'list',
        name: 'option',
        message,
        choices,
    });
}
async function main(args) {
    (0, cli_utils_1.clearConsole)(args.title.join('\n') + '\n');
    const tplOptions = { projectName: args.projectName };
    let result = args.template.getOptions(tplOptions);
    while (result) {
        const { subject, choices, onSelect } = result;
        const { option } = await askOption(subject, choices);
        result = onSelect(option, tplOptions);
    }
    const { ensure } = await askEnsure();
    if (ensure) {
        const { projectName, projectDir, repository, templateDir, template } = args;
        (0, buildProject_1.default)({
            projectName,
            projectDir,
            repository,
            templateDir,
            template,
            tplOptions,
        });
    }
    else {
        setTimeout(() => main(args), 0);
    }
}
exports.default = main;
