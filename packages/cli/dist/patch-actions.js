"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const typescript_json_schema_1 = require("typescript-json-schema");
module.exports = async function moduleExports(_entryFilePath, echo) {
    const { stdout } = await cli_utils_1.execa('tsc', ['--project', './src', '--showConfig']);
    const rootPath = process.cwd();
    const srcPath = path_1.default.join(rootPath, 'src');
    let tsconfigDir;
    if (fs_1.default.existsSync(path_1.default.join(srcPath, './tsconfig.json'))) {
        tsconfigDir = srcPath;
        process.chdir(tsconfigDir);
    }
    else {
        tsconfigDir = rootPath;
    }
    const tsconfig = JSON.parse(stdout);
    const { baseUrl = '' } = tsconfig.compilerOptions || {};
    const compilerOptions = {
        ...tsconfig.compilerOptions,
        baseUrl: path_1.default.resolve(tsconfigDir, baseUrl),
        emitDeclarationOnly: false,
        noEmit: true,
        composite: false,
        sourceMap: false,
    };
    const entryFilePath = _entryFilePath || (fs_1.default.existsSync(path_1.default.join(srcPath, 'Global.ts')) ? path_1.default.join(srcPath, 'Global.ts') : path_1.default.join(srcPath, 'Global.tsx'));
    const source = fs_1.default.readFileSync(entryFilePath).toString();
    const arr = source.match(/(getApi<[\w, ]+>\s*\()([^)]*?)(\))/m);
    const typeName = 'PatchActions';
    if (arr) {
        const demoteForProdOnly = arr[2].substring(0, arr[2].indexOf(',')).trim() || 'true';
        const actionStr = arr[2].substring(arr[2].indexOf(',') + 1).trim();
        let actions2 = {};
        if (actionStr) {
            actions2 = {};
            eval('actions2 = ' + actionStr);
        }
        const files = [entryFilePath];
        console.log(`Patch actions for ${entryFilePath}`);
        const program = typescript_json_schema_1.getProgramFromFiles(files, compilerOptions);
        const defineType = typescript_json_schema_1.generateSchema(program, typeName, { ignoreErrors: false });
        const properties = defineType.properties;
        const actions = Object.keys(properties).reduce((obj, key) => {
            obj[key] = properties[key].enum;
            return obj;
        }, {});
        const json = JSON.stringify(actions);
        const json2 = JSON.stringify(actions2);
        if (json === json2) {
            console.log(cli_utils_1.chalk.green('\nThere was no changes!\n'));
        }
        else {
            if (echo) {
                console.log(`\n${cli_utils_1.chalk.green(JSON.stringify(actions, null, 4))}\n`);
            }
            else {
                const newSource = source.replace(arr[0], `${arr[1]}${demoteForProdOnly}, ${json}${arr[3]}`);
                fs_1.default.writeFileSync(entryFilePath, newSource);
                console.log('');
                console.log(cli_utils_1.chalk.green(`✔ ${entryFilePath} has been patched!\n`));
            }
        }
    }
};
