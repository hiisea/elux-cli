import path from 'path';
import {execa, fse} from '@elux/cli-utils';

export = async function moduleExports(rootPath: string, dir: string): Promise<void> {
  const projectDir = path.resolve(rootPath, dir);
  const lockDir = path.resolve(rootPath, dir + '-lock');
  process.chdir(path.resolve(projectDir));
  console.log(projectDir);
  console.log('清除相关文件...');
  fse.removeSync(lockDir);
  fse.removeSync(path.join(projectDir, 'yarn.lock'));
  fse.removeSync(path.join(projectDir, 'package-lock.json'));
  fse.removeSync(path.join(projectDir, 'node_modules'));
  console.log('yarn install...');
  let subProcess = execa('yarn', ['install']);
  subProcess.stdin!.pipe(process.stdin);
  subProcess.stdout!.pipe(process.stdout);
  subProcess.stderr!.pipe(process.stderr);
  await subProcess;
  console.log('清除相关文件...');
  fse.moveSync(path.join(projectDir, 'yarn.lock'), path.join(lockDir, 'yarn.lock'));
  fse.removeSync(path.join(projectDir, 'node_modules'));
  console.log('npm install...');
  subProcess = execa('npm', ['install', '--legacy-peer-deps']);
  await subProcess;
  fse.moveSync(path.join(projectDir, 'package-lock.json'), path.resolve(lockDir, 'package-lock.json'));
};
