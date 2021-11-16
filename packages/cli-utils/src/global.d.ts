declare module 'deep-extend' {
  const deepExtend: (...args: any[]) => any;
  export default deepExtend;
}
declare module 'isurl' {
  const isurl: {
    (url: string): boolean;
    lenient: (url: string) => boolean;
  };
  export default isurl;
}
declare module 'semver';
declare module 'tunnel';
