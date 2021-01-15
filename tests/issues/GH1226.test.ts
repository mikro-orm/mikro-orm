import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

  #myPrivateProp!: boolean;

  setup(isAwesome: boolean) {
    this.#myPrivateProp = isAwesome;
  }

  verify(isAwesome: boolean) {
    return this.#myPrivateProp === isAwesome;
  }

}

describe('GH issue 1226', () => {

  let orm1: MikroORM<SqliteDriver>;
  let orm2: MikroORM<SqliteDriver>;
  let orm3: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm1 = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      forceEntityConstructor: true,
      entities: [Example],
    });
    orm2 = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      forceEntityConstructor: [Example],
      entities: [Example],
    });
    orm3 = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      forceEntityConstructor: ['Example'],
      entities: [Example],
    });
    await orm1.getSchemaGenerator().createSchema();
    await orm2.getSchemaGenerator().createSchema();
    await orm3.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm1.close(true);
    await orm2.close(true);
    await orm3.close(true);
  });

  test(`force usage of entity constructors to be able to use native private properties 1`, async () => {
    const entry = new Example();
    entry.setup(true);
    expect(entry.verify(true)).toBe(true);
    await orm1.em.persistAndFlush(entry);
    orm1.em.clear();

    const fetchedEntry = await orm1.em.findOneOrFail(Example, entry.id);
    fetchedEntry.setup(false);
    expect(fetchedEntry.verify(false)).toBe(true);
  });

  test(`force usage of entity constructors to be able to use native private properties 2`, async () => {
    const entry = new Example();
    entry.setup(true);
    expect(entry.verify(true)).toBe(true);
    await orm2.em.persistAndFlush(entry);
    orm2.em.clear();

    const fetchedEntry = await orm2.em.findOneOrFail(Example, entry.id);
    fetchedEntry.setup(false);
    expect(fetchedEntry.verify(false)).toBe(true);
  });

  test(`force usage of entity constructors to be able to use native private properties 3`, async () => {
    const entry = new Example();
    entry.setup(true);
    expect(entry.verify(true)).toBe(true);
    await orm3.em.persistAndFlush(entry);
    orm3.em.clear();

    const fetchedEntry = await orm3.em.findOneOrFail(Example, entry.id);
    fetchedEntry.setup(false);
    expect(fetchedEntry.verify(false)).toBe(true);
  });

});
