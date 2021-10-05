import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class First {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => Second, second => second.first, { owner: false })
  second?: any;

}

@Entity()
export class Second {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: () => First,
    inversedBy: 'second',
    orphanRemoval: true,
  })
  first!: First;

  constructor(first: First) {
    this.first = first;
  }

}

describe('GH issue 2238', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [First, Second],
      dbName: 'mikro_orm_test_2238',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('flush after removeAndFlush', async () => {
    const a = new First();
    const b = new Second(a);
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const seconds = await orm.em.find(Second, {});
    await orm.em.removeAndFlush(seconds);
    const result1 = await orm.em.find(Second, {});
    expect(result1.length).toBe(0);
    await orm.em.flush();
    const result2 = await orm.em.find(Second, {});
    expect(result2.length).toBe(0);
  });
});
