"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("@elux/cli-utils");
const EluxConfigSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        mockServer: {
            type: 'object',
            additionalProperties: false,
            properties: {
                port: {
                    type: 'number',
                    description: 'Default is 3003',
                },
                dir: {
                    type: 'string',
                    description: 'Defalut is ./mock',
                },
            },
        },
    },
};
function run({ env, port, dir, watch }) {
    const { config: baseEluxConfig } = cli_utils_1.getEluxConfig(env);
    cli_utils_1.schemaValidate(EluxConfigSchema, baseEluxConfig, { name: '@elux/cli-mock' });
    const defaultBaseConfig = {
        mockServer: {
            dir: './mock',
            port: 3003,
        },
    };
    const eluxConfig = cli_utils_1.deepExtend(defaultBaseConfig, baseEluxConfig);
    port = port || eluxConfig.mockServer.port;
    dir = path_1.default.resolve(process.cwd(), dir || eluxConfig.mockServer.dir);
    cli_utils_1.checkPort(port).then((available) => {
        if (available) {
            const src = path_1.default.join(dir, './src');
            const tsconfig = path_1.default.join(dir, './tsconfig.json');
            const start = path_1.default.join(__dirname, './mock.js');
            let cmd = '';
            if (watch) {
                cmd = `nodemon -e ts,js,json -w ${src} --exec ts-node --project ${tsconfig} -r tsconfig-paths/register ${start}`;
            }
            else {
                cmd = `ts-node --project ${tsconfig} -r tsconfig-paths/register ${start}`;
            }
            process.env.SRC = src;
            process.env.PORT = port + '';
            const arr = cmd.split(/\s+/);
            child_process_1.spawn(arr[0], arr.slice(1), {
                stdio: 'inherit',
                shell: process.platform === 'win32',
            });
        }
        else {
            console.error(cli_utils_1.chalk.redBright(`\n\n✖ The port: ${port} is occupied. MockServer startup failed!\n\n`));
        }
    });
}
exports.run = run;
