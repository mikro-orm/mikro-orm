import { MikroORM, OracleNativeQueryBuilder, sql } from '@mikro-orm/oracledb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
  });
});

afterAll(() => orm.close());

test('OracleNativeQueryBuilder', async () => {
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
    sql: 'update "baz" set "foo" = ?',
    params: ['bar'],
  });

  const qb5 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb5.onConflict({ fields: sql`foo` });
  expect(qb5.comment('comment').insert({ foo: 'bar' }).into('baz', { schema: 'bar' }).compile()).toEqual({
    sql: '/* comment */ merge into "bar"."baz" using (select ? as "foo" from dual) tsource foo when not matched then insert ("foo") values (tsource."foo") when matched then update set "foo" = tsource."foo"',
    params: ['bar'],
  });

  const qb6 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb6.insert({}).into('baz').onConflict({ fields: [], ignore: true });
  qb6.where('foo1', ['bar1']);
  expect(qb6.compile()).toEqual({
    sql: 'insert into "baz" default values on conflict do nothing',
    params: [],
  });

  const qb7 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb7.select('*').having('foo', ['bar']).from('baz').limit(1).offset(2).orderBy('lol desc');
  expect(qb7.compile()).toEqual({
    sql: 'select * from "baz" having foo order by lol desc offset ? rows fetch next ? rows only',
    params: ['bar', 2, 1],
  });

  const qb8 = new OracleNativeQueryBuilder(orm.em.getPlatform());
  const date = new Date();
  qb8
    .insert({ foo: 'bar' })
    .into('baz')
    .onConflict({
      fields: ['field1', 'field2'],
      merge: {
        name: 'John Doe',
        updatedAt: date,
      },
      where: { sql: '? = ?', params: [1, 1] },
    });
  qb8.where('foo1', ['bar1']);
  expect(qb8.compile()).toEqual({
    sql: 'merge into "baz" using (select ? as "foo" from dual) tsource on ("baz"."field1" = tsource."field1" and "baz"."field2" = tsource."field2") when not matched then insert ("foo") values (tsource."foo") when matched and ? = ? then update set "baz"."name" = ?, "baz"."updatedAt" = ?',
    params: ['bar', 1, 1, 'John Doe', date],
  });
});

test('OracleNativeQueryBuilder upsert with returning', async () => {
  const qb = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb.insert({ foo: 'bar', baz: 123 }).into('my_table').returning(['foo', 'baz']);
  qb.onConflict({ fields: ['foo'] });
  const result = qb.compile();
  expect(result.sql).toBe(
    'merge into "my_table" using (select ? as "foo", ? as "baz" from dual) tsource on ("my_table"."foo" = tsource."foo") when not matched then insert ("foo", "baz") values (tsource."foo", tsource."baz") when matched then update set "baz" = tsource."baz" returning "my_table"."foo", "my_table"."baz" into :out_foo, :out_baz',
  );
  expect(result.params.length).toBe(3); // 2 data params + 1 outBindings
  expect(result.params[0]).toBe('bar');
  expect(result.params[1]).toBe(123);
});

test('OracleNativeQueryBuilder upsert ignore with returning', async () => {
  const qb = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb.insert({ foo: 'bar', baz: 123 }).into('my_table').returning(['foo']);
  qb.onConflict({ fields: ['foo'], ignore: true });
  const result = qb.compile();
  expect(result.sql).toBe(
    'merge into "my_table" using (select ? as "foo", ? as "baz" from dual) tsource on ("my_table"."foo" = tsource."foo") when not matched then insert ("foo", "baz") values (tsource."foo", tsource."baz") returning "my_table"."foo" into :out_foo',
  );
  expect(result.params.length).toBe(3); // 2 data params + 1 outBindings
});

test('OracleNativeQueryBuilder upsert with custom merge and returning', async () => {
  const qb = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb.insert({ foo: 'bar', baz: 123, qux: 'hello' }).into('my_table').returning(['foo', 'baz']);
  qb.onConflict({ fields: ['foo'], merge: ['baz'] });
  const result = qb.compile();
  expect(result.sql).toBe(
    'merge into "my_table" using (select ? as "foo", ? as "baz", ? as "qux" from dual) tsource on ("my_table"."foo" = tsource."foo") when not matched then insert ("foo", "baz", "qux") values (tsource."foo", tsource."baz", tsource."qux") when matched then update set "baz" = tsource."baz" returning "my_table"."foo", "my_table"."baz" into :out_foo, :out_baz',
  );
  expect(result.params[0]).toBe('bar');
  expect(result.params[1]).toBe(123);
  expect(result.params[2]).toBe('hello');
});

test('OracleNativeQueryBuilder upsert with where and returning', async () => {
  const qb = new OracleNativeQueryBuilder(orm.em.getPlatform());
  qb.insert({ foo: 'bar', baz: 123 }).into('my_table').returning(['foo']);
  qb.onConflict({
    fields: ['foo'],
    where: { sql: '? = ?', params: [1, 1] },
  });
  const result = qb.compile();
  expect(result.sql).toBe(
    'merge into "my_table" using (select ? as "foo", ? as "baz" from dual) tsource on ("my_table"."foo" = tsource."foo") when not matched then insert ("foo", "baz") values (tsource."foo", tsource."baz") when matched and ? = ? then update set "baz" = tsource."baz" returning "my_table"."foo" into :out_foo',
  );
  expect(result.params[0]).toBe('bar');
  expect(result.params[1]).toBe(123);
  expect(result.params[2]).toBe(1);
  expect(result.params[3]).toBe(1);
});

test('OracleNativeQueryBuilder quote with subquery', async () => {
  const sub = new OracleNativeQueryBuilder(orm.em.getPlatform());
  sub.select('id').from('user');

  // Test via protected quote method directly
  const result = (sub as any).quote(sub);
  expect(result).toBe('select "id" from "user"');
});
