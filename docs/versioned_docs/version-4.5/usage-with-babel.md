---
title: Usage with Babel
---

When compiling TS via babel, decorators are by default handled different implementation
than what `tsc` uses. To make the metadata extraction from decorators via Babel work, 
we need to do use following plugins:

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

Lastly we need to set the `BABEL_DECORATORS_COMPAT` environment variable to `true` to 
adjust the return value of decorators. 

More information about this topic can be found here:
- https://github.com/mikro-orm/mikro-orm/issues/840
- https://jonahallibonetech.medium.com/next-js-9-mikroorm-eb6f6e08e1a1
