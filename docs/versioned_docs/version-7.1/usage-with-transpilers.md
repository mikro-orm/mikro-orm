---
title: Usage with transpilers
---

## Babel

When compiling TS via babel, decorators are by default handled different implementation than what `tsc` uses. To make the metadata extraction from decorators via Babel work, you need to use the following plugins:

```json
{
  "plugins": [
    "babel-plugin-transform-typescript-metadata",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true  }]
  ]
}
```

> Make sure to install the plugins first: `yarn add -D babel-plugin-transform-typescript-metadata @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties`

Lastly you need to set the `BABEL_DECORATORS_COMPAT` environment variable to `true` to adjust the return value of decorators.

More information about this topic can be found here:

- https://github.com/mikro-orm/mikro-orm/issues/840
- https://jonahallibonetech.medium.com/next-js-9-mikroorm-eb6f6e08e1a1

## SWC

When compiling TS via SWC, decorator metadata is not emitted by default, regardless of what you may have specified in `tsconfig.json`. In addition, class names are mangled by default when the target is "es5" which is SWC's default. This causes problems when the name of a table is inferred from the class name, as opposed to being explicitly specified as a decorator option. Telling SWC to preserve the class names in turn requires a target of "es2016" or higher. For the best overall performance, and because MikroORM is ultimately running on a server, you may want to set the target to "esnext". That way, SWC does the fewest transformations possible and produces the most modern code possible.

So, to make the metadata extraction from decorators and class name preservation via SWC work correctly, you need the following config in your `.swcrc` file:

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "target": "esnext",
    "minify": false
  }
}
```

If you'd like to enable minification, you may also need to set `jsc.keepClassNames` to `true`, as well as the equivalent "mangle" and "compress" options to preserve class names.

More information about this topic can be found here:

- https://github.com/mikro-orm/mikro-orm/issues/5255
- https://swc.rs/docs/configuration/compilation#jsctransformdecoratormetadata
- https://swc.rs/docs/configuration/compilation#jsckeepclassnames
- https://swc.rs/docs/configuration/minification
