declare module 'mem-fs-editor/lib/util';
declare module 'download' {
  const main: (url: string, dist: string, options: any) => Promise<void>;
  export default main;
}
