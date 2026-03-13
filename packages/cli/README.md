# @mikro-orm/cli

Command line tool for [MikroORM](https://mikro-orm.io). Provides commands for managing database schema, migrations, seeding, and entity generation.

## Installation

```sh
npm install @mikro-orm/cli
```

## Usage

MikroORM CLI requires a configuration file or a `mikro-orm` section in your `package.json`. The simplest setup:

```sh
# ESM projects (recommended)
npx mikro-orm-esm

# CJS projects
npx mikro-orm
```

## Available Commands

```sh
mikro-orm-esm schema:create    # Create database schema
mikro-orm-esm schema:update    # Update schema to match entities
mikro-orm-esm schema:drop      # Drop database schema

mikro-orm-esm migration:create # Generate migration from schema diff
mikro-orm-esm migration:up     # Run pending migrations
mikro-orm-esm migration:down   # Revert last migration
mikro-orm-esm migration:list   # List executed migrations

mikro-orm-esm seeder:run       # Run database seeders
mikro-orm-esm seeder:create    # Create a new seeder class

mikro-orm-esm generate-entities # Generate entities from database

mikro-orm-esm cache:generate   # Generate metadata cache
mikro-orm-esm cache:clear      # Clear metadata cache
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
