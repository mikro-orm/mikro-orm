# @mikro-orm/cli

Command line tool for [MikroORM](https://mikro-orm.io). Provides commands for managing database schema, migrations, seeding, and entity generation.

## Installation

```sh
npm install @mikro-orm/cli
```

## Usage

MikroORM CLI requires a configuration file or a `mikro-orm` section in your `package.json`. The simplest setup:

```sh
npx mikro-orm
```

## Available Commands

```sh
mikro-orm schema:create    # Create database schema
mikro-orm schema:update    # Update schema to match entities
mikro-orm schema:drop      # Drop database schema

mikro-orm migration:create # Generate migration from schema diff
mikro-orm migration:up     # Run pending migrations
mikro-orm migration:down   # Revert last migration
mikro-orm migration:list   # List executed migrations

mikro-orm seeder:run       # Run database seeders
mikro-orm seeder:create    # Create a new seeder class

mikro-orm generate-entities # Generate entities from database

mikro-orm cache:generate   # Generate metadata cache
mikro-orm cache:clear      # Clear metadata cache
```

## Configuration

The CLI looks for configuration in the following order:

1. File specified via `--config` flag
2. `mikro-orm.config.ts` (or `.js`) in the project root
3. `mikro-orm` key in `package.json`

```typescript
// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: [Author, Book],
  dbName: 'my-db',
});
```

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
