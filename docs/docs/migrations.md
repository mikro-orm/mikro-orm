---
title: Migrations
---

> To use migrations we need to first install `@mikro-orm/migrations` package for SQL driver or `@mikro-orm/migrations-mongodb` for MongoDB.

MikroORM has integrated support for migrations via [umzug](https://github.com/sequelize/umzug). It allows us to generate migrations with current schema differences.

> Since v5, migrations are stored without extension.

By default, each migration will be all executed inside a transaction, and all of them will be wrapped in one master transaction, so if one of them fails, everything will be rolled back.

## Migration class

Migrations are classes that extend Migration abstract class:

```ts
import { Migration } from '@mikro-orm/migrations';

export class Migration20191019195930 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}
```

To support undoing those changed, we can implement the `down` method, which throws an error by default.

Migrations are by default wrapped in a transaction. You can override this behaviour on per migration basis by implementing the `isTransactional(): boolean` method.

`Configuration` object and driver instance are available in the `Migration` class context.

You can execute queries in the migration via `Migration.execute()` method, which will run queries in the same transaction as the rest of the migration. The `Migration.addSql()` method also accepts instances of knex. Knex instance can be accessed via `Migration.getKnex()`;

### Working with `EntityManager`

While the purpose of migrations is mainly to alter your SQL schema, you can as well use them to modify your data, either by using `this.execute()`, or through an `EntityManager`:

```ts
import { Migration } from '@mikro-orm/migrations';
import { User } from '../entities/User';

export class Migration20191019195930 extends Migration {

    async up(): Promise<void> {
        const em = this.getEntityManager();
        em.create(User, { ... });
        await em.flush();
    }

}
```

## Initial migration

> This is optional and only needed for the specific use case, when both entities and schema already exist.

If we want to start using migrations, and we already have the schema generated, we can do so by creating so called initial migration:

> Initial migration can be created only if there are no migrations previously generated or executed.

```sh
npx mikro-orm migration:create --initial
```

This will create the initial migration, containing the schema dump from `schema:create` command. The migration will be automatically marked as executed.

## Snapshots

Creating new migration will automatically save the target schema snapshot into migrations folder. This snapshot will be then used if we try to create new migration, instead of using current database schema. This means that if we try to create new migration before we run the pending ones, we still get the right schema diff.

> Snapshots should be versioned just like the regular migration files.

Snapshotting can be disabled via `migrations.snapshot: false` in the ORM config.

## Configuration

> Since v5, `umzug` 3.0 is used, and `pattern` option has been replaced with `glob`.

> `migrations.path` and `migrations.pathTs` works the same way as `entities` and `entitiesTs` in entity discovery.

```ts
await MikroORM.init({
  // default values:
  migrations: {
    tableName: 'mikro_orm_migrations', // name of database table with log of executed transactions
    path: './migrations', // path to the folder with migrations
    pathTs: undefined, // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
    glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
    transactional: true, // wrap each migration in a transaction
    disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
    allOrNothing: true, // wrap all migrations in master transaction
    dropTables: true, // allow to disable table dropping
    safe: false, // allow to disable table and column dropping
    snapshot: true, // save snapshot when creating new migrations
    emit: 'ts', // migration generation mode
    generator: TSMigrationGenerator, // migration generator, e.g. to allow custom formatting
  },
})
```

## Running migrations in production

In production environment we might want to use compiled migration files. Since v5, this should work almost out of box, all we need to do is to configure the migration path accordingly:

```ts
import { MikroORM, Utils } from '@mikro-orm/core';

await MikroORM.init({
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  // or alternatively
  // migrations: {
  //   path: Utils.detectTsNode() ? 'src/migrations' : 'dist/migrations',
  // },
  // ...
});
```

This should allow using CLI to generate TS migration files (as in CLI we probably have TS support enabled), while using compiled JS files in production, where ts-node is not registered.

## Using custom `MigrationGenerator`

When we generate new migrations, `MigrationGenerator` class is responsible for generating the file contents. We can provide our own implementation to do things like formatting the SQL statement.

```ts
import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { format } from 'sql-formatter';

class CustomMigrationGenerator extends TSMigrationGenerator {

  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    const comment = '// this file was generated via custom migration generator\n\n';
    return comment + super.generateMigrationFile(className, diff);
  }

  createStatement(sql: string, padLeft: number): string {
    sql = format(sql, { language: 'postgresql' });
    // a bit of indenting magic
    sql = sql.split('\n').map((l, i) => i === 0 ? l : `${' '.repeat(padLeft + 13)}${l}`).join('\n');

    return super.createStatement(sql, padLeft);
  }

}

await MikroORM.init({
  // ...
  migrations: {
    generator: CustomMigrationGenerator,
  },
});
```

## Using via CLI

You can use it via CLI:

```sh
npx mikro-orm migration:create   # Create new migration with current schema diff
npx mikro-orm migration:up       # Migrate up to the latest version
npx mikro-orm migration:down     # Migrate one step down
npx mikro-orm migration:list     # List all executed migrations
npx mikro-orm migration:check    # Check if schema is up to date
npx mikro-orm migration:pending  # List all pending migrations
npx mikro-orm migration:fresh    # Drop the database and migrate up to the latest version
```

> To create blank migration file, we can use `npx mikro-orm migration:create --blank`.

For `migration:up` and `migration:down` commands we can specify `--from` (`-f`), `--to` (`-t`) and `--only` (`-o`) options to run only a subset of migrations:

```sh
npx mikro-orm migration:up --from 2019101911 --to 2019102117  # the same as above
npx mikro-orm migration:up --only 2019101923                  # apply a single migration
npx mikro-orm migration:down --to 0                           # migrate down all migrations
```

> To run TS migration files, we will need to [enable `useTsNode` flag](installation.md#setting-up-the-commandline-tool) in our `package.json`.

For the `migration:fresh` command we can specify `--seed` to seed the database after migrating.

```shell
npx mikro-orm migration:fresh --seed              # seed the database with the default database seeder
npx mikro-orm migration:fresh --seed=UsersSeeder  # seed the database with the UsersSeeder
```

> You can specify the default database seeder in the orm config with the key `config.seeder.defaultSeeder`

## Using the Migrator programmatically

Or we can create a simple script where we initialize MikroORM like this:

```ts title="./migrate.ts"
import { MikroORM } from '@mikro-orm/core';

(async () => {
  const orm = await MikroORM.init({
    dbName: 'our-db-name',
    // ...
  });

  const migrator = orm.getMigrator();
  await migrator.createMigration(); // creates file Migration20191019195930.ts
  await migrator.up(); // runs migrations up to the latest
  await migrator.up('name'); // runs only given migration, up
  await migrator.up({ to: 'up-to-name' }); // runs migrations up to given version
  await migrator.down(); // migrates one step down
  await migrator.down('name'); // runs only given migration, down
  await migrator.down({ to: 'down-to-name' }); // runs migrations down to given version
  await migrator.down({ to: 0 }); // migrates down to the first version

  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```sh
$ ts-node migrate
```

## Providing transaction context

In some cases we might want to control the transaction context ourselves:

```ts
await orm.em.transactional(async em => {
  await migrator.up({ transaction: em.getTransactionContext() });
});
```

## Importing migrations statically

If we do not want to dynamically import a folder (e.g. when bundling our code with webpack) we can import migrations directly.

```ts
import { MikroORM } from '@mikro-orm/core';
import { Migration20191019195930 } from '../migrations/Migration20191019195930.ts';

await MikroORM.init({
  migrations: {
    migrationsList: [
      {
        name: 'Migration20191019195930.ts',
        class: Migration20191019195930,
      },
    ],
  },
});
```

With the help of [webpack's context module api](https://webpack.js.org/guides/dependency-management/#context-module-api) we can dynamically import the migrations making it possible to import all files in a folder.

```ts
import { MikroORM } from '@mikro-orm/core';
import { basename } from 'path';

const migrations = {};

function importAll(r) {
  r.keys().forEach(
    (key) => (migrations[basename(key)] = Object.values(r(key))[0])
  );
}

importAll(require.context('../migrations', false, /\.ts$/));

const migrationsList = Object.keys(migrations).map((migrationName) => ({
  name: migrationName,
  class: migrations[migrationName],
}));

await MikroORM.init({
  migrations: {
    migrationsList,
  },
});
```

## Using custom migration names

Since v5.7, you can specify a custom migration name via `--name` CLI option. It will be appended to the generated prefix:

```sh
# generates file Migration20230421212713_add_email_property_to_user_table.ts
npx mikro-orm migration:create --name=add_email_property_to_user_table
```

You can customize the naming convention for your migration file by utilizing the `fileName` callback, or even use it to enforce migrations with names:

```ts
migrations: {
  fileName: (timestamp: string, name?: string) => {
    // force user to provide the name, otherwise we would end up with `Migration20230421212713_undefined`
    if (!name) {
      throw new Error('Specify migration name via `mikro-orm migration:create --name=...`');
    }

    return `Migration${timestamp}_${name}`;
  },
},
```

:::caution Warning

When overriding the `migrations.fileName` strategy, keep in mind that your migration files need to be sortable, you should never start the filename with the custom `name` option as it could result in wrong order of execution.

:::

## MongoDB support

Support for migrations in MongoDB has been added in v5.3. It uses its own package: `@mikro-orm/migrations-mongodb`, and should be otherwise compatible with the current CLI commands. Use `this.driver` or `this.getCollection()` to manipulate with the database.

### Transactions

The default options for `Migrator` will use transactions, and those impose some additional requirements in mongo, namely the collections need to exist upfront and we need to run a replicaset. You might want to disable transactions for `migrations: { transactional: false }`.

```ts
await this.driver.nativeDelete('Book', { foo: true }, { ctx: this.ctx });
```

You need to provide the transaction context manually to your queries, either via the `ctx` option of the driver methods, or via the MongoDB `session` option when using the `this.getCollection()` method.

```ts
await this.getCollection('Book').updateMany({}, { $set: { updatedAt: new Date() } }, { session: this.ctx });
```

### Migration class

Example migration in mongo:

```ts
import { Migration } from '@mikro-orm/migrations-mongodb';

export class MigrationTest1 extends Migration {

  async up(): Promise<void> {
    // use `this.getCollection()` to work with the mongodb collection directly
    await this.getCollection('Book').updateMany({}, { $set: { updatedAt: new Date() } }, { session: this.ctx });

    // or use `this.driver` to work with the `MongoDriver` API instead
    await this.driver.nativeDelete('Book', { foo: true }, { ctx: this.ctx });
  }

}
```

## Limitations

### MySQL

There is no way to rollback DDL changes in MySQL. An implicit commit is forced for those queries automatically, so transactions are not working as expected.

- https://github.com/mikro-orm/mikro-orm/issues/217
- https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html

### MongoDB

- no nested transaction support
- no schema diffing
- only blank migrations are generated
