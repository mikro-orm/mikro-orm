import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Foo {

  @PrimaryKey()
  id!: number;

  @Property()
  bar!: string;

  @Property({ columnType: 'timestamp(3)', nullable: true })
  createdAt: Date | null = null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Foo],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 1352`, async () => {
  const foo = orm.em.create(Foo, { bar: 'baz' });
  orm.em.assign(foo, { createdAt: new Date() });
  expect(orm.getMetadata().get(Foo).properties.createdAt.type).toBe('Date');
});
