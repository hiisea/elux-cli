import path from 'path';
import fs from 'fs';
import {getProgramFromFiles, generateSchema} from 'typescript-json-schema';
import {chalk, log, execa} from '@elux/cli-utils';

export = async function moduleExports(_entryFilePath?: string, _echo?: boolean): Promise<void> {
  const {stdout} = await execa('tsc', ['--project', './src', '--showConfig']);
  const rootPath = process.cwd();
  const srcPath = path.join(rootPath, 'src');
  let tsconfigDir: string;
  if (fs.existsSync(path.join(srcPath, './tsconfig.json'))) {
    tsconfigDir = srcPath;
    process.chdir(tsconfigDir);
  } else {
    tsconfigDir = rootPath;
  }
  const tsconfig = JSON.parse(stdout);
  const {baseUrl = ''} = tsconfig.compilerOptions || {};
  const compilerOptions = {
    ...tsconfig.compilerOptions,
    baseUrl: path.resolve(tsconfigDir, baseUrl),
    emitDeclarationOnly: false,
    noEmit: true,
    composite: false,
    sourceMap: false,
  };
  const entryFilePath =
    _entryFilePath || (fs.existsSync(path.join(srcPath, 'Global.ts')) ? path.join(srcPath, 'Global.ts') : path.join(srcPath, 'Global.tsx'));
  const source = fs.readFileSync(entryFilePath).toString();
  const arr = source.match(/patchActions\s*\(([^)]+)\)/m);
  if (arr) {
    const [args1, ...args2] = arr[1].split(',');
    const typeName = args1.trim();
    const json = args2.join(',').trim();
    const files = [entryFilePath];
    log(`patchActions using type ${chalk.magenta(`${typeName.substr(1, typeName.length - 2)}`)} for ${entryFilePath}`);
    const program = getProgramFromFiles(files, compilerOptions);
    const defineType = generateSchema(program, typeName.substr(1, typeName.length - 2), {ignoreErrors: false});
    const properties: any = defineType!.properties!;
    const actions = Object.keys(properties).reduce((obj, key) => {
      obj[key] = properties[key].enum;
      return obj;
    }, {});
    const json2 = `'${JSON.stringify(actions)}'`;
    if (_echo) {
      log(`\n${chalk.green(JSON.stringify(actions, null, 4))}\n`);
    } else if (json !== json2) {
      const newSource = source.replace(arr[0], `patchActions(${typeName}, ${json2})`);
      fs.writeFileSync(entryFilePath, newSource);
      log(chalk.green(`\n✔ ${entryFilePath} has been patched!\n`));
    } else {
      log(chalk.green('\nThere was no changes!\n'));
    }
  }
};
