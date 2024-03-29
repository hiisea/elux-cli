import fs from 'fs';
import path from 'path';
import {chalk, execa} from '@elux/cli-utils';
import {generateSchema, getProgramFromFiles} from 'typescript-json-schema';

export async function patchActions({echoOnly}: {echoOnly: boolean}): Promise<void> {
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
  const entryFilePath = fs.existsSync(path.join(srcPath, 'Global.ts')) ? path.join(srcPath, 'Global.ts') : path.join(srcPath, 'Global.tsx');
  const source = fs.readFileSync(entryFilePath).toString();
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
    console.log(`Patch actions for ${chalk.cyan.underline(entryFilePath)}`);
    const program = getProgramFromFiles(files, compilerOptions);
    const defineType = generateSchema(program, typeName, {ignoreErrors: false});
    const properties: any = defineType!.properties!;
    const actions = Object.keys(properties).reduce((obj, key) => {
      obj[key] = properties[key].enum;
      return obj;
    }, {});
    const json = JSON.stringify(actions);
    const json2 = JSON.stringify(actions2);
    if (json === json2) {
      console.log('');
      console.log(chalk.green('There was no changes!\n'));
    } else {
      if (echoOnly) {
        console.log(`\n${chalk.green(JSON.stringify(actions, null, 4))}\n`);
      } else {
        const newSource = source.replace(arr[0], `${arr[1]}${demoteForProdOnly}, ${json}${arr[3]}`);
        fs.writeFileSync(entryFilePath, newSource);
        console.log('');
        console.log(chalk.green(`✔ Has been patched!\n`));
      }
    }
  }
}
