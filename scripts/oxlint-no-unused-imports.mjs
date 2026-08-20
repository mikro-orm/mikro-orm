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
        const reports = [];
        // [start, end, ownerIndex] triples, owner points into `reports`
        const removals = [];

        for (const decl of decls) {
          const specs = decl.specifiers;
          const unused = specs.filter(spec => !used.has(spec.local.name));

          if (unused.length === 0) {
            continue;
          }

          const owner = reports.length;
          unused.forEach(spec => reports.push(spec));

          if (unused.length === specs.length) {
            // whole declaration is dead, remove it including the trailing newline
            const end = text[decl.range[1]] === '\n' ? decl.range[1] + 1 : decl.range[1];
            removals.push([decl.range[0], end, owner]);
            continue;
          }

          const named = specs.filter(spec => spec.type === 'ImportSpecifier');
          const namedUnused = named.filter(spec => !used.has(spec.local.name));

          // default/namespace specifiers always precede named ones, remove them with the comma that follows
          for (const spec of unused.filter(spec => spec.type !== 'ImportSpecifier')) {
            const comma = text.indexOf(',', spec.range[1]);
            const tail = /^\s*/.exec(text.slice(comma + 1))[0].length;
            removals.push([spec.range[0], comma + 1 + tail, reports.indexOf(spec)]);
          }

          if (namedUnused.length === named.length && named.length > 0) {
            // the whole named group is dead, remove `, { ... }` after the kept default/namespace specifier
            const prev = specs[specs.indexOf(named[0]) - 1];
            const comma = text.indexOf(',', prev.range[1]);
            const close = text.indexOf('}', named[named.length - 1].range[1]) + 1;
            removals.push([comma, close, reports.indexOf(namedUnused[0])]);
            continue;
          }

          // contiguous runs of unused named specifiers collapse into a single removal
          for (let i = 0; i < named.length; i++) {
            if (used.has(named[i].local.name)) {
              continue;
            }

            let j = i;

            while (j + 1 < named.length && !used.has(named[j + 1].local.name)) {
              j++;
            }

            const [start, end] = i === 0
              ? [named[0].range[0], named[j + 1].range[0]]
              : [named[i - 1].range[1], named[j].range[1]];
            removals.push([start, end, reports.indexOf(named[i])]);
            i = j;
          }
        }

        // merge touching removals so no two fixes have adjacent ranges, keeping `--fix` single-pass
        removals.sort((a, b) => a[0] - b[0]);
        const merged = [];

        for (const removal of removals) {
          const last = merged[merged.length - 1];

          if (last && removal[0] <= last[1]) {
            last[1] = Math.max(last[1], removal[1]);
          } else {
            merged.push(removal);
          }
        }

        const fixes = new Map(merged.map(([start, end, owner]) => [owner, [start, end]]));

        reports.forEach((spec, index) => {
          const range = fixes.get(index);
          context.report({
            node: spec,
            messageId: 'unused',
            data: { name: spec.local.name },
            fix: range && (fixer => fixer.removeRange(range)),
          });
        });
      },
    };
  },
};

export default {
  meta: { name: 'mikro-orm' },
  rules: { 'no-unused-imports': rule },
};
