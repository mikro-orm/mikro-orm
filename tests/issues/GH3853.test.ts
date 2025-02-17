import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/mariadb';
import { mockLogger } from '../helpers.js';

@Entity()
export class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  born!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    dbName: `mikro_orm_test_3847`,
    port: 3309,
    entities: [Test],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`3847`, async () => {
  const r = await orm.em.insert(Test, { name: 'n', born: new Date() });

  await orm.em.findOne(Test, { id: r });
  await orm.em.findOne(Test, { name: 'n' });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([]);
});
