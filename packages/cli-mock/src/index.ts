import {spawn} from 'child_process';
import path from 'path';
import {chalk, checkPort, deepExtend, getEluxConfig, schemaValidate} from '@elux/cli-utils';

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

export function run({env, port, dir, watch}: {env: string; port: number; watch: boolean; dir: string}): void {
  const {config: baseEluxConfig} = getEluxConfig(env);
  schemaValidate(EluxConfigSchema, baseEluxConfig, {name: '@elux/cli-mock'});
  const defaultBaseConfig: EluxConfig = {
    mockServer: {
      dir: './mock',
      port: 3003,
    },
  };
  const eluxConfig: EluxConfig = deepExtend(defaultBaseConfig, baseEluxConfig);
  port = port || eluxConfig.mockServer.port;
  dir = path.resolve(process.cwd(), dir || eluxConfig.mockServer.dir);

  checkPort(port).then((available) => {
    if (available) {
      const src = path.join(dir, './src');
      const tsconfig = path.join(dir, './tsconfig.json');
      const start = path.join(__dirname, './mock.js');
      let cmd = '';
      if (watch) {
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
      console.error(chalk.redBright(`\n\n✖ The port: ${port} is occupied. MockServer startup failed!\n\n`));
    }
  });
}
