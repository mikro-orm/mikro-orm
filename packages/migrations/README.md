# @mikro-orm/migrations

Database migration support for [MikroORM](https://mikro-orm.io) SQL drivers. Provides schema diffing, migration generation, and migration execution.

## Installation

```sh
npm install @mikro-orm/migrations
```

## Usage

### Via CLI

```sh
# Generate a migration based on schema changes
npx mikro-orm migration:create

# Run pending migrations
npx mikro-orm migration:up

# Revert the last migration
npx mikro-orm migration:down
```

### Programmatic API

```typescript
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  migrations: {
    path: './src/migrations',
  },
});

const migrator = orm.migrator;

// Generate a migration from schema diff
await migrator.create();

// Run all pending migrations
await migrator.up();

// Revert the last migration
await migrator.down();
```

## Features

- Automatic schema diffing — generates migrations from entity changes
- Transactional migration execution with rollback support
- Migration snapshots for initial schema creation
- Configurable migration directory, naming, and table name
- Supports both JavaScript and TypeScript migrations

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/migrations).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
