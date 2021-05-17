---
title: Decorators
---

## Entity Definition

### @Entity()

`@Entity` decorator is used to mark your model classes as entities. Do not use it for 
abstract base classes.

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `tableName` | `string` | yes | Override default collection/table name. |
| `collection` | `string` | yes | Alias for `tableName`. |
| `schema` | `string` | yes | Override default connection schema name. |
| `comment` | `string` | yes | Specify comment to table **(SQL only)** |
| `customRepository` | `() => EntityRepository` | yes | Set custom repository class. |

> You can also use `@Repository()` decorator instead of `customRepository` parameter.

```typescript
@Entity({ tableName: 'authors' })
export class Author { ... }
```

## Entity Properties

### @Property()

`@Property()` decorator is used to define regular entity property. All following decorators
extend the `@Property()` decorator, so you can also use its parameters there. 

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `fieldName` | `string` | yes | Override default property name (see [Naming Strategy](naming-strategy.md)). |
| `type` | `string` &#124; `Type` | yes | Explicitly specify the runtime type (see [Metadata Providers](metadata-providers.md) and [Custom Types](custom-types.md)). |
| `onUpdate` | `() => any` | yes | Automatically update the property value every time entity gets updated. |
| `persist` | `boolean` | yes | Set to `false` to define [Shadow Property](serializing.md#shadow-properties). |
| `hidden` | `boolean` | yes | Set to `true` to omit the property when [Serializing](serializing.md). |
| `columnType` | `string` | yes | Specify exact database column type for [Schema Generator](schema-generator.md). **(SQL only)** |
| `length` | `number` | yes | Length/precision of database column, used for `datetime/timestamp/varchar` column types for [Schema Generator](schema-generator.md). **(SQL only)** |
| `default` | `any` | yes | Specify default column value for [Schema Generator](schema-generator.md). **(SQL only)** |
| `unique` | `boolean` | yes | Set column as unique for [Schema Generator](schema-generator.md).. **(SQL only)** |
| `nullable` | `boolean` | yes | Set column as nullable for [Schema Generator](schema-generator.md).. **(SQL only)** |
| `unsigned` | `boolean` | yes | Set column as unsigned for [Schema Generator](schema-generator.md).. **(SQL only)** |
| `comment` | `string` | yes | Specify comment of column for [Schema Generator](schema-generator.md).. **(SQL only)** |
| `version` | `boolean` | yes | Set to true to enable [Optimistic Locking](transactions.md#optimistic-locking). **(SQL only)** |

> You can use property initializers as usual.

```typescript
@Property({ length: 50, fieldName: 'first_name' })
name!: string;

@Property({ columnType: 'datetime', fieldName: 'born_date' })
born?: Date;

@Property({ columnType: 'tinyint' })
age?: number;

@Property({ onUpdate: () => new Date() })
updatedAt = new Date();

@Property()
registered = false;
```

### @PrimaryKey()

`@PrimaryKey()` decorator is used to define entity's unique primary key identifier. 

> `@PrimaryKey()` decorator extend the `@Property()` decorator, so you can use all 
> its parameters.

> Every entity needs to have at least one primary key (see composite primary keys).

> Note that if only one PrimaryKey is set and it's type is number it will be set to auto incremented automatically in all SQL drivers. 

```typescript
@PrimaryKey()
id!: number; // auto increment PK in SQL drivers

@PrimaryKey()
uuid = uuid.v4(); // uuid PK in SQL drivers

@PrimaryKey()
_id!: ObjectId; // ObjectId PK in mongodb driver
```

### @SerializedPrimaryKey()

> Property marked with `@SerializedPrimaryKey()` is virtual, it will not be persisted 
> into the database.

For MongoDB you can define serialized primary key, which will be then used in entity 
serialization via `JSON.stringify()` (through method `entity.toJSON()`).
You will be able to use it to manipulate with the primary key as string. 
 
See [Usage with MongoDB](usage-with-mongo.md) and [Serializing](serializing.md).

```typescript
@PrimaryKey()
_id: ObjectId;

@SerializedPrimaryKey()
id!: string;
```

### @Enum()

> `@Enum()` decorator extend the `@Property()` decorator, so you can use all its 
> parameters.

`@Enum()` decorator can be used for both numeric and string enums. By default enums are 
considered numeric, and will be represented in the database schema as `tinyint/smallint`. 
For string enums, if you define the enum in same file, its values will be automatically 
sniffed. 

See [Defining Entities](defining-entities.md#enums).

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `items` | `number[]` &#124; `string[]` &#124; `() => Dictionary` | yes | Specify enum items explicitly. |

```typescript
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

`@Formula()` decorator can be used to map some SQL snippet to your entity. 
The SQL fragment can be as complex as you want and even include subselects.

See [Defining Entities](defining-entities.md#formulas).

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `formula` | `string` &#124; `() => string` | no | SQL fragment that will be part of the select clause.  |

```typescript
@Formula('obj_length * obj_height * obj_width')
objectVolume?: number;
```

### @Index() and @Unique()

Use `@Index()` to create an index, or `@Unique()` to create unique constraint. You can 
use those decorators both on the entity level and on property level. To create compound
index, use the decorator on the entity level and provide list of property names via the
`properties` option.

See [Defining Entities](defining-entities.md#indexes).

| Parameter    | Type     | Optional | Description |
|--------------|----------|----------|-------------|
| `name`       | `string` | yes      | index name  |
| `properties` | `string` &#124; `string[]` | yes | list of properties, required when using on entity level |
| `type`       | `string` | yes      | index type, not available for `@Unique()` |

```typescript
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
  born?: Date;

}
```

## Entity Relationships

All relationship decorators have `entity`, `cascade` and `eager` optional parameters. 
If you use the default `ReflectMetadataProvider`, then `entity` parameter might be required 
You will be warned about it being not defined while required during discovery process if you 
use `ReflectMetadataProvider`. 

You can also use `type` parameter instead of it - the difference being that `type` parameter
needs to be string, while in `entity` parameter you can provide a reference (wrapped in 
a callback to overcome issues with circular dependencies) to the entity, which plays nice 
with refactoring features in IDEs like WebStorm. 

> If you explicitly provide `entity` as a reference, it will enable type checks for other
> reference parameters like `inversedBy` or `mappedBy`.

### @ManyToOne()

> `@ManyToOne()` decorator extend the `@Property()` decorator, so you can use all 
> its parameters.

Many instances of the current Entity refer to One instance of the referred Entity.

See [Defining Entities](relationships.md#manytoone) for more examples.

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `entity` | `string` &#124; `() => EntityName` | yes | Set target entity type. |
| `cascade` | `Cascade[]` | yes | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](cascading.md)). |
| `eager` | `boolean` | yes | Always load the relationship. |
| `inversedBy` | `(string & keyof T) ` &#124; ` (e: T) => any` | yes | Point to the inverse side property name. |
| `wrappedReference` | `boolean` | yes | Wrap the entity in [`Reference` wrapper](entity-references.md). |
| `primary` | `boolean` | yes | Use this relation as primary key. |
| `onDelete` | `string` | yes | [Referential integrity](cascading.md#declarative-referential-integrity). |
| `onUpdateIntegrity` | `string` | yes | [Referential integrity](cascading.md#declarative-referential-integrity). |

```typescript
@ManyToOne()
author1?: Author; // type taken via reflection (TsMorphMetadataProvider)

@ManyToOne(() => Author) // explicit type
author2?: Author;

@ManyToOne({ entity: () => Author, cascade: [Cascade.ALL] }) // options object
author3?: Author;
```

### @OneToOne()

> `@OneToOne()` decorator extend the `@Property()` decorator, so you can use all 
> its parameters.

One instance of the current Entity refers to One instance of the referred Entity.

See [Defining Entities](relationships.md#onetoone) for more examples, including bi-directional 1:1.

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `entity` | `string` &#124; `() => EntityName` | yes | Set target entity type. |
| `cascade` | `Cascade[]` | yes | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](cascading.md)). |
| `eager` | `boolean` | yes | Always load the relationship. |
| `owner` | `boolean` | yes | Explicitly set as owning side (same as providing `inversedBy`). |
| `inversedBy` | `(string & keyof T) ` &#124; ` (e: T) => any` | yes | Point to the inverse side property name. |
| `mappedBy` | `(string & keyof T)` &#124; `(e: T) => any` | yes | Point to the owning side property name. |
| `wrappedReference` | `boolean` | yes | Wrap the entity in [`Reference` wrapper](entity-references.md). |
| `orphanRemoval` | `boolean` | yes | Remove the entity when it gets disconnected from the relationship (see [Cascading](cascading.md#orphan-removal)). |
| `joinColumn` | `string` | yes | Override default database column name on the owning side (see [Naming Strategy](naming-strategy.md)). |
| `primary` | `boolean` | yes | Use this relation as primary key. |
| `onDelete` | `string` | yes | [Referential integrity](cascading.md#declarative-referential-integrity). |
| `onUpdateIntegrity` | `string` | yes | [Referential integrity](cascading.md#declarative-referential-integrity). |

```typescript
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

> `@OneToMany()` decorator extend the `@Property()` decorator, so you can use all 
> its parameters.

One instance of the current Entity has Many instances (references) to the referred Entity.

See [Defining Entities](relationships.md#onetomany) for more examples, including bi-directional 1:m.

> You need to initialize the value with `Collection<T>` instance.

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `mappedBy` | `(string & keyof T)` &#124; `(e: T) => any` | no | Point to the owning side property name. |
| `entity` | `string` &#124; `() => EntityName` | yes | Set target entity type. |
| `cascade` | `Cascade[]` | yes | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](cascading.md)). |
| `eager` | `boolean` | yes | Always load the relationship. |
| `orphanRemoval` | `boolean` | yes | Remove the entity when it gets disconnected from the connection (see [Cascading](cascading.md#orphan-removal)). |
| `orderBy` | `{ [field: string]: QueryOrder }` | yes | Set default ordering condition. |
| `joinColumn` | `string` | yes | Override default database column name on the owning side (see [Naming Strategy](naming-strategy.md)). |
| `inverseJoinColumn` | `string` | yes | Override default database column name on the inverse side (see [Naming Strategy](naming-strategy.md)). |

```typescript
@OneToMany(() => Book, book => book.author)
books1 = new Collection<Book>(this);

@OneToMany({ mappedBy: 'author', cascade: [Cascade.ALL] })
books2 = new Collection<Book>(this); // target entity type can be read via `TsMorphMetadataProvider` too
```

### @ManyToMany()

> `@ManyToMany()` decorator extend the `@Property()` decorator, so you can use all 
> its parameters.

Many instances of the current Entity refers to Many instances of the referred Entity.

See [Defining Entities](relationships.md#manytomany) for more examples, including bi-directional m:n.

> You need to initialize the value with `Collection<T>` instance.

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `entity` | `string` &#124; `() => EntityName` | yes | Set target entity type. |
| `cascade` | `Cascade[]` | yes | Set what actions on owning entity should be cascaded to the relationship. Defaults to `[Cascade.PERSIST, Cascade.MERGE]` (see [Cascading](cascading.md)). |
| `eager` | `boolean` | yes | Always load the relationship. |
| `owner` | `boolean` | yes | Explicitly set as owning side (same as providing `inversedBy`). |
| `inversedBy` | `(string & keyof T) ` &#124; ` (e: T) => any` | yes | Point to the inverse side property name. |
| `mappedBy` | `(string & keyof T)` &#124; `(e: T) => any` | yes | Point to the owning side property name. |
| `orderBy` | `{ [field: string]: QueryOrder }` | yes | Set default ordering condition. |
| `fixedOrder` | `boolean` | yes | Force stable insertion order of items in the collection (see [Collections](collections.md#forcing-fixed-order-of-collection-items)). |
| `fixedOrderColumn` | `string` | yes | Override default order column name (`id`). |
| `pivotTable` | `string` | yes | Override default name for pivot table (see [Naming Strategy](naming-strategy.md)). |
| `joinColumn` | `string` | yes | Override default database column name on the owning side (see [Naming Strategy](naming-strategy.md)). |
| `inverseJoinColumn` | `string` | yes | Override default database column name on the inverse side (see [Naming Strategy](naming-strategy.md)). |

```typescript
@ManyToMany({ entity: () => BookTag, cascade: [], fixedOrderColumn: 'order' })
tags = new Collection<BookTag>(this); // m:n with autoincrement PK

@ManyToMany(() => BookTag, undefined, { pivotTable: 'book_to_tag_unordered', orderBy: { name: QueryOrder.ASC } })
tagsUnordered = new Collection<BookTag>(this); // m:n with composite PK
```

## Lifecycle Hooks

You can use lifecycle hooks to run some code when entity gets persisted. You can mark any of
entity methods with them, you can also mark multiple methods with same hook.

> All hooks support async methods with one exception - `@OnInit`.

### @OnInit()

Fired when new instance of entity is created, either manually `em.create()`, or 
automatically when new entities are loaded from database

> `@OnInit` is not fired when you create the entity manually via its constructor (`new MyEntity()`)

```typescript
@OnInit()
doStuffOnInit() {
  this.fullName = `${this.firstName} - ${this.lastName}`; // initialize shadow property
}
```

### @BeforeCreate()

Fired right before we persist the new entity into the database.

```typescript
@BeforeCreate()
async doStuffBeforeCreate() {
  // ...
}
```

### @AfterCreate()

Fired right after the new entity is created in the database and merged to identity map. 
Since this event entity will have reference to `EntityManager` and will be 
enabled to call `wrap(entity).init()` method (including all entity references and collections).

```typescript
@AfterCreate()
async doStuffAfterCreate() {
  // ...
}
```

### @BeforeUpdate()

Fired right before we update the entity in the database.

```typescript
@BeforeUpdate()
async doStuffBeforeUpdate() {
  // ...
}
```

### @AfterUpdate()

Fired right after the entity is updated in the database. 

```typescript
@AfterUpdate()
async doStuffAfterUpdate() {
  // ...
}
```

### @BeforeDelete()

Fired right before we delete the record from database. It is fired only when
removing entity or entity reference, not when deleting records by query. 

```typescript
@BeforeDelete()
async doStuffBeforeDelete() {
  // ...
}
```

### @AfterDelete()

Fired right after the record gets deleted from database and it is unset from the identity map.

```typescript
@AfterDelete()
async doStuffAfterDelete() {
  // ...
}
```

## Entity Repository

### @Repository()

Used to register custom entity repository. 

> `em.getRepository()` will automatically return custom repository if it is registered.

```typescript
@Repository(Author)
export class CustomAuthorRepository extends EntityRepository<Author> {
  // your custom methods...
}
```

## Event Subscriber

### @Subscriber()

Used to register an event subscriber. Keep in mind that you need to make sure the file 
gets loaded in order to make this decorator registration work (e.g. you import that file 
explicitly somewhere).

```typescript
@Subscriber()
export class AuthorSubscriber implements EventSubscriber<Author> {
  // ...
}
```
