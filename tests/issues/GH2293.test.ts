import { Entity, MikroORM, PrimaryKey, Property, t } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/sqlite';

@Entity()
export class TestEntity {

  @PrimaryKey()
  id!: number;

  @Property({ type: t.json })
  jsonField: { name: string }[] = [{ name: 'hello' }];

}

describe('GH issue 2293', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const a = new TestEntity();
    await orm.em.fork().persistAndFlush(a);
    const a1 = await orm.em.findOneOrFail(TestEntity, a.id);
    expect(a1.id).toBeDefined();
    expect(a1.jsonField).toEqual([{ name: 'hello' }]);

    await orm.em.persistAndFlush([new TestEntity(), new TestEntity(), new TestEntity()]);
    orm.em.clear();

    const as = await orm.em.find(TestEntity, {});
    expect(as.map(a => a.jsonField)).toEqual([
      [{ name: 'hello' }],
      [{ name: 'hello' }],
      [{ name: 'hello' }],
      [{ name: 'hello' }],
    ]);
  });

});
