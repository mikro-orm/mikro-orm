---
---

# Installation & Usage

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2 # for mysql
$ yarn add mikro-orm pg # for postgresql
$ yarn add mikro-orm sqlite # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2 # for mysql
$ npm i -s mikro-orm pg # for postgresql
$ npm i -s mikro-orm sqlite # for sqlite
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
in `tsconfig.json` via:

```json
"experimentalDecorators": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
  baseDir: __dirname, // defaults to `process.cwd()`
});
console.log(orm.em); // access EntityManager via `em` property
```

You can also provide paths where you store your entities via `entitiesDirs` array. Internally
it uses [`globby`](https://github.com/sindresorhus/globby) so you can use 
[globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns). 

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['./dist/app/**/entities'],
  // ...
});
```

You should provide list of directories, not paths to entities directly. If you want to do that
instead, you should use `entities` array and use `globby` manually:

```typescript
import { sync } from 'globby';

const orm = await MikroORM.init({
  entities: sync('./dist/app/**/entities/*.js').map(require),
  // ...
});
```

## Entity discovery in TypeScript

Internally, `MikroORM` uses [performs analysis](metadata-cache.md) of source files of entities 
to sniff types of all properties. This process can be slow if your project contains lots of 
files. To speed up the discovery process a bit, you can provide more accurate paths where your
entity source files are: 

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  entitiesDirsTs: ['./src/entities'], // path to your TS entities (source), relative to `baseDir`
  // ...
});
```

Then you will need to fork entity manager for each request so their identity maps will not 
collide. To do so, use the `RequestContext` helper:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

More info about `RequestContext` is described [here](identity-map.md#request-context).

Now you can start [defining your entities](defining-entities.md) (in one of the `entitiesDirs` folders).

[&larr; Back to table of contents](index.md#table-of-contents)
