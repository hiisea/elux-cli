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

export function loadRepository(url: string, proxy: string): Promise<string | Error> {
  const tmpdir = path.join(os.tmpdir(), 'elux-cli-tpl');
  const options: any = {clone: false, headers: {'user-agent': USER_AGENT}};
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
      download('direct:' + url, tmpdir, options, (e: Error) => {
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
