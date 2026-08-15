const rule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: { description: 'Disallow imports that are never referenced' },
    messages: { unused: `'{{name}}' is imported but never used.` },
  },
  create(context) {
    const decls = [];
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
        decls.push(node);
      },
      Identifier: markUsed,
      JSXIdentifier: markUsed,
      'Program:exit'() {
        const text = context.sourceCode.text;

        for (const decl of decls) {
          const specs = decl.specifiers;
          const unused = specs.filter(spec => !used.has(spec.local.name));

          if (unused.length === 0) {
            continue;
          }

          const report = (spec, fix) => {
            context.report({ node: spec, messageId: 'unused', data: { name: spec.local.name }, fix });
          };

          if (unused.length === specs.length) {
            // whole declaration is dead, remove it including the trailing newline
            const end = text[decl.range[1]] === '\n' ? decl.range[1] + 1 : decl.range[1];
            report(unused[0], fixer => fixer.removeRange([decl.range[0], end]));
            unused.slice(1).forEach(spec => report(spec));
            continue;
          }

          const named = specs.filter(spec => spec.type === 'ImportSpecifier');
          const namedUnused = named.filter(spec => !used.has(spec.local.name));

          // default/namespace specifiers always precede named ones, remove them with the comma that follows
          for (const spec of unused.filter(spec => spec.type !== 'ImportSpecifier')) {
            const comma = text.indexOf(',', spec.range[1]);
            const tail = /^\s*/.exec(text.slice(comma + 1))[0].length;
            report(spec, fixer => fixer.removeRange([spec.range[0], comma + 1 + tail]));
          }

          if (namedUnused.length === named.length && named.length > 0) {
            // the whole named group is dead, remove `, { ... }` after the kept default/namespace specifier
            const prev = specs[specs.indexOf(named[0]) - 1];
            const comma = text.indexOf(',', prev.range[1]);
            const close = text.indexOf('}', named[named.length - 1].range[1]) + 1;
            report(namedUnused[0], fixer => fixer.removeRange([comma, close]));
            namedUnused.slice(1).forEach(spec => report(spec));
            continue;
          }

          // remove contiguous runs of unused named specifiers in a single fix to keep `--fix` one-pass
          for (let i = 0; i < named.length; i++) {
            if (used.has(named[i].local.name)) {
              continue;
            }

            let j = i;

            while (j + 1 < named.length && !used.has(named[j + 1].local.name)) {
              j++;
            }

            const range = i === 0
              ? [named[0].range[0], named[j + 1].range[0]]
              : [named[i - 1].range[1], named[j].range[1]];
            report(named[i], fixer => fixer.removeRange(range));

            for (let k = i + 1; k <= j; k++) {
              report(named[k]);
            }

            i = j;
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
