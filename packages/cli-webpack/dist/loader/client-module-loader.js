"use strict";
module.exports = function loader(source) {
    const arr = source.match(/\bexportModule\s*\(([^)]+)\)/m);
    const elux = source.match(/['"](@elux\/.+?)['"]/);
    const model = source.match(/['"](\.\/model)['"]/);
    if (arr && elux && model) {
        const args = arr[1].replace(/\s/gm, '');
        const [modelName, ModelHandlers] = args.split(',', 3);
        const strs = [
            `import {modelHotReplacement} from ${elux[0]};`,
            source,
            `if (module.hot) {
        module.hot.accept("./model", () => {
          modelHotReplacement(${[modelName, ModelHandlers].join(' , ')});
        });
      }`,
        ];
        return strs.join('\n');
    }
    return source;
};
