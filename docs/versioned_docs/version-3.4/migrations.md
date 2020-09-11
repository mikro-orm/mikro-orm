---
title: Migrations
---

MikroORM has integrated support for migrations via [umzug](https://github.com/sequelize/umzug).
It allows you to generate migrations with current schema differences.

By default, each migration will be all executed inside a transaction, and all of them will 
be wrapped in one master transaction, so if one of them fails, everything will be rolled back. 

## Migration class

Migrations are classes that extend Migration abstract class:

```typescript
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

## Configuration

```typescript
await MikroORM.init({
  // default values:
  migrations: {
    tableName: 'mikro_orm_migrations', // name of database table with log of executed transactions
    path: './migrations', // path to the folder with migrations
    transactional: true, // wrap each migration in a transaction
    disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
    allOrNothing: true, // wrap all migrations in master transaction
    emit: 'ts', // migration generation mode
  },
})
```

## Using via CLI

You can use it via CLI: 

```sh
npx mikro-orm migration:create   # Create new migration with current schema diff
npx mikro-orm migration:up       # Migrate up to the latest version
npx mikro-orm migration:down     # Migrate one step down
npx mikro-orm migration:list     # List all executed migrations
npx mikro-orm migration:pending  # List all pending migrations
```

For `migration:up` and `migration:down` commands you can specify `--from` (`-f`), `--to` (`-t`) 
and `--only` (`-o`) options to run only a subset of migrations:

```sh
npx mikro-orm migration:up --from 2019101911 --to 2019102117  # the same as above
npx mikro-orm migration:up --only 2019101923                  # apply a single migration
npx mikro-orm migration:down --to 0                           # migratee down all migrations
```

> To run TS migration files, you will need to [enable `useTsNode` flag](installation.md) 
> in your `package.json`.

## Using the Migrator programmatically

Or you can create a simple script where you initialize MikroORM like this:

```typescript title="./migrate.ts"
import { MikroORM } from 'mikro-orm';

(async () => {
  const orm = await MikroORM.init({
    dbName: 'your-db-name',
    // ...
  });

  const migrator = orm.getMigrator();
  await migrator.createMigration(); // creates file Migration20191019195930.ts
  await migrator.up(); // runs migrations up to the latest
  await migrator.up('up-to-name'); // runs migrations up to given version
  await migrator.down('down-to-name'); // runs migrations down to given version
  await migrator.down(); // migrates one step down
  await migrator.down({ to: 0 }); // migrates down to the first version

  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```sh
$ ts-node migrate
```

## Limitations

### MySQL

There is no way to rollback DDL changes in MySQL. An implicit commit is forced for those 
queries automatically, so transactions are not working as expected. 

- https://github.com/mikro-orm/mikro-orm/issues/217
- https://dev.mysql.com/doc/refman/5.7/en/implicit-commit.html

[&larr; Back to table of contents](index.md#table-of-contents)
