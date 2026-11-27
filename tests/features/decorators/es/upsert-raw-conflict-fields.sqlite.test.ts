import { MikroORM, raw, ValidationError } from '@mikro-orm/sqlite';
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

test('em.upsert() with a raw conflict target rejects an ignored conflict with a row that differs from the data', async () => {
  await orm.em.insert(Item, { id: 1, code: 'a', name: 'old' });

  const upsert = orm.em.fork().upsert(
    Item,
    { code: 'a', name: 'new' },
    {
      onConflictFields: raw('(code)'),
      onConflictAction: 'ignore',
    },
  );

  await expect(upsert).rejects.toThrow(ValidationError);
});
