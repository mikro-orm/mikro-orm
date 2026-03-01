---
title: Separating Concerns using Embeddables
sidebar_label: Embeddables
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

> Support for embeddables was added in version 4.0

Embeddables are classes which are not entities themselves, but are embedded in entities and can also be queried. You'll mostly want to use them to reduce duplication or separating concerns. Value objects such as date range or address are the primary use case for this feature.

> Embeddables needs to be discovered just like regular entities, don't forget to add them to the list of entities when initializing the ORM.

Embeddables can contain properties with basic `@Property()` mapping, nested `@Embedded()` properties or arrays of `@Embedded()` properties. From version 5.0 you can also use `@ManyToOne()` properties.

For the purposes of this tutorial, let's assume that you have a `User` class in your application, and you would like to store an address in the `User` class. The `Address` class will be modeled as an embeddable instead of simply adding the respective columns to the `User` class.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts
import { defineEntity, p } from '@mikro-orm/core';

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address),
  },
});


export const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    street: p.string(),
    postalCode: p.string(),
    city: p.string(),
    country: p.string(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address),
  },
});

export type IUser = InferEntity<typeof User>;

export const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    street: p.string(),
    postalCode: p.string(),
    city: p.string(),
    country: p.string(),
  },
});

export type IAddress = InferEntity<typeof Address>;
```

  </TabItem>
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
</Tabs>

> When using ReflectMetadataProvider, you might need to provide the class in decorator options: `@Embedded(() => Address)` or `@Embedded({ entity: () => Address })`.

In terms of your database schema, MikroORM will automatically inline all columns from the `Address` class into the table of the `User` class, just as if you had declared them directly there.

## Initializing embeddables

In case all fields in the embeddable are nullable, you might want to initialize the embeddable, to avoid getting a null value instead of the embedded object.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address)
      .onCreate(() => new Address()),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address)
      .onCreate(() => new Address()),
  },
});
```

  </TabItem>
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
</Tabs>

## Column Prefixing

By default, MikroORM names your columns by prefixing them, using the value object name.

Following the example above, your columns would be named as `address_street`, `address_postal_code`...

You can change this behaviour to meet your needs by changing the `prefix` attribute in the `@Embedded()` notation.

The following example shows you how to set your prefix to `myPrefix_`:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).prefix('myPrefix_')
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).prefix('myPrefix_')
  },
});
```

  </TabItem>
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
</Tabs>

You can also decide more precisely how the column name is determined with an explicit prefix. With the example below:

- `relative` mode (default) **concatenates** the prefix with its parent's prefix (if any), naming them `contact_addr2_city`, `contact_addr2_street`, ...
- `absolute` mode sets the prefix at the beginning of the **column**, naming them `addr_city`, `addr_street`, ...

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const ContactSchema = defineEntity({
  name: 'Contact',
  embeddable: true,
  properties: {
    address: () => p.embedded(Address).prefix('addr_').prefixMode('absolute'),
    address2: () => p.embedded(Address).prefix('addr2_').prefixMode('relative'),
  },
});


export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    contact: () => p.embedded(Contact),
  },
});

export class Contact extends ContactSchema.class {}
ContactSchema.setClass(Contact);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const Contact = defineEntity({
  name: 'Contact',
  embeddable: true,
  properties: {
    address: () => p.embedded(Address).prefix('addr_').prefixMode('absolute'),
    address2: () => p.embedded(Address).prefix('addr2_').prefixMode('relative'),
  },
});

export type IContact = InferEntity<typeof Contact>;

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    contact: () => p.embedded(Contact),
  },
});

export type IUser = InferEntity<typeof User>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Embeddable()
export class Contact {

  @Embedded({ entity: () => Address, prefix: 'addr_', prefixMode: 'absolute' })
  address!: Address;

  @Embedded({ entity: () => Address, prefix: 'addr2_', prefixMode: 'relative' })
  address2!: Address;

}

@Entity()
export class User {

  @Embedded(() => Contact)
  contact!: Contact;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Embeddable()
export class Contact {

  @Embedded({ prefix: 'addr_', prefixMode: 'absolute' })
  address!: Address;

  @Embedded({ prefix: 'addr2_', prefixMode: 'relative' })
  address2!: Address;

}

@Entity()
export class User {

  @Embedded()
  contact!: Contact;

}
```

  </TabItem>
</Tabs>

The default behavior can be overridden in the ORM configuration:

```ts
MikroORM.init({
  embeddables: {
    prefixMode: 'absolute', // defaults to `true`
  }, 
})
```

To have MikroORM drop the prefix and use the value object's property name directly, set `prefix: false`:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).prefix(false),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).prefix(false),
  },
});
```

  </TabItem>
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
</Tabs>

## Storing embeddables as objects

You can also store the embeddable as an object instead of inlining its properties to the owning entity.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).object(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    address: () => p.embedded(Address).object(),
  },
});
```

  </TabItem>
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
</Tabs>

In SQL drivers, this will use a JSON column to store the value.

> Only MySQL and PostgreSQL drivers support searching by JSON properties currently.

> This part of documentation is highly inspired by [doctrine tutorial](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/tutorials/embeddables.html) as the behaviour here is pretty much the same.

## Array of embeddables

Embedded arrays are always stored as JSON. It is possible to use them inside nested embeddables.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    addresses: () => p.embedded(Address).array().onCreate(() => []),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    addresses: () => p.embedded(Address).array().onCreate(() => []),
  },
});
```

  </TabItem>
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
</Tabs>

## Nested embeddables

You can also nest embeddables, both in inline mode and object mode:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    address: () => p.embedded(Address),
  },
});


export const Profile = defineEntity({
  name: 'Profile',
  embeddable: true,
  properties: {
    username: p.string(),
    identity: () => p.embedded(Identity),
  },
});


export const Identity = defineEntity({
  name: 'Identity',
  embeddable: true,
  properties: {
    email: p.string(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    address: () => p.embedded(Address),
  },
});

export type IUser = InferEntity<typeof User>;

export const Profile = defineEntity({
  name: 'Profile',
  embeddable: true,
  properties: {
    username: p.string(),
    identity: () => p.embedded(Identity),
  },
});

export type IProfile = InferEntity<typeof Profile>;

export const Identity = defineEntity({
  name: 'Identity',
  embeddable: true,
  properties: {
    email: p.string(),
  },
});

export type IIdentity = InferEntity<typeof Identity>;
```

  </TabItem>
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
</Tabs>

## Polymorphic embeddables

It is also possible to use polymorphic embeddables. This means you can define multiple classes for a single embedded property and the right one will be used based on the discriminator column, similar to how single table inheritance work.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

export enum AnimalType {
  CAT,
  DOG,
}

const AnimalSchema = defineEntity({
  name: 'Animal',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: p.enum(() => AnimalType),
    name: p.string(),
  },
});

export const Cat = defineEntity({
  name: 'Cat',
  embeddable: true,
  extends: Animal,
  discriminatorValue: AnimalType.CAT,
  properties: {
    canMeow: p.boolean().nullable(),
  },
});

export const Dog = defineEntity({
  name: 'Dog',
  embeddable: true,
  extends: Animal,
  discriminatorValue: AnimalType.DOG,
  properties: {
    canBark: p.boolean().nullable(),
  },
});

export const Owner = defineEntity({
  name: 'Owner',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    pet: () => p.embedded([Cat, Dog]),
  },
});

export class Animal extends AnimalSchema.class {}
AnimalSchema.setClass(Animal);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

export enum AnimalType {
  CAT,
  DOG,
}

export const Animal = defineEntity({
  name: 'Animal',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: p.enum(() => AnimalType),
    name: p.string(),
  },
});

export const Cat = defineEntity({
  name: 'Cat',
  embeddable: true,
  extends: Animal,
  discriminatorValue: AnimalType.CAT,
  properties: {
    canMeow: p.boolean().nullable(),
  },
});

export const Dog = defineEntity({
  name: 'Dog',
  embeddable: true,
  extends: Animal,
  discriminatorValue: AnimalType.DOG,
  properties: {
    canBark: p.boolean().nullable(),
  },
});

export const Owner = defineEntity({
  name: 'Owner',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    pet: () => p.embedded([Cat, Dog]),
  },
});

export type Cat = InferEntity<typeof Cat>;
export type Dog = InferEntity<typeof Dog>;
export type Owner = InferEntity<typeof Owner>;
```

  </TabItem>
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
</Tabs>
