---
title: TypeScript loaders in CLI
---

The CLI needs to be able to `import()` your TypeScript files, both the ORM config and the entities it discovers from it. Node.js can run TypeScript on its own nowadays, but only by stripping the types away, so files using enums or decorators still fail to parse. Entities defined with decorators are the common case, hence the CLI registers one of the supported TypeScript loaders before it loads your config. When it cannot find any, it falls back to the compiled JavaScript config and ignores the TypeScript one.

## Detection

TypeScript support is detected automatically, based on things like the file extension of the config file, the presence of a TS loader in `process.execArgv`, or the test runner in use. You can enforce it via the `preferTs` setting in your `package.json`, or with the `MIKRO_ORM_CLI_PREFER_TS` environment variable:

```json title="./package.json"
"mikro-orm": {
  "preferTs": true
}
```

## Supported loaders

- `oxc` via `@oxc-node/core`, supports metadata reflection
- `swc` via `@swc-node/register`, supports metadata reflection
- `tsx`
- `jiti`
- `tsimp`
- `nub` via `@nubjs/loader`, supports metadata reflection (available from v7.2)

Metadata reflection here means the loader honors `emitDecoratorMetadata`, which is required by the [`ReflectMetadataProvider`](./metadata-providers.md#reflectmetadataprovider) together with the legacy decorators. The other metadata providers do not depend on it.

## Selecting a loader

The default is `auto`, which goes through the loaders in the order above and picks the first one available in your dependencies. To pick one explicitly, use the `tsLoader` setting in your `package.json`:

```json title="./package.json"
"mikro-orm": {
  "tsLoader": "jiti"
}
```

Or override it via the `MIKRO_ORM_CLI_TS_LOADER` environment variable. With an explicit loader there is no fallback, if it is missing or fails to load, the CLI throws instead of trying the next one.

## The tsconfig.json file

Some loaders are pointed at your `tsconfig.json`, which defaults to `tsconfig.json` in the current working directory. Use the `tsConfigPath` setting or the `MIKRO_ORM_CLI_TS_CONFIG_PATH` environment variable to use a different one:

```json title="./package.json"
"mikro-orm": {
  "tsConfigPath": "./tsconfig.cli.json"
}
```

## Nub

Nub resolves the `tsconfig.json` on its own, always the nearest one relative to each imported file, and it cannot be pointed at a custom path. Selecting it together with `tsConfigPath` therefore throws, and the automatic selection skips it whenever a custom tsconfig path is configured.

It also only understands the legacy decorators, so `experimentalDecorators: true` is required, and it rejects files using the [ES decorators](./using-decorators.md). Pick another loader if your entities use those.

```json title="./package.json"
"mikro-orm": {
  "tsLoader": "nub"
}
```

## Compiling ahead of time

The loaders above are only about running TypeScript directly. If you compile your project with `tsc`, Babel or SWC instead, see [Usage with transpilers](./usage-with-transpilers.md) for the decorator options those need.
