# @mikro-orm/reflection-typescript

[MikroORM](https://mikro-orm.io) metadata provider based on the TypeScript 7 API (experimental). Like `TsMorphMetadataProvider` from [`@mikro-orm/reflection`](https://www.npmjs.com/package/@mikro-orm/reflection), it extracts property types from TypeScript source files at runtime, but it does not depend on `ts-morph` and is several times faster on large projects.

## Installation

```sh
npm install @mikro-orm/reflection-typescript
```

It also needs `typescript` 7.1+, or [`tsrs`](https://github.com/oxc-project/tsrs), a Rust port of the TypeScript 7 checker that ships the same API.

## Usage

Register the `TypeScriptApiMetadataProvider` in your ORM configuration:

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { TypeScriptApiMetadataProvider } from '@mikro-orm/reflection-typescript';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  metadataProvider: TypeScriptApiMetadataProvider, // or TypeScriptApiMetadataProvider.withPackage('tsrs')
});
```

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/metadata-providers).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
