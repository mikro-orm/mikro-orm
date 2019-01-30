# Installation & Usage

> **Current documentation is for upcoming version 2.**
>
> You can install it via `mikro-orm@next` tag.

Fist install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2 # for mysql
$ yarn add mikro-orm sqlite # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2 # for mysql
$ npm i -s mikro-orm sqlite # for sqlite
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
  baseDir: __dirname, // defaults to `process.cwd()`
});
console.log(orm.em); // EntityManager
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
