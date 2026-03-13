# @mikro-orm/seeder

Database seeding support for [MikroORM](https://mikro-orm.io). Provides seeder classes and an entity factory for populating databases with test or default data.

## Installation

```sh
npm install @mikro-orm/seeder
```

## Usage

### Via CLI

```sh
# Run seeders
npx mikro-orm-esm seeder:run

# Create a new seeder class
npx mikro-orm-esm seeder:create DatabaseSeeder
```

### Defining a Seeder

```typescript
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const author = em.create(Author, {
      name: 'John Doe',
      email: 'john@example.com',
    });

    em.create(Book, { title: 'My First Book', author });
  }
}
```

### Using the Entity Factory

```typescript
import { Factory } from '@mikro-orm/seeder';

export class AuthorFactory extends Factory<Author> {
  model = Author;

  definition(): Partial<Author> {
    return {
      name: `Author ${Math.random()}`,
      email: `author-${Math.random()}@example.com`,
    };
  }
}

// In your seeder:
const factory = new AuthorFactory(em);
const authors = factory.make(10); // create 10 Author instances
```

## Features

- Seeder classes for organizing seed data
- Entity factory for generating test data
- Supports calling other seeders for composition
- CLI commands for running and creating seeders
- Works with all supported databases

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/seeding).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
