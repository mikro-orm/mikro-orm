const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow imports that are never referenced' },
    messages: { unused: `'{{name}}' is imported but never used.` },
  },
  create(context) {
    const specs = [];
    const used = new Set();
    const importRanges = [];

    const markUsed = node => {
      for (const [start, end] of importRanges) {
        if (node.range[0] >= start && node.range[1] <= end) {
          return;
        }
      }
      used.add(node.name);
    };

    return {
      ImportDeclaration(node) {
        importRanges.push(node.range);
        specs.push(...node.specifiers);
      },
      Identifier: markUsed,
      JSXIdentifier: markUsed,
      'Program:exit'() {
        for (const spec of specs) {
          if (!used.has(spec.local.name)) {
            context.report({ node: spec, messageId: 'unused', data: { name: spec.local.name } });
          }
        }
      },
    };
  },
};

export default {
  meta: { name: 'mikro-orm' },
  rules: { 'no-unused-imports': rule },
};
