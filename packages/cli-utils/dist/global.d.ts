declare module 'deep-extend' {
  const deepExtend: (...args: any[]) => any;
  export default deepExtend;
}
declare module 'get-proxy' {
  const main: () => string | null;
  export default main;
}
declare module 'semver';
declare module 'tunnel';
declare module 'download' {
  const main: (url: string, dist: string, options: any) => Promise<void>;
  export default main;
}
declare module 'global-agent';
declare module 'archiver';
