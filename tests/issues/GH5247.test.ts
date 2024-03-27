import { Entity, JsonType, MikroORM, PrimaryKey, Property, QBFilterQuery, RawQueryFragment } from '@mikro-orm/sqlite';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: JsonType, nullable: true })
  a!: any;

  constructor(a: any) {
    this.a = a;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Test],
  });
  await orm.schema.createSchema();
  orm.em.create(Test, { a: {
      value: 1,
    } });
  orm.em.create(Test, { a: {
      complex: {
        bool: true,
      },
    } });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('simple - no getQuery', async () => {
  const query: QBFilterQuery<Test> = { a: { value: 1 } };
  const qb = orm.em.qb(Test).where(query);
  const res = await qb.execute('get'); // proper sql query is generated
  expect(res).toEqual({ id: 1, a: '{"value":1}' });
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('simple - with getQuery', async () => {
  const query: QBFilterQuery<Test> = { a: { value: 1 } };
  const qb = orm.em.qb(Test).where(query);
  qb.getQuery();
  const res = await qb.execute(); // proper sql query is generated
  expect(res.length).toBe(1); // result as expected
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('complex working', async () => {
  const query = { $and: [{ $or: [{ a: { value: 1 } }, { a: { complex: { bool: true } } }] }] };
  const qb = orm.em.qb(Test).where(query);
  const res = await qb.execute(); // proper sql query is generated
  expect(res.length).toBe(2); // result as expected
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('complex not working', async () => {
  const query = { $and: [{ $or: [{ a: { value: 1 } }, { a: { complex: { bool: true } } }] }] };
  const qb = orm.em.qb(Test).where(query);
  expect(qb.getFormattedQuery()).toBe("select `t0`.* from `test` as `t0` where (json_extract(`t0`.`a`, '$.value') = 1 or json_extract(`t0`.`a`, '$.complex.bool') = true)");
  expect(qb.getQuery()).toBe("select `t0`.* from `test` as `t0` where (json_extract(`t0`.`a`, '$.value') = ? or json_extract(`t0`.`a`, '$.complex.bool') = ?)");
  const res = await qb.execute(); // faulty sql query is generated
  expect(res.length).toBe(2);
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});
