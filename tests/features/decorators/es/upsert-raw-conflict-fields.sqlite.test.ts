import { MikroORM, raw } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class Item {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string', unique: true })
  code!: string;

  @Property({ type: 'string' })
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Item],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('em.upsert() with a raw conflict target returns the existing row of an ignored conflict', async () => {
  await orm.em.insert(Item, { id: 1, code: 'a', name: 'old' });

  const item = await orm.em.fork().upsert(
    Item,
    { code: 'a', name: 'new' },
    {
      onConflictFields: raw('(code)'),
      onConflictAction: 'ignore',
    },
  );

  expect(item).toMatchObject({ id: 1, code: 'a', name: 'old' });
});
