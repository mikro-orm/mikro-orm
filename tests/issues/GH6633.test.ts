import { Entity, MikroORM, Opt, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'datetime', columnType: 'timestamp(6)', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test],
    dbName: '6633',
  });

  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('date hydration', async () => {
  const d = new Test();
  await orm.em.persistAndFlush(d);
  expect(d.createdAt).toBeInstanceOf(Date);

  const d2 = await orm.em.fork().findOneOrFail(Test, d);
  expect(d.createdAt).toBeInstanceOf(Date);
});
