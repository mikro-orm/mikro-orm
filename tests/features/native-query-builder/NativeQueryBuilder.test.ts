import { Entity, MikroORM, NativeQueryBuilder, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  name?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'foo',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close());

test('NativeQueryBuilder', async () => {
  const qb = new NativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb.compile()).toThrow('No query type provided');
  expect(() => qb.select([]).compile()).toThrow('No fields selected');

  const qb2 = new NativeQueryBuilder(orm.em.getPlatform());
  // @ts-expect-error
  expect(() => qb2.insert().compile()).toThrow('No data provided');

  const qb3 = new NativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb3.update({}).compile()).toThrow('No data provided');
  expect(() => qb3.update({ foo: 'bar' }).compile()).toThrow('No table name provided');

  const qb4 = new NativeQueryBuilder(orm.em.getPlatform());
  expect(qb4.update({ name: 'bar' }).from('user').compile()).toEqual({
    sql: 'update "user" set "name" = ?',
    params: ['bar'],
  });

  const res = await orm.em.execute(qb4, undefined, 'run');
  expect(res).toEqual({
    affectedRows: 0,
    insertId: 0,
    rows: [],
  });
});
