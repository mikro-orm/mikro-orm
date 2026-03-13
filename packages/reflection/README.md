# @mikro-orm/reflection

[MikroORM](https://mikro-orm.io) metadata provider based on [`ts-morph`](https://www.npmjs.com/package/ts-morph). Extracts property types from TypeScript source files at runtime, allowing you to omit explicit type declarations in decorators.

## Installation

```sh
npm install @mikro-orm/reflection
```

## Usage

Register the `TsMorphMetadataProvider` in your ORM configuration:

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  metadataProvider: TsMorphMetadataProvider,
});
```

With the reflection provider, you can omit explicit type options in your decorators — the provider infers them from the TypeScript source:

```typescript
@Entity()
class Author {
  @PrimaryKey()
  id!: number; // type inferred as 'number'

  @Property()
  name!: string; // type inferred as 'string'

  @ManyToMany(() => Book)
  books = new Collection<Book>(this); // relation type inferred
}
```

> Note: The default SWC-based metadata provider handles most use cases without needing `ts-morph`. This package is only needed for advanced scenarios where SWC metadata is insufficient.

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/metadata-providers).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
