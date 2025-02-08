import { Entity, MikroORM, OptionalProps, PrimaryKey, Property, t } from '@mikro-orm/sqlite';

@Entity()
export class Asset1 {

  [OptionalProps]?: 'field';

  @PrimaryKey({ type: t.string })
  id!: string;

  @Property({ type: t.json })
  field!: { value: string };

}

test('upsert and insert both correctly serialize json', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Asset1],
  });
  await orm.schema.refreshDatabase();

  const userToPersist = orm.em.create(Asset1, {});
  userToPersist.id = 'works';
  userToPersist.field = { value: 'works' };
  await orm.em.persistAndFlush(userToPersist);
  const queryPersisted = await orm.em.findOne(Asset1, { field: { value: 'works' } });
  expect(queryPersisted).not.toBeNull();

  const userToUpsert = orm.em.create(Asset1, {});
  userToUpsert.id = 'doesnt';
  userToUpsert.field = { value: 'doesnt' };
  await orm.em.upsert(userToUpsert);
  const queryUpserted = await orm.em.findOne(Asset1, { field: { value: 'doesnt' } });
  expect(queryUpserted).not.toBeNull();

  await orm.close(true);
});
