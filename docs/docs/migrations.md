---
title: Migrations
---

> To use migrations we need to first install `@mikro-orm/migrations` package.

MikroORM has integrated support for migrations via [umzug](https://github.com/sequelize/umzug).
It allows you to generate migrations with current schema differences.

> Since v5, migrations are stored without extension.

By default, each migration will be all executed inside a transaction, and all of them will 
be wrapped in one master transaction, so if one of them fails, everything will be rolled back. 

## Migration class

Migrations are classes that extend Migration abstract class:

```typescript
import { Migration } from '@mikro-orm/migrations';

export class Migration20191019195930 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}
```

To support undoing those changed, you can implement the `down` method, which throws an error by default. 

Migrations are by default wrapped in a transaction. You can override this behaviour on 
per migration basis by implementing the `isTransactional(): boolean` method.

`Configuration` object and driver instance are available in the `Migration` class context.

You can execute queries in the migration via `Migration.execute()` method, which 
will run queries in the same transaction as the rest of the migration. The 
`Migration.addSql()` method also accepts instances of knex. Knex instance can be 
accessed via `Migration.getKnex()`; 

## Initial migration

If you want to start using migrations, and you already have the schema generated, 
you can do so by creating so called initial migration:

> Initial migration can be created only if there are no migrations previously
> generated or executed. 

```sh
npx mikro-orm migration:create --initial
```

This will create the initial migration, containing the schema dump from 
`schema:create` command. The migration will be automatically marked as executed. 

## Snapshots

Creating new migration will automatically save the target schema snapshot into 
migrations folder. This snapshot will be then used if you try to create new migration,
instead of using current database schema. This means that if we try to create new 
migration before we run the pending ones, we still get the right schema diff.

> Snapshots should be versioned just like the regular migration files.

Snapshotting can be disabled via `migrations.snapshot: false` in the ORM config.

## Configuration

```typescript
await MikroORM.init({
  // default values:
  migrations: {
    tableName: 'mikro_orm_migrations', // name of database table with log of executed transactions
    path: './migrations', // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[jt]s$/, // regex pattern for the migration files
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

## Using custom `MigrationGenerator`

When we generate new migrations, `MigrationGenerator` class is responsible for 
generating the file contents. We can provide our own implementation to do things 
like formatting the SQL statement. 

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
npx mikro-orm migration:pending  # List all pending migrations
npx mikro-orm migration:fresh    # Drop the database and migrate up to the latest version
```

> To create blank migration file, we can use 
> `npx mikro-orm migration:create --blank`.

For `migration:up` and `migration:down` commands you can specify `--from` (`-f`), `--to` (`-t`) 
and `--only` (`-o`) options to run only a subset of migrations:

```sh
npx mikro-orm migration:up --from 2019101911 --to 2019102117  # the same as above
npx mikro-orm migration:up --only 2019101923                  # apply a single migration
npx mikro-orm migration:down --to 0                           # migrate down all migrations
```

> To run TS migration files, you will need to [enable `useTsNode` flag](installation.md)
> in your `package.json`.

For the `migration:fresh` command you can specify `--seed` to seed the database after migrating.
```shell
npx mikro-orm migration:fresh --seed              # seed the database with the default database seeder
npx mikro-orm migration:fresh --seed=UsersSeeder  # seed the database with the UsersSeeder
```
> You can specify the default database seeder in the orm config with the key `config.seeder.defaultSeeder`

## Using the Migrator programmatically

Or you can create a simple script where you initialize MikroORM like this:

```typescript title="./migrate.ts"
import { MikroORM } from '@mikro-orm/core';

(async () => {
  const orm = await MikroORM.init({
    dbName: 'your-db-name',
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

In some cases you might want to control the transaction context yourself:

```ts
await orm.em.transactional(async em => {
  await migrator.up({ transaction: em.getTransactionContext() });
});
```

## Importing migrations statically

If you do not want to dynamically import a folder (e.g. when bundling your code with webpack) you can import migrations
directly.

```typescript
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

With the help of (webpacks context module api)[https://webpack.js.org/guides/dependency-management/#context-module-api]
we can dynamically import the migrations making it possible to import all files in a folder.

```typescript
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

## Limitations

### MySQL

There is no way to rollback DDL changes in MySQL. An implicit commit is forced for those 
queries automatically, so transactions are not working as expected. 

- https://github.com/mikro-orm/mikro-orm/issues/217
- https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html

[&larr; Back to table of contents](index.md#table-of-contents)
