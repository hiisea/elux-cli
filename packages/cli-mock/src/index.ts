import path from 'path';
import {spawn} from 'child_process';
import {checkPort, deepExtend, chalk, log, schemaValidate} from '@elux/cli-utils';

interface MockServerPreset {
  port: number;
  dir: string;
}
interface EluxConfig {
  mockServer: MockServerPreset;
}

const EluxConfigSchema: any = {
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

export = function (rootPath: string, baseEluxConfig: Record<string, any>, options: {port?: number; dir?: string; watch?: boolean}): void {
  schemaValidate(EluxConfigSchema, baseEluxConfig, {name: '@elux/cli-mock'});
  const defaultBaseConfig: EluxConfig = {
    mockServer: {
      dir: './mock',
      port: 3003,
    },
  };
  const eluxConfig: EluxConfig = deepExtend(defaultBaseConfig, baseEluxConfig);
  const port = options.port || eluxConfig.mockServer.port;
  const dir = path.resolve(rootPath, options.dir || eluxConfig.mockServer.dir);

  checkPort(port).then((available) => {
    if (available) {
      const src = path.join(dir, './src');
      const tsconfig = path.join(dir, './tsconfig.json');
      const start = path.join(__dirname, './mock.js');
      let cmd = '';
      if (options.watch) {
        cmd = `nodemon -e ts,js,json -w ${src} --exec ts-node --project ${tsconfig} -r tsconfig-paths/register ${start}`;
      } else {
        cmd = `ts-node --project ${tsconfig} -r tsconfig-paths/register ${start}`;
      }
      process.env.SRC = src;
      process.env.PORT = port + '';
      const arr = cmd.split(/\s+/);
      spawn(arr[0], arr.slice(1), {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
    } else {
      log(chalk.red(`\n\n[error] The port: ${port} is occupied. MockServer startup failed!\n\n`));
    }
  });
};
