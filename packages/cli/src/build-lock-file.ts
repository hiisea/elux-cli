import path from 'path';
import {execa, fs, log} from '@elux/cli-utils';

export = async function moduleExports(rootPath: string, dir: string): Promise<void> {
  const projectDir = path.resolve(rootPath, dir);
  const lockDir = path.resolve(rootPath, dir + '-lock');
  process.chdir(path.resolve(projectDir));
  log(projectDir);
  log('清除相关文件...');
  fs.removeSync(lockDir);
  fs.removeSync(path.join(projectDir, 'yarn.lock'));
  fs.removeSync(path.join(projectDir, 'package-lock.json'));
  fs.removeSync(path.join(projectDir, 'node_modules'));
  log('yarn install...');
  let subProcess = execa('yarn', ['install']);
  subProcess.stdin!.pipe(process.stdin);
  subProcess.stdout!.pipe(process.stdout);
  subProcess.stderr!.pipe(process.stderr);
  await subProcess;
  log('清除相关文件...');
  fs.moveSync(path.join(projectDir, 'yarn.lock'), path.join(lockDir, 'yarn.lock'));
  fs.removeSync(path.join(projectDir, 'node_modules'));
  log('npm install...');
  subProcess = execa('npm', ['install', '--legacy-peer-deps']);
  await subProcess;
  fs.moveSync(path.join(projectDir, 'package-lock.json'), path.resolve(lockDir, 'package-lock.json'));
};
