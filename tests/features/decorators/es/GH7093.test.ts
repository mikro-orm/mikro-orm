import { MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

abstract class BaseEntity {

  @Property({ type: 'timestamptz', defaultRaw: 'now' })
  created_at!: Date & Opt;

  @Property({ type: 'timestamptz', defaultRaw: 'now' })
  updated_at!: Date & Opt;

}

@Entity({ tableName: 'parents' })
class Parent extends BaseEntity {

  @PrimaryKey({ type: 'bigint' })
  id!: number;

  @Property({ type: 'text' })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    dbName: ':memory:',
    entities: [Parent],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7093', async () => {
  const p = new Parent();
  p.name = 'foo 1';
  await orm.em.persist(p).flush();
  orm.em.clear();

  const res = await orm.em.findAll(Parent);
  expect(res).toHaveLength(1);
  expect(res[0]).toEqual({ id: 1n, created_at: 'now', updated_at: 'now', name: 'foo 1' });
});
