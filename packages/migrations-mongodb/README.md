# @mikro-orm/migrations-mongodb

Database migration support for [MikroORM](https://mikro-orm.io) MongoDB driver. Provides migration generation and execution for MongoDB databases.

## Installation

```sh
npm install @mikro-orm/migrations-mongodb
```

## Usage

### Via CLI

```sh
# Create a blank migration
npx mikro-orm migration:create --blank

# Run pending migrations
npx mikro-orm migration:up

# Revert the last migration
npx mikro-orm migration:down
```

### Programmatic API

```typescript
import { MikroORM } from '@mikro-orm/mongodb';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  clientUrl: 'mongodb://localhost:27017',
  migrations: {
    path: './src/migrations',
  },
});

const migrator = orm.migrator;
await migrator.up();
```

### Writing Migrations

MongoDB migrations use the native MongoDB driver API:

```typescript
import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250101 extends Migration {
  async up(): Promise<void> {
    const collection = this.getCollection('users');
    await collection.updateMany({}, { $set: { active: true } });
  }

  async down(): Promise<void> {
    const collection = this.getCollection('users');
    await collection.updateMany({}, { $unset: { active: '' } });
  }
}
```

## Features

- Migration tracking in a MongoDB collection
- Access to native MongoDB driver API within migrations
- Transactional migration execution (when supported)
- Configurable migration directory and collection name

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/migrations#mongodb-support).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
