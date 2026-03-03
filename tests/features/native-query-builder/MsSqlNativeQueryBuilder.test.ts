import { MikroORM, MsSqlNativeQueryBuilder, raw, sql } from '@mikro-orm/mssql';
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
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: 'foo',
  });
});

afterAll(() => orm.close());

test('MsSqlNativeQueryBuilder', async () => {
  const qb = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb.compile()).toThrow('No query type provided');
  expect(() => qb.select([]).compile()).toThrow('No fields selected');

  const qb2 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  // @ts-expect-error
  expect(() => qb2.insert().compile()).toThrow('No data provided');

  const qb3 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  expect(() => qb3.update({}).compile()).toThrow('No data provided');
  expect(() => qb3.update({ foo: 'bar' }).compile()).toThrow('No table name provided');

  const qb4 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  expect(qb4.update({ foo: 'bar' }).from('baz').compile()).toEqual({
    sql: 'update [baz] set [foo] = ?; select @@rowcount;',
    params: ['bar'],
  });

  const qb5 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  qb5.onConflict({ fields: sql`foo` });
  expect(qb5.comment('comment').insert({ foo: 'bar' }).into('baz', { schema: 'foo' }).compile()).toEqual({
    sql: '/* comment */ merge into [foo].[baz] using (values (?)) as tsource([foo]) foo when not matched then insert ([foo]) values (tsource.[foo]) when matched then update set [foo] = tsource.[foo];',
    params: ['bar'],
  });

  const qb6 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  qb6.insert({}).into('baz').onConflict({ fields: [], ignore: true });
  qb6.where('foo1', ['bar1']);
  expect(qb6.compile()).toEqual({
    sql: 'insert into [baz] default values; select @@rowcount;',
    params: [],
  });

  const qb7 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
  qb7.select('*').having('foo', ['bar']).from('baz').limit(1).offset(2).orderBy('lol desc');
  expect(qb7.compile()).toEqual({
    sql: 'select * from [baz] having foo order by lol desc offset ? rows fetch next ? rows only',
    params: ['bar', 2, 1],
  });

  const qb8 = new MsSqlNativeQueryBuilder(orm.em.getPlatform());
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
    sql: 'merge into [baz] using (values (?)) as tsource([foo]) on [baz].[field1] = tsource.[field1] and [baz].[field2] = tsource.[field2] when not matched then insert ([foo]) values (tsource.[foo]) when matched and ? = ? then update set [baz].[name] = ?, [baz].[updatedAt] = ?;',
    params: ['bar', 1, 1, 'John Doe', date],
  });
});

test('MsSqlNativeQueryBuilder - CTE uses "with" (never "with recursive")', () => {
  const platform = orm.em.getPlatform();

  // Non-recursive CTE
  const sub1 = new MsSqlNativeQueryBuilder(platform);
  sub1.select('*').from('user');
  const qb1 = new MsSqlNativeQueryBuilder(platform);
  qb1.with('cte', sub1).select('*').from('cte');
  expect(qb1.compile().sql).toMatch(/^with \[cte\] as/);
  expect(qb1.compile().sql).not.toContain('recursive');

  // Recursive CTE — MSSQL still uses "with" (no "recursive" keyword)
  const sub2 = new MsSqlNativeQueryBuilder(platform);
  sub2.select('*').from('category');
  const qb2 = new MsSqlNativeQueryBuilder(platform);
  qb2.withRecursive('category_tree', sub2).select('*').from('category_tree');
  expect(qb2.compile().sql).toMatch(/^with \[category_tree\] as/);
  expect(qb2.compile().sql).not.toContain('recursive');
});

test('MsSqlNativeQueryBuilder - CTE with upsert', () => {
  const platform = orm.em.getPlatform();
  const sub = new MsSqlNativeQueryBuilder(platform);
  sub.select('*').from('source').where('[active] = ?', [true]);

  const qb = new MsSqlNativeQueryBuilder(platform);
  qb.with('active_source', sub);
  qb.onConflict({ fields: ['id'] });
  qb.insert({ id: 1, name: 'test' }).into('target');

  const result = qb.compile();
  expect(result.sql).toContain('with [active_source] as (select * from [source] where [active] = ?)');
  expect(result.sql).toContain('merge into [target]');
  expect(result.params[0]).toBe(true);
});

test('MsSqlNativeQueryBuilder - CTE with INSERT', () => {
  const platform = orm.em.getPlatform();
  const sub = new MsSqlNativeQueryBuilder(platform);
  sub.select('*').from('source').where('[active] = ?', [true]);

  const qb = new MsSqlNativeQueryBuilder(platform);
  qb.with('active_source', sub).insert({ name: 'test' }).into('target');

  const result = qb.compile();
  expect(result.sql).toBe(
    'with [active_source] as (select * from [source] where [active] = ?) insert into [target] ([name]) values (?); select @@rowcount;',
  );
  expect(result.params).toEqual([true, 'test']);
});

test('MsSqlNativeQueryBuilder - CTE with UPDATE', () => {
  const platform = orm.em.getPlatform();
  const sub = new MsSqlNativeQueryBuilder(platform);
  sub.select('id').from('source').where('[active] = ?', [true]);

  const qb = new MsSqlNativeQueryBuilder(platform);
  qb.with('active_source', sub).update({ status: 'done' }).from('target');

  const result = qb.compile();
  expect(result.sql).toBe(
    'with [active_source] as (select [id] from [source] where [active] = ?) update [target] set [status] = ?; select @@rowcount;',
  );
  expect(result.params).toEqual([true, 'done']);
});

test('MsSqlNativeQueryBuilder - CTE with DELETE', () => {
  const platform = orm.em.getPlatform();
  const sub = new MsSqlNativeQueryBuilder(platform);
  sub.select('id').from('source').where('[active] = ?', [false]);

  const qb = new MsSqlNativeQueryBuilder(platform);
  qb.with('inactive_source', sub).delete().from('target').where('[id] in (select [id] from [inactive_source])', []);

  const result = qb.compile();
  expect(result.sql).toBe(
    'with [inactive_source] as (select [id] from [source] where [active] = ?) delete from [target] where [id] in (select [id] from [inactive_source]); select @@rowcount;',
  );
  expect(result.params).toEqual([false]);
});

test('MsSqlNativeQueryBuilder - CTE with raw()', () => {
  const platform = orm.em.getPlatform();
  const qb = new MsSqlNativeQueryBuilder(platform);
  qb.with('cte', raw('select 1 as [id]')).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with [cte] as (select 1 as [id]) select * from [cte]',
    params: [],
  });
});
