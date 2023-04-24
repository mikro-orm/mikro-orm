---
title: Seeding
---

When initializing your application or testing it can be exhausting to create sample data for your database. The solution is to use seeding. Create factories for your entities and use them in the seed script or combine multiple seed scripts.

## Configuration

> `seeder.path` and `seeder.pathTs` works the same way as `entities` and `entitiesTs` in entity discovery.

The seeder has a few default settings that can be changed easily through the MikroORM config. Underneath you find the configuration options with their defaults.

```ts
MikroORM.init({
  seeder: {
    path: './seeders', // path to the folder with seeders
    pathTs: undefined, // path to the folder with TS seeders (if used, we should put path to compiled files in `path`)
    defaultSeeder: 'DatabaseSeeder', // default seeder class name
    glob: '!(*.d).{js,ts}', // how to match seeder files (all .js and .ts files, but not .d.ts)
    emit: 'ts', // seeder generation mode
    fileName: (className: string) => className, // seeder file naming convention
  },
});
```

We can also override these default using the [environment variables](configuration.md#using-environment-variables):

- `MIKRO_ORM_SEEDER_PATH`
- `MIKRO_ORM_SEEDER_PATH_TS`
- `MIKRO_ORM_SEEDER_EMIT`
- `MIKRO_ORM_SEEDER_GLOB`
- `MIKRO_ORM_SEEDER_DEFAULT_SEEDER`.

## Seeders

A seeder class contains one method `run`. This method is called when you use the command `npx mikro-orm seeder:run`. In the `run` method you define how and what data you want to insert into the database. You can create entities using the [EntityManager](http://mikro-orm.io/docs/entity-manager) or you can use [Factories](#using-entity-factories).

You can create your own seeder classes using the following CLI command:

```shell
npx mikro-orm seeder:create DatabaseSeeder  # generates the class DatabaseSeeder
npx mikro-orm seeder:create test            # generates the class TestSeeder
npx mikro-orm seeder:create project-names   # generates the class ProjectNamesSeeder
```

This creates a new seeder class. By default, it will be generated in the `./seeders/` directory. You can configure the directory in the config with the key `seeder.path` or using the [environment variable](configuration.md#using-environment-variables) `MIKRO_ORM_SEEDER_PATH`. You are allowed to call the `seeder:create` command with a name, class name or hyphenated name.

As an example we will look at a very basic seeder.

> Note that the `EntityManager` available in seeders will have `persistOnCreate` enabled, hence calling `em.create()` will automatically call `em.persist()` on the created entity. If we use entity constructor instead, we need to call `em.persist()` explicitly.

```ts title="./database/seeder/database.seeder.ts"
import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Author } from './author'

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    // will get persisted automatically
    const author = em.create(Author, {
      name: 'John Snow',
      email: 'snow@wall.st'
    });

    // but if we would do `const author = new Author()` instead,
    // we would need to call `em.persist(author)` explicitly.
  }
}
```

> Running a seeder from the command line or programmatically will automatically call `flush` and `clear` after the `run` method has completed.

### Using entity factories

Instead of specifying all the attributes for every entity, you can also use [entity factories](#entity-factories). These can be used to generate large amounts of database records. Please read the [documentation on how to define factories](#entity-factories) to learn how to define your factories.

As an example we will generate 10 authors.

```ts
import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AuthorFactory } from '../factories/author.factory'

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    new AuthorFactory(em).make(10);
  }
}
```

### Calling additional seeders

Inside the `run` method you can specify other seeder classes. You can use the `call` method to break up the database seeder into multiple files to prevent a seeder file from becoming too large. The `call` method requires an `em` and an array of seeder classes.

```ts
import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AuthorSeeder, BookSeeder } from '../seeders'

export class DatabaseSeeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      AuthorSeeder,
      BookSeeder,
    ]);
  }
}
```

### Shared context

Often we might want to generate entities that are referencing other entities, created by other seeders. For that we can use the shared context object provided in the second parameter or `run` method. It is automatically created when using `this.call()` and passed down to each seeder's `run` method. Let's see how the `AuthorSeeder` and `BookSeeder` from previous example could look like:

```ts
export class AuthorSeeder extends Seeder {
  async run(em: EntityManager, context: Dictionary): Promise<void> {
    // save the entity to the context
    context.author = em.create(Author, {
      name: '...',
      email: '...',
    });
  }
}
```

```ts
export class BookSeeder extends Seeder {
  async run(em: EntityManager, context: Dictionary): Promise<void> {
    em.create(Book, {
      title: '...',
      author: context.author, // use the entity from context
    });
  }
}
```

## Entity factories

When testing you may insert entities in the database before starting a test. Instead of specifying every attribute of every entity by hand, you could also use a `Factory` to define a set of default attributes for an entity using entity factories.

Lets have a look at an example factory for an [Author entity](http://mikro-orm.io/docs/defining-entities).

```ts
import { Factory, Faker } from '@mikro-orm/seeder';
import { Author } from './entities/author.entity';

export class AuthorFactory extends Factory<Author> {
  model = Author;

  definition(faker: Faker): Partial<Author> {
    return {
      name: faker.person.findName(),
      email: faker.internet.email(),
      age: faker.random.number(18, 99),
    };
  }
}
```

Basically you extend the base `Factory` class, define a `model` property and a `definition` method. The `model` defines for which entity the factory generates entity instances. The `definition` method returns the default set of attribute values that should be applied when creating an entity using the factory.

Via the faker property, factories have access to the [Faker library](https://github.com/faker-js/faker), which allows you to conveniently generate various kinds of random data for testing.

### Creating entities using factories

Once you defined your factories you can use them to generate entities. Simply import the factory, instantiate it and call the `makeOne` method.

```ts
const author = new AuthorFactory(orm.em).makeOne();
```

#### Generate multiple entities

Generate multiple entities by calling the `make` method. The parameter of the `make` method is the number of entities you generate.

```ts
// Generate 5 authors
const authors = new AuthorFactory(orm.em).make(5);
```

#### Overriding attributes

If you would like to override some of the default values of your factories, you may pass an object to the make method. Only the specified attributes will be replaced while the rest of the attributes remain set to their default values as specified by the factory.

```ts
const author = new AuthorFactory(orm.em).make({
  name: 'John Snow',
});
```

### Persisting entities

The `create` method instantiates entities and persists them to the database using the `persistAndFlush` method of the EntityManager.

```ts
// Make and persist a single author
const author = await new AuthorFactory(orm.em).createOne();

// Make and persist 5 authors
const authors = await new AuthorFactory(orm.em).create(5);
```

You can override the default values of your factories by passing an object to the `create` method.

```ts
// Make and persist a single author
const author = await new AuthorFactory(orm.em).createOne({
  name: 'John Snow',
});

// Make and persist a 5 authors
const authors = await new AuthorFactory(orm.em).create(5, {
  name: 'John Snow',
});
```

### Factory relationships

It is nice to create large quantities of data for one entity, but most of the time we want to create data for multiple entities and also have relations between these. For this we can use the `each` method which can be chained on a factory. The `each` method can be called with a function that transforms output entity from the factory before returning it. Lets look at some examples for the different relations.

#### ManyToOne and OneToOne relations

```ts
const books: Book[] = new BookFactory(orm.em).each(book => {
  book.author = new AuthorFactory(orm.em).makeOne();
}).make(5);
```

#### OneToMany and ManyToMany

```ts
const books: Book[] = new BookFactory(orm.em).each(book => {
  book.owners.set(new OwnerFactory(orm.em).make(5));
}).make(5);
```

## Use with CLI

You may execute the `seeder:run` MikroORM CLI command to seed your database. By default, the `seeder:run` command runs the `DatabaseSeeder` class, which may in turn invoke other seed classes. You can configure the default seeder using the key `seeder.defaultSeeder` or using the [environment variable](configuration.md#using-environment-variables) `MIKRO_ORM_SEEDER_DEFAULT_SEEDER`. You can also use the `--class` option to specify a seeder class:

```shell script
npx mikro-orm seeder:run

npx mikro-orm seeder:run --class=BookSeeder
```

You may also seed your database using the [`migrate:fresh`](migrations.md#using-via-cli) or [`schema:fresh`](schema-generator.md) command in combination with the `--seed` option, which will drop all tables and re-run all of your migrations or generate the database based on the current entities. This command is useful for completely re-building your database:

```shell script
npx mikro-orm migration:fresh --seed    # will drop the database, run all migrations and the DatabaseSeeder class

npx mikro-orm schema:fresh --seed       # will recreate the database and run the DatabaseSeeder class
```

If you do not want to run the `DatabaseSeeder` class you can either specify what the default seeder class should be. This can be done by changing the [default settings](#default-settings). Another option is to explicitly define the seeder class you want to run.

```shell script
npx mikro-orm migration:fresh --seed TestSeeder       # will drop the database, run all migrations and the TestSeeder class

npx mikro-orm schema:fresh --seed ProjectsSeeder      # will recreate the database and run the ProjectsSeeder class
```

## Use in tests

Now we know how to create seeders and factories, but how can we effectively use them in tests. We will show an example how it can be used.

```ts
beforeAll(async () => {
  // Get seeder from MikroORM
  const seeder = orm.getSeeder();

  // Refresh the database to start clean (work in mongo too since v5)
  await orm.getSchemaGenerator().refreshDatabase();

  // Seed using a seeder defined by you
  await seeder.seed(DatabaseSeeder);
});

test(() => {
  // Do tests
});

afterAll(async () => {
  // Close connection
  await orm.close();
});
```

## Running migrations in production

In production environment we might want to use compiled seeder files. All we need to do is to configure the seeder path accordingly:

```ts
import { MikroORM, Utils } from '@mikro-orm/core';

await MikroORM.init({
  seeder: {
    path: 'dist/seeders',
    pathTs: 'src/seeders',
  },
  // or alternatively
  // seeder: {
  //   path: Utils.detectTsNode() ? 'src/seeders' : 'dist/seeders',
  // },
  // ...
});
```

This should allow using CLI to generate TS seeder files (as in CLI we probably have TS support enabled), while using compiled JS files in production, where ts-node is not registered.
