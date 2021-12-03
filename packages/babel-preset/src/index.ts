export type Options = {
  module?: 'cjs' | 'esm';
  targets?: any;
  presets?: any[];
  plugins?: any[];
  moduleResolver?: {root: string[]; alias: {[key: string]: string}};
  rootImport?: any;
  classPropertiesLoose?: boolean;
  ui?: 'react' | 'vue' | 'vue2' | 'vue3';
};
const runtimeVersion = require('@babel/runtime/package.json').version;

module.exports = function (api: any, options: Options = {}) {
  if (process.env.NODE_ENV === 'test' || api.caller((caller: any) => caller && caller.target === 'node')) {
    options.module = 'cjs';
  }
  if (options.module === 'cjs' && !options.targets) {
    options.targets = {node: 'current'};
  }
  const {module = 'esm', targets, presets = [], moduleResolver, rootImport, plugins = [], classPropertiesLoose = true, ui} = options;

  if (ui === 'react') {
    presets.unshift(['@babel/preset-react', {runtime: 'automatic'}]);
  } else if (ui === 'vue2') {
    presets.unshift('@vue/babel-preset-jsx');
  } else if (ui === 'vue' || ui === 'vue3') {
    plugins.unshift('@vue/babel-plugin-jsx');
  }

  const pluginsList = [
    rootImport && ['babel-plugin-root-import', rootImport],
    moduleResolver && ['module-resolver', moduleResolver],
    ...plugins,
    ['@babel/plugin-proposal-decorators', {legacy: false, decoratorsBeforeExport: true}],
    ['@babel/plugin-proposal-class-properties', {loose: classPropertiesLoose}],
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: module === 'esm',
        version: runtimeVersion,
      },
    ],
  ].filter(Boolean);

  return {
    sourceType: 'unambiguous',
    presets: [
      [
        '@babel/preset-env',
        {
          loose: true,
          modules: module === 'cjs' ? 'cjs' : false,
          targets,
        },
      ],
      ...presets,
    ].filter(Boolean),
    overrides: [
      {
        test: /\.vue$/,
        plugins: [['@babel/plugin-transform-typescript', {allowDeclareFields: true, isTSX: true}], ...pluginsList],
      },
      {
        test: /\.ts$/,
        plugins: [['@babel/plugin-transform-typescript', {allowDeclareFields: true, isTSX: false}], ...pluginsList],
      },
      {
        test: /\.tsx$/,
        plugins: [['@babel/plugin-transform-typescript', {allowDeclareFields: true, isTSX: true}], ...pluginsList],
      },
      {
        plugins: pluginsList,
      },
    ],
  };
};
