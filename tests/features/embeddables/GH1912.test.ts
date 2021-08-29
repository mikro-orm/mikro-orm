import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
export class Metadata {

  @Property()
  id?: string;

  @Property()
  metaKey?: string;

  @Property()
  metaValue?: string;

  @Property()
  createdAt?: string;

}

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  one: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  two: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  three: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  four: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  five: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  six: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  seven: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  eight: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  nine: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  ten: Metadata[] = [];

  @Embedded({
    entity: () => Metadata,
    array: true,
    object: true,
  })
  eleven: Metadata[] = [];

}

describe('GH issue 1912', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Example, Metadata],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1912`, async () => {
    const e = new Example();
    await orm.em.persistAndFlush(e);
    orm.em.clear();

    const e1 = await orm.em.findOne(Example, e);
    expect(e1).not.toBeNull();
  });

});
