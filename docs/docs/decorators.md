---
title: Decorators
---

## Entity Definition

> Some options affect how the [Schema Generator](schema-generator.md) works, and those are SQL only, meaning they affect only SQL drivers - whereas, mongo has no schema.

### @Entity()

`@Entity` decorator is used to mark your model classes as entities. Do not use it for abstract base classes.

| Parameter             | Type                     | Optional | Description                                                                        |
|-----------------------|--------------------------|----------|------------------------------------------------------------------------------------|
| `tableName`           | `string`                 | yes      | Override default collection/table name.                                            |
| `schema`              | `string`                 | yes      | Sets the schema name.                                                              |
| `collection`          | `string`                 | yes      | Alias for `tableName`.                                                             |
| `comment`             | `string`                 | yes      | Specify comment to table. **(SQL only)**                                           |
| `repository`          | `() => EntityRepository` | yes      | Set [custom repository class](./repositories.md#custom-repository).                |
| `discriminatorColumn` | `string`                 | yes      | For [Single Table Inheritance](./inheritance-mapping.md#single-table-inheritance). |
| `discriminatorMap`    | `Dictionary<string>`     | yes      | For [Single Table Inheritance](./inheritance-mapping.md#single-table-inheritance). |
| `discriminatorValue`  | `number` &#124; `string` | yes      | For [Single Table Inheritance](./inheritance-mapping.md#single-table-inheritance). |
| `forceConstructor`    | `boolean`                | yes      | Enforce use of constructor when creating managed entity instances                  |
| `abstract`            | `boolean`                | yes      | Marks entity as abstract, such entities are inlined during discovery.              |
| `readonly`            | `boolean`                | yes      | Disables change tracking - such entities are ignored during flush.                 |

```ts
@Entity({ tableName: 'authors' })
export class Author { ... }
```

## Entity Properties

### @Property()

`@Property()` decorator is used to define regular entity property. All following decorators extend the `@Property()` decorator, so you can also use its parameters there.

| Parameter          | Type                                              | Optional | Description                                                                                                                                                                                                                                                                                                                                                     |
|--------------------|---------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `fieldName`        | `string`                                          | yes      | Override default property name (see [Naming Strategy](./naming-strategy.md)).                                                                                                                                                                                                                                                                                   |
| `type`             | `string` &#124; `Constructor<Type>` &#124; `Type` | yes      | Explicitly specify the property type. This value is mapped based on the current driver (see [Metadata Providers](./metadata-providers.md) and [Custom Types](./custom-types.md)).                                                                                                                                                                               |
| `runtimeType`      | `string`                                          | yes      | Runtime type of the property. This is the JS type that your property is mapped to, e.g. `string` or `number`, and is normally inferred automatically via `reflect-metadata`. In some cases, the inference won't work, and you might need to specify the `runtimeType` explicitly - the most common one is when you use a union type with null like `foo: number \| null`.                                                                                                |
| `returning`        | `boolean`                                         | yes      | Whether this property should be part of `returning` clause. Works only in PostgreSQL and SQLite drivers.                                                                                                                                                                                                                                                        |
| `onUpdate`         | `() => any`                                       | yes      | Automatically update the property value every time entity gets updated.                                                                                                                                                                                                                                                                                         |
| `persist`          | `boolean`                                         | yes      | Set to `false` to define [Shadow Property](serializing.md#shadow-properties).                                                                                                                                                                                                                                                                                   |
| `hydrate`          | `boolean`                                         | yes      | Set to `false` to disable hydration of this property. Useful for persisted getters.                                                                                                                                                                                                                                                                             |
| `hidden`           | `boolean`                                         | yes      | Set to `true` to omit the property when [Serializing](serializing.md).                                                                                                                                                                                                                                                                                          |
| `groups`           | `string[]`                                        | yes      | Specify serialization groups for [explicit serialization](serializing.md#explicit-serialization). If a property does not specify any group, it will be included, otherwise only properties with a matching group are included.                                                                                                                                  |
| `columnType`       | `string`                                          | yes      | Specify exact database column type for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                  |
| `length`           | `number`                                          | yes      | Length/precision of database column, used for `datetime/timestamp/varchar` column types for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                             |
| `default`          | `any`                                             | yes      | Specify default column value for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                        |
| `unique`           | `boolean`                                         | yes      | Set column as unique for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                                |
| `nullable`         | `boolean`                                         | yes      | Set column as nullable for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                              |
| `unsigned`         | `boolean`                                         | yes      | Set column as unsigned for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                              |
| `comment`          | `string`                                          | yes      | Specify comment of column for [Schema Generator](schema-generator.md). **(SQL only)**                                                                                                                                                                                                                                                                           |
| `version`          | `boolean`                                         | yes      | Set to true to enable [Optimistic Locking](transactions.md#optimistic-locking) via version field. **(SQL only)**                                                                                                                                                                                                                                                |
| `concurrencyCheck` | `boolean`                                         | yes      | Set to true to enable [Concurrency Check](transactions.md#concurrency-checks) via concurrency fields.                                                                                                                                                                                                                                                           |
| `customOrder`      | `string[]` &#124; `number[]` &#124; `boolean[]`   | yes      | Specify a custom order for the column. **(SQL only)**                                                                                                                                                                                                                                                                                                           |

> You can use property initializers as usual.

```ts
@Property({ length: 50, fieldName: 'first_name' })
name!: string;

@Property({ type: 'date', fieldName: 'born_date' })
born?: string;

@Property({ columnType: 'tinyint' })
age?: number;

@Property({ onUpdate: () => new Date() })
updatedAt = new Date();

@Property()
registered = false;
```

### @PrimaryKey()

`@PrimaryKey()` decorator is used to define entity's unique primary key identifier.

> `@PrimaryKey()` decorator extend the `@Property()` decorator, so you can use all its parameters.

> Every entity needs to have at least one primary key (see composite primary keys).

> Note that if only one PrimaryKey is set, and it's type is number it will be set to auto incremented automatically in all SQL drivers.

```ts
@PrimaryKey()
id!: number; // auto increment PK in SQL drivers

@PrimaryKey({ autoincrement: false })
id!: number; // numeric PK without auto increment

@PrimaryKey()
uuid: string = uuid.v4(); // uuid PK in SQL drivers

@PrimaryKey()
_id!: ObjectId; // ObjectId PK in mongodb driver
```

### @SerializedPrimaryKey()

> Property marked with `@SerializedPrimaryKey()` is virtual, it will not be persisted into the database.

For MongoDB, you can define serialized primary key, which will be then used in entity serialization via `JSON.stringify()` (through method `entity.toJSON()`). You will be able to use it to manipulate with the primary key as string.

See [Usage with MongoDB](./usage-with-mongo.md) and [Serializing](serializing.md).

```ts
@PrimaryKey()
_id: ObjectId;

@SerializedPrimaryKey()
id!: string;
```

### @Enum()

> `@Enum()` decorator extend the `@Property()` decorator, so you can use all its parameters.

`@Enum()` decorator can be used for both numeric and string enums. By default, enums are considered numeric, and will be represented in the database schema as `tinyint/smallint`. For string enums, if you define the enum in same file, its values will be automatically sniffed.

See [Defining Entities](./defining-entities.md#enums).

| Parameter | Type                                                   | Optional | Description                    |
|-----------|--------------------------------------------------------|----------|--------------------------------|
| `items`   | `number[]` &#124; `string[]` &#124; `() => Dictionary` | yes      | Specify enum items explicitly. |

```ts
@Enum() // with ts-morph metadata provider we do not need to specify anything
enum0 = MyEnum1.VALUE_1;

@Enum(() => MyEnum1) // or @Enum({ items: () => MyEnum1 })
enum1 = MyEnum1.VALUE_1;

@Enum({ type: 'MyEnum2', nullable: true })
enum2?: MyEnum2; // MyEnum2 needs to be defined in current file (can be re-exported)

@Enum({ items: [1, 2, 3] })
enum3 = 3;

@Enum({ items: ['a', 'b', 'c'] })
enum4 = 'a';
```

### @Formula()

`@Formula()` decorator can be used to map some SQL snippet to your entity. The SQL fragment can be as complex as you want and even include subselects.

See [Defining Entities](./defining-entities.md#formulas).

| Parameter | Type                           | Optional | Description                                          |
|-----------|--------------------------------|----------|------------------------------------------------------|
| `formula` | `string` &#124; `() => string` | no       | SQL fragment that will be part of the select clause. |

```ts
@Formula('obj_length * obj_height * obj_width')
objectVolume?: number;
```

### @Index() and @Unique()

Use `@Index()` to create an index, or `@Unique()` to create unique constraint. You can use those decorators both on the entity level and on property level. To create compound index, use the decorator on the entity level and provide list of property names via the `properties` option.

See [Defining Entities](./defining-entities.md#indexes).

| Parameter     | Type                          | Optional | Description                                                                                              |
|---------------|-------------------------------|----------|----------------------------------------------------------------------------------------------------------|
| `name`        | `string`                      | yes      | index name                                                                                               |
| `properties`  | `string` &#124; `string[]`    | yes      | list of properties, required when using on entity level                                                  |
| `type`        | `string`                      | yes      | index type, not available for `@Unique()`. Use `fulltext` to enable support for the `$fulltext` operator |
| `deferMode`   | `immediate` &#124; `deferred` | yes      | only for postgres unique constraints                                                                     |

```ts
@Entity()
@Index({ properties: ['name', 'age'] }) // compound index, with generated name
@Index({ name: 'custom_idx_name', properties: ['name'] }) // simple index, with custom name
@Unique({ properties: ['name', 'email'] })
export class Author {

  @Property()
  @Unique()
  email!: string;

  @Index() // generated name
  @Property()
  age?: number;

  @Index({ name: 'born_index' })
  @Property()
  born?: string;

}
```

### @Check()

We can define check constraints via `@Check()` decorator. We can use it either on entity class, or on entity property. It has a required `expression` property, that can be either a string or a callback, that receives map of property names to column names. Note that we need to use the generic type argument if we want TypeScript suggestions for the property names.

> Check constraints are currently supported in PostgreSQL, MySQL 8 and MariaDB drivers. SQLite also supports creating check constraints, but schema inference is currently not implemented. Also note that SQLite does not support adding check constraints to existing tables.

See [Defining Entities](./defining-entities.md#check-constraints).

| Parameter    | Type                            | Optional | Description                                                                          |
|--------------|---------------------------------|----------|--------------------------------------------------------------------------------------|
| `name`       | `string`                        | yes      | constraint name                                                                      |
| `property`   | `string`                        | yes      | property name, only used when generating the constraint name                         |
| `expression` | `string` &#124; `CheckCallback` | no       | constraint definition, can be a callback that gets a map of property to column names |

```ts
@Entity()
// with generated name based on the table name
@Check({ expression: 'price1 >= 0' })
// with explicit name
@Check({ name: 'foo', expression: columns => `${columns.price1} >= 0` })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  price1!: number;

  @Property()
  @Check({ expression: 'price2 >= 0' })
  price2!: number;

  @Property({ check: columns => `${columns.price3} >= 0` })
  price3!: number;

}
```

## Entity Relationships

All relationship decorators have `entity`, `cascade` and `eager` optional parameters. If you use the default `ReflectMetadataProvider`, then `entity` parameter might be required You will be warned about it being not defined while required during discovery process if you use `ReflectMetadataProvider`.

You can also use `type` parameter instead of it - the difference being that `type` parameter needs to be string, while in `entity` parameter you can provide a reference (wrapped in a callback to overcome issues with circular dependencies) to the entity, which plays nice with refactoring features in IDEs like WebStorm.

> If you explicitly provide `entity` as a reference, it will enable type checks for other reference parameters like `inversedBy` or `mappedBy`.

### @ManyToOne()

> `@ManyToOne()` decorator extend the `@Property()` decorator, so you can use all its parameters.

Many instances of the current Entity refer to One instance of the referred Entity.

See [Defining Entities](./relationships.md#manytoone) for more examples.

| Parameter    | Type                                          | Optional | Description                                                                                                                                                 |
|--------------|-----------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`     | `string` &#124; `() => EntityName`            | yes      | Set target entity type.                                                                                                                                     |
| `cascade`    | `Cascade[]`                                   | yes      | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](./cascading.md)). |
| `eager`      | `boolean`                                     | yes      | Always load the relationship. (Discouraged for use with to-many relations.)                                                                                 |
| `inversedBy` | `(string & keyof T) ` &#124; ` (e: T) => any` | yes      | Point to the inverse side property name.                                                                                                                    |
| `ref`        | `boolean`                                     | yes      | Wrap the entity in [`Reference` wrapper](type-safe-relations.md).                                                                                           |
| `primary`    | `boolean`                                     | yes      | Use this relation as primary key.                                                                                                                           |
| `deleteRule` | `string`                                      | yes      | [Referential integrity](./cascading.md#declarative-referential-integrity).                                                                                  |
| `updateRule` | `string`                                      | yes      | [Referential integrity](./cascading.md#declarative-referential-integrity).                                                                                  |
| `deferMode`  | `immediate` &#124; `deferred`                 | yes      | only for postgres unique constraints                                                                                                                        |

```ts
@ManyToOne()
author1?: Author; // type taken via reflection (TsMorphMetadataProvider)

@ManyToOne(() => Author) // explicit type
author2?: Author;

@ManyToOne({ entity: () => Author, cascade: [Cascade.ALL] }) // options object
author3?: Author;
```

### @OneToOne()

> `@OneToOne()` decorator extend the `@Property()` decorator, so you can use all its parameters.

One instance of the current Entity refers to One instance of the referred Entity.

See [Defining Entities](./relationships.md#onetoone) for more examples, including bidirectional 1:1.

| Parameter       | Type                                          | Optional | Description                                                                                                                                                 |
|-----------------|-----------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`        | `string` &#124; `() => EntityName`            | yes      | Set target entity type.                                                                                                                                     |
| `cascade`       | `Cascade[]`                                   | yes      | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](./cascading.md)). |
| `eager`         | `boolean`                                     | yes      | Always load the relationship. (Discouraged for use with to-many relations.)                                                                                 |
| `owner`         | `boolean`                                     | yes      | Explicitly set as owning side (same as providing `inversedBy`).                                                                                             |
| `inversedBy`    | `(string & keyof T) ` &#124; ` (e: T) => any` | yes      | Point to the inverse side property name.                                                                                                                    |
| `mappedBy`      | `(string & keyof T)` &#124; `(e: T) => any`   | yes      | Point to the owning side property name.                                                                                                                     |
| `ref`           | `boolean`                                     | yes      | Wrap the entity in [`Reference` wrapper](type-safe-relations.md).                                                                                           |
| `orphanRemoval` | `boolean`                                     | yes      | Remove the entity when it gets disconnected from the relationship (see [Cascading](./cascading.md#orphan-removal)).                                         |
| `joinColumn`    | `string`                                      | yes      | Override default database column name on the owning side (see [Naming Strategy](./naming-strategy.md)).                                                     |
| `primary`       | `boolean`                                     | yes      | Use this relation as primary key.                                                                                                                           |
| `deleteRule`    | `string`                                      | yes      | [Referential integrity](./cascading.md#declarative-referential-integrity).                                                                                  |
| `updateRule`    | `string`                                      | yes      | [Referential integrity](./cascading.md#declarative-referential-integrity).                                                                                  |
| `deferMode`     | `immediate` &#124; `deferred`                 | yes      | only for postgres unique constraints                                                                                                                        |

```ts
// when none of `owner/inverseBy/mappedBy` is provided, it will be considered owning side
@OneToOne()
bestFriend1!: User;

// side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
@OneToOne({ inversedBy: 'bestFriend1', orphanRemoval: true })
bestFriend2!: User;

// when defining it like this, you need to specifically mark the owning side with `owner: true`
@OneToOne(() => User, user => user.bestFriend2, { owner: true, orphanRemoval: true })
bestFriend3!: User;
```

### @OneToMany()

> `@OneToMany()` decorator extend the `@Property()` decorator, so you can use all its parameters.

One instance of the current Entity has Many instances (references) to the referred Entity.

See [Defining Entities](./relationships.md#onetomany) for more examples, including bidirectional 1:m.

> You need to initialize the value with `Collection<T>` instance.

| Parameter           | Type                                        | Optional | Description                                                                                                                                                 |
|---------------------|---------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `mappedBy`          | `(string & keyof T)` &#124; `(e: T) => any` | no       | Point to the owning side property name.                                                                                                                     |
| `entity`            | `string` &#124; `() => EntityName`          | yes      | Set target entity type.                                                                                                                                     |
| `cascade`           | `Cascade[]`                                 | yes      | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](./cascading.md)). |
| `eager`             | `boolean`                                   | yes      | Always load the relationship. (Discouraged for use with to-many relations.)                                                                                 |
| `orphanRemoval`     | `boolean`                                   | yes      | Remove the entity when it gets disconnected from the connection (see [Cascading](./cascading.md#orphan-removal)).                                           |
| `orderBy`           | `{ [field: string]: QueryOrder }`           | yes      | Set default ordering condition.                                                                                                                             |
| `joinColumn`        | `string`                                    | yes      | Override default database column name on the owning side (see [Naming Strategy](./naming-strategy.md)).                                                     |
| `inverseJoinColumn` | `string`                                    | yes      | Override default database column name on the inverse side (see [Naming Strategy](./naming-strategy.md)).                                                    |

```ts
@OneToMany(() => Book, book => book.author)
books1 = new Collection<Book>(this);

@OneToMany({ mappedBy: 'author', cascade: [Cascade.ALL] })
books2 = new Collection<Book>(this); // target entity type can be read via `TsMorphMetadataProvider` too
```

### @ManyToMany()

> `@ManyToMany()` decorator extend the `@Property()` decorator, so you can use all its parameters.

Many instances of the current Entity refers to Many instances of the referred Entity.

See [Defining Entities](./relationships.md#manytomany) for more examples, including bidirectional m:n.

> You need to initialize the value with `Collection<T>` instance.

| Parameter           | Type                                          | Optional | Description                                                                                                                                                 |
|---------------------|-----------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`            | `string` &#124; `() => EntityName`            | yes      | Set target entity type.                                                                                                                                     |
| `cascade`           | `Cascade[]`                                   | yes      | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](./cascading.md)). |
| `eager`             | `boolean`                                     | yes      | Always load the relationship. (Discouraged for use with to-many relations.)                                                                                 |
| `owner`             | `boolean`                                     | yes      | Explicitly set as owning side (same as providing `inversedBy`).                                                                                             |
| `inversedBy`        | `(string & keyof T) ` &#124; ` (e: T) => any` | yes      | Point to the inverse side property name.                                                                                                                    |
| `mappedBy`          | `(string & keyof T)` &#124; `(e: T) => any`   | yes      | Point to the owning side property name.                                                                                                                     |
| `orderBy`           | `{ [field: string]: QueryOrder }`             | yes      | Set default ordering condition.                                                                                                                             |
| `fixedOrder`        | `boolean`                                     | yes      | Force stable insertion order of items in the collection (see [Collections](./collections.md#forcing-fixed-order-of-collection-items)).                      |
| `fixedOrderColumn`  | `string`                                      | yes      | Override default order column name (`id`).                                                                                                                  |
| `pivotTable`        | `string`                                      | yes      | Override default name for pivot table (see [Naming Strategy](./naming-strategy.md)).                                                                        |
| `joinColumn`        | `string`                                      | yes      | Override default database column name on the owning side (see [Naming Strategy](./naming-strategy.md)).                                                     |
| `inverseJoinColumn` | `string`                                      | yes      | Override default database column name on the inverse side (see [Naming Strategy](./naming-strategy.md)).                                                    |

```ts
@ManyToMany({ entity: () => BookTag, cascade: [], fixedOrderColumn: 'order' })
tags = new Collection<BookTag>(this); // m:n with autoincrement PK

@ManyToMany(() => BookTag, undefined, { pivotTable: 'book_to_tag_unordered', orderBy: { name: QueryOrder.ASC } })
tagsUnordered = new Collection<BookTag>(this); // m:n with composite PK
```

## Lifecycle Hooks

You can use lifecycle hooks to run some code when entity gets persisted. You can mark any of entity methods with them, you can also mark multiple methods with same hook.

> All hooks support async methods with one exception - `@OnInit`.

### @OnInit()

Fired when new instance of entity is created, either manually `em.create()`, or automatically when new entities are loaded from database

> `@OnInit` is not fired when you create the entity manually via its constructor (`new MyEntity()`)

```ts
@OnInit()
doStuffOnInit(args: EventArgs<this>) {
  this.fullName = `${this.firstName} - ${this.lastName}`; // initialize shadow property
}
```

### @OnLoad()

Fired when new entities are loaded from database. Unlike `@InInit()`, this will be fired only for fully loaded entities (not references). The method can be `async`.

```ts
@OnLoad()
async doStuffOnLoad(args: EventArgs<this>) {
  // ...
}
```

### @BeforeCreate()

Fired right before we persist the new entity into the database.

```ts
@BeforeCreate()
async doStuffBeforeCreate(args: EventArgs<this>) {
  // ...
}
```

### @AfterCreate()

Fired right after the new entity is created in the database and merged to identity map. Since this event entity will have reference to `EntityManager` and will be enabled to call `wrap(entity).init()` method (including all entity references and collections).

```ts
@AfterCreate()
async doStuffAfterCreate(args: EventArgs<this>) {
  // ...
}
```

### @BeforeUpdate()

Fired right before we update the entity in the database.

```ts
@BeforeUpdate()
async doStuffBeforeUpdate(args: EventArgs<this>) {
  // ...
}
```

### @AfterUpdate()

Fired right after the entity is updated in the database.

```ts
@AfterUpdate()
async doStuffAfterUpdate(args: EventArgs<this>) {
  // ...
}
```

### @BeforeDelete()

Fired right before we delete the record from database. It is fired only when removing entity or entity reference, not when deleting records by query.

```ts
@BeforeDelete()
async doStuffBeforeDelete(args: EventArgs<this>) {
  // ...
}
```

### @AfterDelete()

Fired right after the record gets deleted from database, and it is unset from the identity map.

```ts
@AfterDelete()
async doStuffAfterDelete(args: EventArgs<this>) {
  // ...
}
```
