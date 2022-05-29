module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'bean文件中的export必须使用get或set开头的驼峰命名',
    },
    fixable: 'code',
  },
  create(context) {
    const fileName = context.getFilename();
    if (!fileName.endsWith('.bean.js')) return {};
    return {
      'ExportNamedDeclaration > FunctionDeclaration > Identifier': (node) => {
        const nodeName = node.name;
        if ((!nodeName.startsWith('get') && !nodeName.startsWith('set')) || nodeName.charAt(3) < 'A' || nodeName.charAt(3) > 'Z') {
          const name = `${nodeName.charAt(0).toUpperCase()}${nodeName.substring(1)}`;
          context.report({
            node,
            message: `请使用get${name}或set${name}`,
            fix(fixer) {
              return fixer.replaceTextRange(node.range, `get${name}`);
            },
          });
        }
      },
    };
  },
};
