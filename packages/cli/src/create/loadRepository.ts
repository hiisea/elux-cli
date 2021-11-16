import path from 'path';
import os from 'os';
import download from 'download-git-repo';
import {fs} from '@elux/cli-utils';
import {USER_AGENT} from './base';
export interface ITemplates {
  name: string;
  platforms?: string | string[];
  desc?: string;
}

export function loadRepository(repository: string, clone: boolean, proxy: string): Promise<string | Error> {
  // const presetName = repository
  //   .replace(/((?:.git)?#.*)/, '')
  //   .split('/')
  //   .slice(-1)[0]
  //   // for direct urls, it's hard to get the correct project name,
  //   // but we need to at least make sure no special characters remaining
  //   .replace(/[:#]/g, '');

  const tmpdir = path.join(os.tmpdir(), 'elux-cli-tpl');
  const options: any = {clone, headers: {'user-agent': USER_AGENT}};
  if (proxy) {
    options.proxy = proxy;
  } else {
    options.agent = false;
  }
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(tmpdir)) {
        fs.removeSync(tmpdir);
      }
      download(repository, tmpdir, options, (e: Error) => {
        if (e) {
          reject(e);
        } else {
          resolve(tmpdir);
        }
      });
    } catch (e: any) {
      reject(e);
    }
  });
}
