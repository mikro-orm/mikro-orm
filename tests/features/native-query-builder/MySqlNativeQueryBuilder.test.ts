import { Entity, MikroORM, MySqlNativeQueryBuilder, PrimaryKey, Property, sql } from '@mikro-orm/mysql';

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
    connect: false,
  });
});

afterAll(() => orm.close());

test('MySqlNativeQueryBuilder', async () => {
  const qb = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb.compile()).toThrow('No query type provided');
  expect(() => qb.select([]).compile()).toThrow('No fields selected');

  const qb2 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  // @ts-expect-error
  expect(() => qb2.insert().compile()).toThrow('No data provided');

  const qb3 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb3.update({}).compile()).toThrow('No data provided');
  expect(() => qb3.update({ foo: 'bar' }).compile()).toThrow('No table name provided');

  const qb4 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  expect(qb4.update({ foo: 'bar' }).from('baz').compile()).toEqual({
    sql: 'update `baz` set `foo` = ?',
    params: ['bar'],
  });

  const qb5 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  qb5.onConflict({ fields: sql`foo` });
  expect(qb5.comment('comment').insert({ foo: 'bar' }).into('baz').compile()).toEqual({
    sql: '/* comment */ insert into `baz` (`foo`) values (?) on conflict foo',
    params: ['bar'],
  });

  const qb6 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  qb6.insert({}).into('baz').onConflict({ fields: [], ignore: true });
  qb6.where('foo1', ['bar1']);
  expect(qb6.compile()).toEqual({
    sql: 'insert ignore into `baz` default values',
    params: [],
  });

  const qb7 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  qb7.select('*').having('foo', ['bar']).from('baz').limit(1).offset(2).orderBy('lol desc');
  expect(qb7.compile()).toEqual({
    sql: 'select * from `baz` having foo order by lol desc limit ? offset ?',
    params: ['bar', 1, 2],
  });

  const qb8 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  const date = new Date();
  qb8.insert({ foo: 'bar' }).into('baz').onConflict({
    fields: ['field1', 'field2'],
    merge: {
      name: 'John Doe',
      updatedAt: date,
    },
    where: { sql: '? = ?', params: [1, 1] },
  });
  qb8.where('foo1', ['bar1']);
  expect(qb8.compile()).toEqual({
    sql: 'insert into `baz` (`foo`) values (?) on duplicate key update `name` = ?, `updatedAt` = ? where ? = ?',
    params: ['bar', 'John Doe', date, 1, 1],
  });

  const qb9 = new MySqlNativeQueryBuilder(orm.em.getPlatform());
  qb9.insert({ foo: 'bar' }).into('baz').onConflict({
    fields: ['field1', 'field2'],
  });
  expect(qb9.compile()).toEqual({
    sql: 'insert into `baz` (`foo`) values (?) on conflict (`field1`, `field2`)',
    params: ['bar'],
  });
});
