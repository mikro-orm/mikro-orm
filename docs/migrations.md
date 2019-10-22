---
---

# Migrations

To generate entities from existing database schema, you can use `Migrator` helper. It uses 
[umzug](https://github.com/sequelize/umzug) under the hood.

## Migration class

Migrations are classes that extend Migration abstract class:

```typescript
export class Migration20191019195930 extends Migration {

  async up(): Promise<void> {
    this.addSql('select 1 + 1');
  }

}
```

To support migrating back, you can implement `down` method, which by default throws an error. 

Transactions are by default wrapped in a transactions. You can override this behaviour on 
per transaction basis by implementing `isTransactional(): boolean` method.

`Configuration` object and driver instance are available in the `Migration` class context.

## Configuration

```typescript
await MikroORM.init({
  // default values:
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './migrations',
    transactional: true,
    disableForeignKeys: true,
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

Or you can create simple script where you initialize MikroORM like this:

**`./migrate.ts`**

```typescript
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

[&larr; Back to table of contents](index.md#table-of-contents)
