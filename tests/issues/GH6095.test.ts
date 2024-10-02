import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/better-sqlite';

@Entity()
class Entity1 {

  @PrimaryKey({ type: 'bigserial' })
  id!: string;

  constructor(id: string) {
    this.id = id;
  }

}

@Entity()
class Entity2 {

  @PrimaryKey({ autoincrement: true, type: 'number' })
  id!: string;

}

@Entity()
class Entity3 {

  @PrimaryKey({ autoincrement: true, type: 'int' })
  id!: string;

}

@Entity()
class Entity4 {

  @PrimaryKey({ autoincrement: true, type: 'Integer' })
  id!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Entity1,
      Entity2,
      Entity3,
      Entity4,
    ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6095', async () => {
  const sql = await orm.schema.getUpdateSchemaSQL();
  expect(sql).toBe('');

  await orm.em.persistAndFlush([
    new Entity1('id1'),
    new Entity2(),
    new Entity3(),
    new Entity4(),
  ]);
  const counts = await Promise.all([
    orm.em.count(Entity1),
    orm.em.count(Entity2),
    orm.em.count(Entity3),
    orm.em.count(Entity4),
  ]);
  expect(counts).toEqual([1, 1, 1, 1]);
});
