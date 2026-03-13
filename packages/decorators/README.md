# @mikro-orm/decorators

Decorator definitions for [MikroORM](https://mikro-orm.io) entity mapping. Provides both legacy (TypeScript experimental) and ES spec decorator definitions for defining entities, properties, and relations.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/decorators
```

> Note: `@mikro-orm/core` re-exports all decorators, so you only need to install this package directly if you want to use decorators without pulling in the full core module.

## Usage

```typescript
import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}
```

### ES Spec Decorators

For projects using the TC39 standard decorators (TypeScript 5.0+):

```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators';
```

### Legacy Decorators

For projects using TypeScript experimental decorators:

```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
```

## Available Decorators

- **Entity**: `@Entity()` — marks a class as a persistent entity
- **Properties**: `@Property()`, `@Enum()`, `@Formula()`, `@Index()`, `@Unique()`, `@Check()`
- **Primary keys**: `@PrimaryKey()`, `@SerializedPrimaryKey()`
- **Relations**: `@ManyToOne()`, `@OneToMany()`, `@ManyToMany()`, `@OneToOne()`
- **Embeddables**: `@Embeddable()`, `@Embedded()`
- **Lifecycle hooks**: `@BeforeCreate()`, `@AfterCreate()`, `@BeforeUpdate()`, `@AfterUpdate()`, `@BeforeDelete()`, `@AfterDelete()`

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/decorators) and the [using decorators guide](https://mikro-orm.io/docs/using-decorators).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
