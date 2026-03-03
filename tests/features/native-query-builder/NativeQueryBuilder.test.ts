import { MikroORM, NativeQueryBuilder, raw } from '@mikro-orm/postgresql';
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
  await orm.schema.refresh();
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
    rows: [],
  });
});

test('CTE - basic with()', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('user');

  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', sub).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with "cte" as (select * from "user") select * from "cte"',
    params: [],
  });
});

test('CTE - with raw SQL', () => {
  const platform = orm.em.getPlatform();
  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', raw('select 1 as "id"')).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with "cte" as (select 1 as "id") select * from "cte"',
    params: [],
  });
});

test('CTE - withRecursive()', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('category').where('"parent_id" is null', []);

  const qb = new NativeQueryBuilder(platform);
  qb.withRecursive('category_tree', sub).select('*').from('category_tree');

  expect(qb.compile()).toEqual({
    sql: 'with recursive "category_tree" as (select * from "category" where "parent_id" is null) select * from "category_tree"',
    params: [],
  });
});

test('CTE - multiple CTEs', () => {
  const platform = orm.em.getPlatform();
  const sub1 = new NativeQueryBuilder(platform);
  sub1.select('*').from('users').where('"active" = ?', [true]);

  const sub2 = new NativeQueryBuilder(platform);
  sub2.select('*').from('orders').where('"status" = ?', ['pending']);

  const qb = new NativeQueryBuilder(platform);
  qb.with('active_users', sub1).with('pending_orders', sub2).select('*').from('active_users');

  expect(qb.compile()).toEqual({
    sql: 'with "active_users" as (select * from "users" where "active" = ?), "pending_orders" as (select * from "orders" where "status" = ?) select * from "active_users"',
    params: [true, 'pending'],
  });
});

test('CTE - duplicate name throws', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('users');

  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', sub);
  expect(() => qb.with('cte', sub)).toThrow("CTE with name 'cte' already exists");
});

test('CTE - mixed recursive/non-recursive uses "with recursive" keyword', () => {
  const platform = orm.em.getPlatform();
  const sub1 = new NativeQueryBuilder(platform);
  sub1.select('*').from('config');

  const sub2 = new NativeQueryBuilder(platform);
  sub2.select('*').from('category');

  const qb = new NativeQueryBuilder(platform);
  qb.with('config_cte', sub1).withRecursive('category_tree', sub2).select('*').from('category_tree');

  expect(qb.compile()).toEqual({
    sql: 'with recursive "config_cte" as (select * from "config"), "category_tree" as (select * from "category") select * from "category_tree"',
    params: [],
  });
});

test('CTE - column list', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select(['id', 'name']).from('user');

  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', sub, { columns: ['id', 'name'] }).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with "cte" ("id", "name") as (select "id", "name" from "user") select * from "cte"',
    params: [],
  });
});

test('CTE - MATERIALIZED hint', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('user');

  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', sub, { materialized: true }).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with "cte" as materialized (select * from "user") select * from "cte"',
    params: [],
  });
});

test('CTE - NOT MATERIALIZED hint', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('user');

  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', sub, { materialized: false }).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with "cte" as not materialized (select * from "user") select * from "cte"',
    params: [],
  });
});

test('CTE - with INSERT', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('source').where('"active" = ?', [true]);

  const qb = new NativeQueryBuilder(platform);
  qb.with('active_source', sub)
    .insert({ name: 'test' })
    .into('target');

  expect(qb.compile()).toEqual({
    sql: 'with "active_source" as (select * from "source" where "active" = ?) insert into "target" ("name") values (?)',
    params: [true, 'test'],
  });
});

test('CTE - with UPDATE', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('id').from('source').where('"active" = ?', [true]);

  const qb = new NativeQueryBuilder(platform);
  qb.with('active_source', sub)
    .update({ status: 'processed' })
    .from('target')
    .where('"id" in (select "id" from "active_source")', []);

  expect(qb.compile()).toEqual({
    sql: 'with "active_source" as (select "id" from "source" where "active" = ?) update "target" set "status" = ? where "id" in (select "id" from "active_source")',
    params: [true, 'processed'],
  });
});

test('CTE - with DELETE', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('id').from('source').where('"active" = ?', [false]);

  const qb = new NativeQueryBuilder(platform);
  qb.with('inactive_source', sub)
    .delete()
    .from('target')
    .where('"id" in (select "id" from "inactive_source")', []);

  expect(qb.compile()).toEqual({
    sql: 'with "inactive_source" as (select "id" from "source" where "active" = ?) delete from "target" where "id" in (select "id" from "inactive_source")',
    params: [false],
  });
});

test('CTE - parameter ordering', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('user').where('"age" > ?', [18]);

  const qb = new NativeQueryBuilder(platform);
  qb.with('adults', sub)
    .select('*')
    .from('adults')
    .where('"name" like ?', ['%John%'])
    .limit(10);

  const result = qb.compile();
  expect(result.params).toEqual([18, '%John%', 10]);
});

test('CTE - withRecursive with raw()', () => {
  const platform = orm.em.getPlatform();
  const qb = new NativeQueryBuilder(platform);
  qb.withRecursive('cte', raw('select 1 as "id" union all select "id" + 1 from "cte" where "id" < ?', [10]))
    .select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: 'with recursive "cte" as (select 1 as "id" union all select "id" + 1 from "cte" where "id" < ?) select * from "cte"',
    params: [10],
  });
});

test('CTE - withRecursive with columns option', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('category').where('"parent_id" is null', []);

  const qb = new NativeQueryBuilder(platform);
  qb.withRecursive('category_tree', sub, { columns: ['id', 'name', 'parent_id'] }).select('*').from('category_tree');

  expect(qb.compile()).toEqual({
    sql: 'with recursive "category_tree" ("id", "name", "parent_id") as (select * from "category" where "parent_id" is null) select * from "category_tree"',
    params: [],
  });
});

test('CTE - withRecursive with materialized option', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('category');

  const qb1 = new NativeQueryBuilder(platform);
  qb1.withRecursive('cte', sub, { materialized: true }).select('*').from('cte');
  expect(qb1.compile().sql).toBe('with recursive "cte" as materialized (select * from "category") select * from "cte"');

  const qb2 = new NativeQueryBuilder(platform);
  qb2.withRecursive('cte', sub, { materialized: false }).select('*').from('cte');
  expect(qb2.compile().sql).toBe('with recursive "cte" as not materialized (select * from "category") select * from "cte"');
});

test('CTE - with raw() that has params', () => {
  const platform = orm.em.getPlatform();
  const qb = new NativeQueryBuilder(platform);
  qb.with('cte', raw('select * from "user" where "age" > ?', [18])).select('*').from('cte').where('"name" like ?', ['%John%']);

  expect(qb.compile()).toEqual({
    sql: 'with "cte" as (select * from "user" where "age" > ?) select * from "cte" where "name" like ?',
    params: [18, '%John%'],
  });
});

test('CTE - with comment', () => {
  const platform = orm.em.getPlatform();
  const sub = new NativeQueryBuilder(platform);
  sub.select('*').from('user');

  const qb = new NativeQueryBuilder(platform);
  qb.comment('fetch users').with('cte', sub).select('*').from('cte');

  expect(qb.compile()).toEqual({
    sql: '/* fetch users */ with "cte" as (select * from "user") select * from "cte"',
    params: [],
  });
});
