# @mikro-orm/knex-compat

Knex compatibility layer for [MikroORM](https://mikro-orm.io). Provides a `raw` helper that accepts knex `QueryBuilder` and `Raw` instances, converting them into MikroORM `RawQueryFragment` objects for use with the MikroORM query builder.

## Installation

```sh
npm install @mikro-orm/knex-compat knex
```

> `knex` is a peer dependency — you need to install it separately.

## Usage

Use the `raw` helper from this package to pass knex query builder or `knex.raw()` instances into MikroORM queries:

```typescript
import { raw } from '@mikro-orm/knex-compat';
import knex from 'knex';

const k = knex({ client: 'pg' });

// Pass a knex.raw() instance
await em.find(User, { [raw(k.raw('lower(name)'))]: name.toLowerCase() });

// Pass a knex QueryBuilder instance
const subquery = k('book').count('*').where('author_id', k.raw('??', ['author.id']));
await em.find(Author, { [raw(subquery)]: { $gt: 5 } });
```

> Note: For plain string SQL fragments (without knex), use the `raw()` helper from `@mikro-orm/core` directly. This compatibility package is only needed when you have existing knex expressions to integrate.

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/raw-queries).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
