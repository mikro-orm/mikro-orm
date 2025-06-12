import { Entity, MikroORM, OracleNativeQueryBuilder, PrimaryKey, Property, sql } from '@mikro-orm/mssql';

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

test.todo('OracleNativeQueryBuilder', async () => {
  const qb = new OracleNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb.compile()).toThrow('No query type provided');
  expect(() => qb.select([]).compile()).toThrow('No fields selected');

  const qb2 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  // @ts-expect-error
  expect(() => qb2.insert().compile()).toThrow('No data provided');

  const qb3 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb3.update({}).compile()).toThrow('No data provided');
  expect(() => qb3.update({ foo: 'bar' }).compile()).toThrow('No table name provided');

  const qb4 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  expect(qb4.update({ foo: 'bar' }).from('baz').compile()).toEqual({
    sql: 'update [baz] set [foo] = ?; select @@rowcount;',
    params: ['bar'],
  });

  const qb5 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb5.onConflict({ fields: sql`foo` });
  expect(qb5.comment('comment').insert({ foo: 'bar' }).into('baz', { schema: 'foo' }).compile()).toEqual({
    sql: '/* comment */ merge into [foo].[baz] using (values (?)) as tsource([foo]) foo when not matched then insert ([foo]) values (tsource.[foo]) when matched then update set [foo] = tsource.[foo];',
    params: ['bar'],
  });

  const qb6 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb6.insert({}).into('baz').onConflict({ fields: [], ignore: true });
  qb6.where('foo1', ['bar1']);
  expect(qb6.compile()).toEqual({
    sql: 'insert into [baz] default values; select @@rowcount;',
    params: [],
  });

  const qb7 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb7.select('*').having('foo', ['bar']).from('baz').limit(1).offset(2).orderBy('lol desc');
  expect(qb7.compile()).toEqual({
    sql: 'select * from [baz] having foo order by lol desc offset ? rows fetch next ? rows only',
    params: ['bar', 2, 1],
  });

  const qb8 = new OracleNativeQueryBuilder(orm.em.getPlatform());
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
    sql: 'merge into [baz] using (values (?)) as tsource([foo]) on [baz].[field1] = tsource.[field1] and [baz].[field2] = tsource.[field2] when not matched then insert ([foo]) values (tsource.[foo]) when matched and ? = ? then update set [baz].[name] = ?, [baz].[updatedAt] = ?;',
    params: ['bar', 1, 1, 'John Doe', date],
  });
});
