# @mikro-orm/entity-generator

Entity generator for [MikroORM](https://mikro-orm.io). Generates entity definitions from an existing database schema, supporting both decorator-based and `defineEntity`-based output.

## Installation

```sh
npm install @mikro-orm/entity-generator
```

## Usage

### Via CLI

```sh
npx mikro-orm generate-entities --save --path=./src/entities
```

### Programmatic API

```typescript
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({ ... });
const generator = orm.entityGenerator;

// Generate entity files from the current database schema
const dump = await generator.generate({
  save: true,
  path: './src/entities',
});
```

## Features

- Generates entities from any supported SQL or MongoDB database
- Output formats: `defineEntity` helper (default), decorators, or `EntitySchema`
- Detects and generates relations, indexes, enums, and embeddables
- Configurable naming conventions and output options
- Bidirectional relation generation with `Ref` wrapper support

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/entity-generator).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
