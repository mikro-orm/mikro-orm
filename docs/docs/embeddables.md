---
title: Separating Concerns using Embeddables
sidebar_label: Embeddables
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

> Support for embeddables was added in version 4.0

Embeddables are classes which are not entities themselves, but are embedded in entities and can also be queried. You'll mostly want to use them to reduce duplication or separating concerns. Value objects such as date range or address are the primary use case for this feature.

> Embeddables needs to be discovered just like regular entities, don't forget to add them to the list of entities when initializing the ORM.

Embeddables can contain properties with basic `@Property()` mapping, nested `@Embedded()` properties or arrays of `@Embedded()` properties. From version 5.0 we can also use `@ManyToOne()` properties.

For the purposes of this tutorial, we will assume that you have a `User` class in your application and you would like to store an address in the `User` class. We will model the `Address` class as an embeddable instead of simply adding the respective columns to the `User` class.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

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

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Address)
  address!: Address;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

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

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Embedded()
  address!: Address;

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
import { EntitySchema } from '@mikro-orm/core';

export class Address {
  street!: string;
  postalCode!: string;
  city!: string;
  country!: string;
}

export class User {
  id!: number;
  address!: Address;
}

export const UserSchema = new EntitySchema({
  class: User,
  properties: {
    id: { primary: true, type: 'number' },
    address: { reference: 'embedded', entity: 'Address' },
  },
});

export const AddressSchema = new EntitySchema({
  class: Address,
  embeddable: true,
  properties: {
    street: { type: 'string' },
    postalCode: { type: 'string' },
    city: { type: 'string' },
    country: { type: 'string' },
  },
});
```

  </TabItem>
</Tabs>

> When using ReflectMetadataProvider, you might need to provide the class in decorator options: `@Embedded(() => Address)` or `@Embedded({ entity: () => Address })`.

In terms of your database schema, MikroORM will automatically inline all columns from the `Address` class into the table of the `User` class, just as if you had declared them directly there.

## Initializing embeddables

In case all fields in the embeddable are nullable, you might want to initialize the embeddable, to avoid getting a null value instead of the embedded object.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Embedded(() => Address)
address = new Address();
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Embedded()
address = new Address();
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
address: { reference: 'embedded', entity: 'Address', onCreate: () => new Address() },
```

  </TabItem>
</Tabs>

## Column Prefixing

By default, MikroORM names your columns by prefixing them, using the value object name.

Following the example above, your columns would be named as `address_street`, `address_postal_code`...

You can change this behaviour to meet your needs by changing the `prefix` attribute in the `@Embedded()` notation.

The following example shows you how to set your prefix to `myPrefix_`:

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @Embedded(() => Address, { prefix: 'myPrefix_' })
  address!: Address;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @Embedded({ prefix: 'myPrefix_' })
  address!: Address;

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
address: { reference: 'embedded', entity: 'Address', prefix: 'myPrefix_' },
```

  </TabItem>
</Tabs>

To have MikroORM drop the prefix and use the value object's property name directly, set `prefix: false`:

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Embedded({ entity: () => Address, prefix: false })
address!: Address;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Embedded({ prefix: false })
address!: Address;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"@Entity()
address: { reference: 'embedded', entity: 'Address', prefix: false },
```

  </TabItem>
</Tabs>

## Storing embeddables as objects

From MikroORM v4.2 we can also store the embeddable as an object instead of inlining its properties to the owing entity.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Embedded({ entity: () => Address, object: true })
address!: Address;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Embedded({ object: true })
address!: Address;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
address: { reference: 'embedded', entity: 'Address', object: true },
```

  </TabItem>
</Tabs>

In SQL drivers, this will use a JSON column to store the value.

> Only MySQL and PostgreSQL drivers support searching by JSON properties currently.

> This part of documentation is highly inspired by [doctrine tutorial](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/tutorials/embeddables.html) as the behaviour here is pretty much the same.

## Array of embeddables

Embedded arrays are always stored as JSON. It is possible to use them inside nested embeddables.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Embedded(() => Address, { array: true })
addresses: Address[] = [];
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Embedded()
addresses: Address[] = [];
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
address: { reference: 'embedded', entity: 'Address', onCreate: () => [], array: true },
```

  </TabItem>
</Tabs>

## Nested embeddables

Starting with v4.4, we can also nest embeddables, both in inline mode and object mode:

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile, { object: true, nullable: true })
  profile?: Profile;

}

@Embeddable()
export class Profile {

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
export class Identity {

  @Property()
  email: string;

  constructor(email: string) {
    this.email = email;
  }

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded({ object: true })
  profile?: Profile;

}

@Embeddable()
export class Profile {

  @Property()
  username: string;

  @Embedded()
  identity: Identity;

  constructor(username: string, identity: Identity) {
    this.username = username;
    this.identity = identity;
  }

}

@Embeddable()
export class Identity {

  @Property()
  email: string;

  constructor(email: string) {
    this.email = email;
  }

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
import { EntitySchema } from '@mikro-orm/core';

export class User {
  id!: number;
  name!: string;
  profile?: Profile;
}

export class Profile {
  constructor(
    public username: string,
    public identity: Identity,
  ) {}
}

export class Identity {
  constructor(public email: string) {}
}

export const UserSchema = new EntitySchema({
  class: User,
  properties: {
    id: { primary: true, type: 'number' },
    name: { type: 'string' },
    address: { reference: 'embedded', entity: 'Address' },
  },
});

export const ProfileSchema = new EntitySchema({
  class: Profile,
  embeddable: true,
  properties: {
    username: { type: 'string' },
    identity: { reference: 'embedded', entity: 'Identity' },
  },
});

export const IdentitySchema = new EntitySchema({
  class: Identity,
  embeddable: true,
  properties: {
    email: { type: 'string' },
  },
});
```

  </TabItem>
</Tabs>

## Polymorphic embeddables

Since v5, it is also possible to use polymorphic embeddables. This means we can define multiple classes for a single embedded property and the right one will be used based on the discriminator column, similar to how single table inheritance work.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

export enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class Animal {

  @Enum(() => AnimalType)
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
export class Cat extends Animal {

  @Property({ nullable: true })
  canMeow?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
export class Dog extends Animal {

  @Property({ nullable: true })
  canBark?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
export class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

export enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class Animal {

  @Enum()
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
export class Cat extends Animal {

  @Property()
  canMeow? = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
export class Dog extends Animal {

  @Property()
  canBark? = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
export class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded()
  pet!: Cat | Dog;

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
import { EntitySchema } from '@mikro-orm/core';

export enum AnimalType {
  CAT,
  DOG,
}

export abstract class Animal {
  type!: AnimalType;
  name!: string;
}

export class Cat extends Animal {
  canMeow? = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }
}

export class Dog extends Animal {
  canBark? = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }
}

@Entity()
export class Owner {
  id!: number;
  name!: string;
  pet!: Cat | Dog;
}

export const AnimalSchema = new EntitySchema({
  class: Animal,
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    username: { type: 'string' },
    identity: { reference: 'embedded', entity: 'Identity' },
  },
});

export const CatSchema = new EntitySchema({
  class: Cat,
  embeddable: true,
  extends: 'Animal',
  discriminatorValue: AnimalType.CAT,
  properties: {
    canMeow: { type: 'boolean', nullable: true },
  },
});

export const DogSchema = new EntitySchema({
  class: Dog,
  embeddable: true,
  extends: 'Animal',
  discriminatorValue: AnimalType.DOG,
  properties: {
    canBark: { type: 'boolean', nullable: true },
  },
});

export const OwnerSchema = new EntitySchema({
  class: Owner,
  properties: {
    id: { primary: true, type: 'number' },
    name: { type: 'string' },
    address: { reference: 'embedded', entity: 'Cat | Dog' },
  },
});
```

  </TabItem>
</Tabs>
