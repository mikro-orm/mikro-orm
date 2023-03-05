---
title: Composite and Foreign Keys as Primary Key
sidebar_label: Composite Primary Keys
---

> Support for composite keys was added in version 3.5

MikroORM supports composite primary keys natively. Composite keys are a very powerful relational database concept and we took good care to make sure MikroORM supports as many of the composite primary key use-cases. MikroORM supports composite keys of primitive data-types as well as foreign keys as primary keys. You can also use your composite key entities in relationships.

This section shows how the semantics of composite primary keys work and how they map to the database.

## General Considerations

ID fields have to have their values set before you call `em.persist(entity)`.

## Primitive Types only

Suppose you want to create a database of cars and use the model-name and year of production as primary keys:

```ts
@Entity()
export class Car {

  @PrimaryKey()
  name: string;

  @PrimaryKey()
  year: number;

  [PrimaryKeyType]?: [string, number]; // this is needed for proper type checks in `FilterQuery`

  constructor(name: string, year: number) {
    this.name = name;
    this.year = year;
  }

}
```

Now you can use this entity:

```ts
const car = new Car('Audi A8', 2010);
await em.persistAndFlush(car);
```

And for querying you need to provide all primary keys in the condition or an array of primary keys in the same order as the keys were defined:

```ts
const audi1 = await em.findOneOrFail(Car, { name: 'Audi A8', year: 2010 });
const audi2 = await em.findOneOrFail(Car, ['Audi A8', 2010]);
```

> If we want to use the second approach with primary key tuple, we will need to specify the type of entity's primary key via `PrimaryKeyType` symbol as shown in the `Car` entity.

> `PrimaryKeyType` is not needed when your entity has single scalar primary key under one of following property names: `id: number | string | bigint`, `_id: any` or `uuid: string`.

You can also use this entity in associations. MikroORM will then generate two foreign keys one for name and to year to the related entities.

This example shows how you can nicely solve the requirement for existing values before `em.persist()`: By adding them as mandatory values for the constructor.

## Identity through foreign Entities

There are tons of use-cases where the identity of an Entity should be determined by the entity of one or many parent entities.

- Dynamic Attributes of an Entity (for example `Article`). Each Article has many attributes with primary key `article_id` and `attribute_name`.
- `Address` object of a `Person`, the primary key of the address is `user_id`. This is not a case of a composite primary key, but the identity is derived through a foreign entity and a foreign key.
- Pivot Tables with metadata can be modelled as Entity, for example connections between two articles with a little description and a score.

The semantics of mapping identity through foreign entities are easy:

- Only allowed on `@ManyToOnes` or `@OneToOne` associations.
- Use `primary: true` in the decorator.

## Use-Case 1: Dynamic Attributes

We keep up the example of an Article with arbitrary attributes, the mapping looks like this:

```ts
@Entity()
export class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => ArticleAttribute, attr => attr.article, { cascade: Cascade.ALL })
  attributes = new Collection<ArticleAttribute>(this);

}

@Entity()
export class ArticleAttribute {

  @ManyToOne({ primary: true })
  article: Article;

  @PrimaryKey()
  attribute: string;

  @Property()
  value!: string;

  [PrimaryKeyType]?: [number, string]; // this is needed for proper type checks in `FilterQuery`

  constructor(name: string, value: string, article: Article) {
    this.attribute = name;
    this.value = value;
    this.article = article;
  }

}
```

## Use-Case 2: Simple Derived Identity

Sometimes you have the requirement that two objects are related by a `@OneToOne` association and that the dependent class should re-use the primary key of the class it depends on. One good example for this is a user-address relationship:

```ts
@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Address, address => address.user, { cascade: [Cascade.ALL] })
  address?: Address; // virtual property (inverse side) to allow querying the relation

}

@Entity()
export class Address {

  @OneToOne({ primary: true })
  user!: User;

  [PrimaryKeyType]?: number; // this is needed for proper type checks in `FilterQuery`

}
```

## Use-Case 3: Join-Table with Metadata

In the classic order product shop example there is the concept of the order item which contains references to order and product and additional data such as the amount of products purchased and maybe even the current price.

```ts
@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  customer: Customer;

  @OneToMany(() => OrderItem, item => item.order)
  items = new Collection<OrderItem>(this);

  @Property()
  paid = false;

  @Property()
  shipped = false;

  @Property()
  created = new Date();

  constructor(customer: Customer) {
    this.customer = customer;
  }

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  currentPrice!: number;

}

@Entity()
export class OrderItem {

  @ManyToOne({ primary: true })
  order: Order;

  @ManyToOne({ primary: true })
  product: Product;

  @Property()
  amount = 1;

  @Property()
  offeredPrice: number;

  [PrimaryKeyType]?: [number, number]; // this is needed for proper type checks in `FilterQuery`

  constructor(order: Order, product: Product, amount = 1) {
    this.order = order;
    this.product = product;
    this.offeredPrice = product.currentPrice;
  }

}
```

:::info By default, a generated pivot table entity is used under the hood to represent the pivot table. Since v5.1 we can provide our own implementation via `pivotEntity` option.

The pivot table entity needs to have exactly two many-to-one properties, where first one needs to point to the owning entity and the second to the target entity of the many-to-many relation.

```ts
@Entity()
export class Order {

  @ManyToMany({ entity: () => Product, pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

}
```

If we want to add new items to such M:N collection, we need to have all non-FK properties to define a database level default value.

```ts
@Entity()
export class OrderItem {

  @ManyToOne({ primary: true })
  order: Order;

  @ManyToOne({ primary: true })
  product: Product;

  @Property({ default: 1 })
  amount!: number;

}
```

Alternatively, we can work with the pivot entity directly:

```ts
// create new item
const item = em.create(OrderItem, {
  order: 123,
  product: 321,
  amount: 999,
});
await em.persist(item).flush();

// or remove an item via delete query
const em.nativeDelete(OrderItem, { order: 123, product: 321 });
```

We can as well define the 1:m properties targeting the pivot entity as in the previous example, and use that for modifying the collection, while using the M:N property for easier reading and filtering purposes. :::

## Using QueryBuilder with composite keys

Internally composite keys are represented as tuples, containing all the values in the same order as the primary keys were defined.

```ts
const qb1 = em.createQueryBuilder(CarOwner);
qb1.select('*').where({ car: { name: 'Audi A8', year: 2010 } });
console.log(qb1.getQuery());  // select `e0`.* from `car_owner` as `e0` where `e0`.`name` = ? and `e0`.`year` = ?

const qb2 = em.createQueryBuilder(CarOwner);
qb2.select('*').where({ car: ['Audi A8', 2010] });
console.log(qb2.getQuery());  // 'select `e0`.* from `car_owner` as `e0` where (`e0`.`car_name`, `e0`.`car_year`) = (?, ?)'

const qb3 = em.createQueryBuilder(CarOwner);
qb3.select('*').where({ car: [['Audi A8', 2010]] });
console.log(qb3.getQuery());  // 'select `e0`.* from `car_owner` as `e0` where (`e0`.`car_name`, `e0`.`car_year`) in ((?, ?))'
```

This also applies when you want to get a reference to entity with composite key:

```ts
const ref = em.getReference(Car, ['Audi A8', 2010]);
console.log(ref instanceof Car); // true
```

> This part of documentation is highly inspired by [doctrine tutorial](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/tutorials/composite-primary-keys.html) as the behaviour here is pretty much the same.
