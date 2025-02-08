---
title: Deployment
---

Under the hood, `MikroORM` uses [`ts-morph`](https://github.com/dsherret/ts-morph) to read TypeScript source files of all entities to be able to detect all types. Thanks to this, defining the type is enough for runtime validation.

This has some consequences for deployment of your application. Sometimes you will want to deploy only your compiled output, without TS source files at all. In that case, discovery process will probably fail. You have several options:

## Deploy pre-built cache

Since v6, MikroORM lets you generate production cache bundle into a single JSON file via CLI:

```bash
npx mikro-orm cache:generate --combined
```

This will create `./temp/metadata.json` file which can be used together with `GeneratedCacheAdapter` in your production configuration:

```ts
import { GeneratedCacheAdapter, MikroORM } from '@mikro-orm/core';

await MikroORM.init({
  metadataCache: {
    enabled: true,
    adapter: GeneratedCacheAdapter,
    options: { data: require('./temp/metadata.json') },
  },
  // ...
});
```

This way you can keep the `@mikro-orm/reflection` package as a development dependency only, use the CLI to create the cache bundle, and depend only on that in your production build.

> The cache bundle can be statically imported, which is handy in case you are using some bundler.

## Fill type or entity attributes everywhere

What discovery process does is to sniff TS types and save their value to string, so it can be used later for validation. You can skip the whole process by simply providing those values manually:

```ts
@Entity()
export class Book {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @Enum(() => BookStatus)
  status?: BookStatus;

  @ManyToOne(() => Author) // or `@ManyToOne({ type: 'Author' })` or `@ManyToOne({ entity: () => Author })`
  author1!: Author;

  // or
  @ManyToOne({ type: 'Author' })
  author2!: Author;

  // or
  @ManyToOne({ entity: () => Author })
  author3!: Author;

}

export enum BookStatus {
  SOLD_OUT = 'sold',
  ACTIVE = 'active',
  UPCOMING = 'upcoming',
 }
```

> For numeric enums this is not be required.

## Deploy your entity source files

Usually it does not matter much that you deploy more files than needed, so the easiest way is to just deploy your TS source files next to the compiled output, just like during development.

## Deploy a bundle of entities and dependencies with [Webpack](https://webpack.js.org/)

Webpack can be used to bundle every entity and dependency: you get a single file that contains every required module/file and has no external dependencies.

### Prepare your project for Webpack

Webpack requires every required file to be hardcoded in your code. Code like this won't work (it will throw an error because Webpack doesn't know which file to include in the bundle):

```ts
let dependencyNameInVariable = 'dependency';
const dependency = import(dependencyNameInVariable);
```

As Webpack creates a file bundle, it isn't desired that it scans directories for entities or metadata. Therefore, you need to provide list of entities in the `entities` option in the initialization function, folder/file based discovery is not supported (see dynamically including entities as an alternative solution). Also, you need to fill `type` or `entity` attributes everywhere (see above) and disable caching (it will decrease start-time slightly).

> In v4 caching is disabled by default when using `ReflectMetadataProvider`.

#### Disabling dynamic file access

First thing you should do is to disable dynamic file access in the discovery process via the `discovery.disableDynamicFileAccess` toggle. This will effectively do:

- set metadata provider to `ReflectMetadataProvider`
- disable caching
- disallow usage of paths in `entities/entitiesTs`

#### Manually defining entities

```ts
import { Author, Book, BookTag, Publisher, Test } from '../entities';

await MikroORM.init({
  ...
  entities: [Author, Book, BookTag, Publisher, Test],
  discovery: { disableDynamicFileAccess: true },
  ...
});
```

#### Dynamically loading dependencies

This will make use of a Webpack feature called [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports). This way you can import dependencies as long as part of the path is known.

In following example [`require.context`](https://webpack.js.org/guides/dependency-management/#requirecontext) is used. This 'function' is only usable during the build process with Webpack. Therefore, an alternative solution is provided that will work as long as the environment variable `WEBPACK` is not set (e.g., during development with `ts-node`).

Here, all files with the extension `.ts` will be imported from the directory `../entities`.

> [`flatMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) is a method from ECMAScript 2019 and requires [Node.js](https://nodejs.org/) 11 or higher.

```ts
await MikroORM.init({
  // ...
  entities: await getEntities(),
  discovery: { disableDynamicFileAccess: true },
  // ...
});

async function getEntities(): Promise<any[]> {
  if (process.env.WEBPACK) {
    const modules = require.context('../entities', true, /\.ts$/);

    return modules
      .keys()
      .map(r => modules(r))
      .flatMap(mod => Object.keys(mod).map(className => mod[className]));
  }

  const promises = fs.readdirSync('../entities').map(file => import(`../entities/${file}`));
  const modules = await Promise.all(promises);

  return modules.flatMap(mod => Object.keys(mod).map(className => mod[className]));
}
```

### Webpack configuration

Webpack can be run without [configuration file](https://webpack.js.org/configuration/) but for building MikroORM and [Node.js](https://nodejs.org/) bundles it requires additional configuration. Configuration for Webpack is stored in the root of the project as `webpack.config.js`. For all the options please refer to the following [page](https://webpack.js.org/configuration/).

For bundling MikroORM the following configuration is required:

```js
const path = require('path');
const { EnvironmentPlugin, IgnorePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

// Mark our dev dependencies as externals so they don't get included in the webpack bundle.
const { devDependencies } = require('./package.json');
const externals = {};

for (const devDependency of Object.keys(devDependencies)) {
  externals[devDependency] = `commonjs ${devDependency}`;
}

// And anything MikroORM's packaging can be ignored if it's not on disk.
// Later we check these dynamically and tell webpack to ignore the ones we don't have.
const optionalModules = new Set([
  ...Object.keys(require('knex/package.json').browser),
  ...Object.keys(require('@mikro-orm/core/package.json').peerDependencies),
  ...Object.keys(require('@mikro-orm/core/package.json').devDependencies || {})
]);

module.exports = {
  entry: path.resolve('app', 'server.ts'),

  // You can toggle development mode on to better see what's going on in the webpack bundle,
  // but for anything that is getting deployed, you should use 'production'.
  // mode: 'development',
  mode: 'production',

  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // We want to minify the bundle, but don't want Terser to change the names of our entity
          // classes. This can be controlled in a more granular way if needed, (see
          // https://terser.org/docs/api-reference.html#mangle-options) but the safest default
          // config is that we simply disable mangling altogether but allow minification to proceed.
          mangle: false,
          // Similarly, Terser's compression may at its own discretion change function and class names.
          // While it only rarely does so, it's safest to also disable changing their names here.
          // This can be controlled in a more granular way if needed (see
          // https://terser.org/docs/api-reference.html#compress-options).
          compress: {
            keep_classnames: true,
            keep_fnames: true,
          },
        }
      })
    ]
  },
  target: 'node',
  module: {
    rules: [
      // Bring in our typescript files.
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },

      // Native modules can be bundled as well.
      {
        test: /\.node$/,
        use: 'node-loader',
      },

      // Some of MikroORM's dependencies use mjs files, so let's set them up here.
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
    ],
  },

  // These are computed above.
  externals,

  resolve: {
    extensions: ['.ts', '.js']
  },

  plugins: [
    // Ignore any of our optional modules if they aren't installed. This ignores database drivers
    // that we aren't using for example.
    new EnvironmentPlugin({ WEBPACK: true }),
    new IgnorePlugin({
      checkResource: resource => {
        const baseResource = resource.split('/', resource[0] === '@' ? 2 : 1).join('/');

        if (optionalModules.has(baseResource)) {
          try {
            require.resolve(resource);
            return false;
          } catch {
            return true;
          }
        }

        return false;
      },
    }),
  ],

  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, '..', 'output'),
  },
};
```

### Running Webpack

To run Webpack execute `webpack` (or `npx webpack` if not installed globally) in the root of the project. It will probably throw a few warnings, but you can ignore the errors regarding MikroORM: the mentioned pieces of code won't be executed if properly bundled with Webpack.

## Deploy a bundle of entities and dependencies with `esbuild`

[`esbuild`](https://esbuild.github.io/) can be used to bundle MikroORM entities and dependencies: you get a single file that contains every required module/file. Due to how the bundling works, there are few issues that needs to be properly addressed to make `esbuild` work with MikroORM.

### Required shim for Knex with esbuild

[Knex](https://knexjs.org/) has a known incompatibility with esbuild - Knex attempts to use dynamic imports to handle the various possible database dialects (mySQL, MongoDB, Oracle, etc.) but esbuild does not provide support for dynamic import functionality (see [this GitHub issue](https://github.com/evanw/esbuild/issues/473)).

In order to work around this issue, you can define a shim module as shown below which intercepts Knex's client resolution at runtime and handles the operation itself (thus avoiding the dynamic import code). This enables `esbuild` bundling to work correctly.

Define a file `knex.d.ts` as follows:

```ts
declare module 'knex/lib/dialects/postgres' {
  import { Knex } from 'esbuild-support/knex';
  const client: Knex.Client;
  export = client;
}
```

### Excluding dependencies from esbuild

By default, esbuild will bundle all of MikroORM's packages, including all database dialects (and their dependencies on database drivers). This is likely undesirable since it will create quite a large bundle, and most applications will only need to interact with one database platform. To exclude these unnecessary dependencies, pass a list of exclusions to esbuild via the [external](https://esbuild.github.io/api/#external) configuration option. For example, if using the `postgresql` platform you can exclude other unneeded dependencies as follows:

```ts
external: [
  '@mikro-orm/migrations',
  '@mikro-orm/entity-generator',
  '@mikro-orm/mariadb',
  '@mikro-orm/mongodb',
  '@mikro-orm/mysql',
  '@mikro-orm/mssql',
  '@mikro-orm/seeder',
  '@mikro-orm/sqlite',
  '@mikro-orm/libsql',
  '@vscode/sqlite3',
  'sqlite3',
  'mysql',
  'mysql2',
  'oracledb',
  'pg-native',
  'pg-query-stream',
  'tedious',
]
```
