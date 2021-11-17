---
title: Separating Concerns using Embeddables
sidebar_label: Embeddables
---

> Support for embeddables was added in version 4.0

Embeddables are classes which are not entities themselves, but are embedded in 
entities and can also be queried. You'll mostly want to use them to reduce 
duplication or separating concerns. Value objects such as date range or address 
are the primary use case for this feature.

> Embeddables needs to be discovered just like regular entities, don't forget to 
> add them to the list of entities when initializing the ORM.

Embeddables can contain properties with basic `@Property()` mapping, nested 
`@Embedded()` properties or arrays of `@Embedded()` properties. From version
5.0 we can also use `@ManyToOne()` properties.

For the purposes of this tutorial, we will assume that you have a `User` class in 
your application and you would like to store an address in the `User` class. We will 
model the `Address` class as an embeddable instead of simply adding the respective 
columns to the `User` class.

```typescript
@Entity()
export class User {

  @Embedded()
  address!: Address;

}

@Embeddable()
export class Address {
  
  @Property()
  street!: string;

  @Property()
  postalCode!: string;

  @Property()
  city!: string;

  @Property()
  country!: string;

}
```

> When using ReflectMetadataProvider, you might need to provide the class in decorator options:
> `@Embedded(() => Address)` or `@Embedded({ entity: () => Address })`.

In terms of your database schema, MikroORM will automatically inline all columns from 
the `Address` class into the table of the `User` class, just as if you had declared 
them directly there.

## Initializing embeddables

In case all fields in the embeddable are nullable, you might want to initialize the 
embeddable, to avoid getting a null value instead of the embedded object.

```typescript
@Embedded()
address = new Address();
```

## Column Prefixing

By default, MikroORM names your columns by prefixing them, using the value object name.

Following the example above, your columns would be named as `address_street`, 
`address_postal_code`...

You can change this behaviour to meet your needs by changing the `prefix` attribute 
in the `@Embedded()` notation.

The following example shows you how to set your prefix to `myPrefix_`:

```typescript
@Entity()
export class User {

  @Embedded({ prefix: 'myPrefix_' })
  address!: Address;

}
```

To have MikroORM drop the prefix and use the value object's property name directly, 
set `prefix: false`:

```typescript
@Entity()
export class User {

  @Embedded({ entity: () => Address, prefix: false })
  address!: Address;

}
```

## Storing embeddables as objects

From MikroORM v4.2 we can also store the embeddable as an object instead of
inlining its properties to the owing entity.

```ts
@Entity()
export class User {

  @Embedded({ entity: () => Address, object: true })
  address!: Address;

}
```

In SQL drivers, this will use a JSON column to store the value. 

> Only MySQL and PostgreSQL drivers support searching by JSON properties currently.

> This part of documentation is highly inspired by [doctrine tutorial](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/tutorials/embeddables.html)
> as the behaviour here is pretty much the same.

## Array of embeddables

Embedded arrays are always stored as JSON. It is possible to use them inside
nested embeddables. 

```ts
  @Embedded(() => Address, { array: true })
  addresses: Address[] = [];
```

## Nested embeddables

Starting with v4.4, we can also nest embeddables, both in inline mode and object mode:

```ts
@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile, { object: true, nullable: true })
  profile?: Profile;

}

@Embeddable()
class Profile {

  @Property()
  username: string;

  @Embedded(() => Identity)
  identity: Identity;

  constructor(username: string, identity: Identity) {
    this.username = username;
    this.identity = identity;
  }

}

@Embeddable()
class Identity {

  @Property()
  email: string;

  constructor(email: string) {
    this.email = email;
  }

}
```

## Polymorphic embeddables

Since v5, it is also possible to use polymorphic embeddables. This means we
can define multiple classes for a single embedded property and the right one
will be used based on the discriminator column, similar to how single table 
inheritance work.

```ts
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class Animal {

  @Enum(() => AnimalType)
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
class Cat extends Animal {

  @Property({ nullable: true })
  canMeow?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
class Dog extends Animal {

  @Property({ nullable: true })
  canBark?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

}
```
