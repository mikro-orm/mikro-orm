---
title: Deployment
---

Under the hood, `MikroORM` uses [`ts-morph`](https://github.com/dsherret/ts-morph) to read 
TypeScript source files of all entities to be able to detect all types. Thanks to this, 
defining the type is enough for runtime validation.

This has some consequences for deployment of your application. Sometimes you will want to 
deploy only your compiled output, without TS source files at all. In that case, discovery 
process will probably fail. You have several options:

## Deploy pre-built cache

By default, output of metadata discovery will be cached in `temp` folder. You can reuse this 
cache in your deployed application. Currently the cache is saved in files named like the entity
source file, e.g. `Author.ts` entity will store cache in `temp/Author.ts.json` file.

When running compiled code, JS entities will be taken into account instead, so you will need to 
generate the cache by running the compiled code locally. That will generate `temp/Author.js.json`, 
which is the file you will need to deploy alongside your application. 

## Fill type or entity attributes everywhere

What discovery process does is to sniff TS types and save their value to string, so it can be 
used later for validation. You can skip the whole process by simply providing those values 
manually:

```typescript
@Entity()
export class Book implements IdEntity<Book> {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @Enum({ type: 'BookStatus' })
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

Usually it does not matter much that you deploy more files than needed, so the easiest way
is to just deploy your TS source files next to the compiled output, just like during development.

## Deploy a bundle of entities and dependencies with [Webpack](https://webpack.js.org/)

Webpack can be used to bundle every entity and dependency: you get a single file that contains 
every required module/file and has no external dependencies.

### Prepare your project for Webpack

Webpack requires every required file to be hardcoded in your code. Code like this won't work 
(it will throw an error because Webpack doesn't know which file to include in the bundle):

```typescript
let dependencyNameInVariable = 'dependency';
const dependency = import(dependencyNameInVariable);
```

As Webpack creates a file bundle, it isn't desired that it scans directories for entities 
or metadata. Therefore you need to use the `entities` option in the initialization function 
and `entitiesDirs`/`entitiesDirsTs` will be ignored (see dynamically including entities as 
an alternative solution). Also you need to fill `type` or `entity` attributes everywhere 
(see above) and disable caching (it will decrease start-time slightly).

#### Disabling dynamic file access

First thing you should do is to disable dynamic file access in the discovery process via the
`discovery.disableDynamicFileAccess` toggle. This will effectively do:

- set metadata provider to `ReflectMetadataProvider`
- disable caching
- disallow usage of `entitiesDirs`

#### Manually defining entities

```typescript
import { Author, Book, BookTag, Publisher, Test } from '../entities';

await MikroORM.init({
  ...
  entities: [Author, Book, BookTag, Publisher, Test],
  discovery: { disableDynamicFileAccess: true },
  ...
});
```

#### Dynamically loading dependencies

This will make use of a Webpack feature called [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports). 
This way you can import dependencies as long as part of the path is known.

In following example [`require.context`](https://webpack.js.org/guides/dependency-management/#requirecontext) 
is used. This 'function' is only usable during the building process from Webpack so therefore 
there is an alternative solution provided that will as long as the environment variable 
WEBPACK is not set (e.g. during development with `ts-node`).

Here, all files with the extension `.ts` will be imported from the directory `../entities`. 

> [`flatMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) is a method from ECMAScript 2019 and requires [Node.js](https://nodejs.org/) 11 or higher.

```typescript
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

Webpack can be run without [configuration file](https://webpack.js.org/configuration/) but 
for building MikroORM and [Node.js](https://nodejs.org/) bundles it requires additional 
configuration. Configuration for Webpack is stored in the root of the project as 
`webpack.config.js`. For all the options please refer to the following [page](https://webpack.js.org/configuration/).

For bundling MikroORM the following configuration is required:

```javascript
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
  ...Object.keys(require('mikro-orm/package.json').peerDependencies),
  ...Object.keys(require('mikro-orm/package.json').devDependencies)
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
        }
      })
    ]
  },
  target: 'node',
  module: {
    rules: [
      // We do not want ts-morph bundled up in the application, as it drags in typescript,
      // which is huge. We are not using either of these at runtime, but they can't be
      // ignored using IgnorePlugin because Mikro still requires them, and this causes an error
      // at runtime. Packaging them with the null-loader allows them to be required without erroring
      // then simply be swapped with null at runtime.
      {
        test: /(TsMorphMetadataProvider|ts-morph)/,
        loader: 'null-loader',
      },

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
        const [baseResource] = resource.split('/');

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

To run Webpack execute `webpack` (or `npx webpack` if not installed globally) in the root 
of the project. It will probably throw a few warnings but you can ignore the errors regarding 
MikroORM: the mentioned pieces of code won't be executed if properly bundled with Webpack.
