import { Entity, PrimaryKey, MikroORM, Property } from '@mikro-orm/sqlite';

@Entity()
class Item {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Item],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('#6089', async () => {
  const r1 = await orm.em.createQueryBuilder(Item)
    .insert({ name: '1' })
    .execute();
  expect(r1).toEqual({
    affectedRows: 1,
    row: { id: 1 },
    rows: [{ id: 1 }],
  });

  const r2 = await orm.em.createQueryBuilder(Item)
    .insert([{ name: '2' }, { name: '3' }])
    .execute();
  expect(r2).toEqual({
    affectedRows: 2,
    row: { id: 2 },
    rows: [{ id: 2 }, { id: 3 }],
  });
});
