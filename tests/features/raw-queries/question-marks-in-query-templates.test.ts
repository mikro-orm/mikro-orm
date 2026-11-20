import { defineEntity, p, raw, sql, Type } from '@mikro-orm/core';
import { type EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as MySqlMikroORM } from '@mikro-orm/mysql';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    age: p.integer().nullable(),
    meta: p.json<Record<string, unknown>>().nullable(),
  },
});

const Flag = defineEntity({
  name: 'Flag',
  tableName: 'flag?',
  properties: {
    id: p.integer().primary().fieldName('id?'),
    enabled: p.boolean().fieldName('enabled?').index().nullable(),
    label: p.string().nullable(),
  },
});

class UpperType extends Type<string, string> {
  override convertToJSValueSQL(key: string): string {
    return `upper(${key})`;
  }
}

const Doc = defineEntity({
  name: 'Doc',
  tableName: 'doc?',
  indexes: [{ properties: ['title'], type: 'fulltext' }, { properties: ['meta.a?'] as any }],
  triggers: [{ name: 'trg?', timing: 'after', events: ['insert'], body: 'select 1' }],
  properties: {
    id: p.integer().primary(),
    title: p.type(UpperType).fieldName('title?'),
    meta: p.json<Record<string, unknown>>().fieldName('meta?').nullable(),
  },
});

const NamedUser = defineEntity({
  name: 'NamedUser',
  expression: (em: EntityManager) =>
    em
      .createQueryBuilder(User, 'u')
      .select(['id', 'name'])
      .where({ name: { $ne: '?' } }),
  properties: {
    id: p.integer(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({ entities: [User, Flag, NamedUser], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  em.create(User, { id: 1, name: 'one', email: 'one?', age: 10, meta: { 'ok?': 1 } });
  em.create(User, { id: 2, name: '?', email: 'two??', age: 20, meta: { 'ok?': 2 } });
  em.create(User, { id: 3, name: 'three', email: 'th?ree', age: 30 });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('table and column names containing question marks', async () => {
  const em = orm.em.fork();
  em.create(Flag, { id: 1, enabled: true, label: 'a' });
  em.create(Flag, { id: 2, enabled: false, label: 'b?' });
  await em.flush();
  em.clear();

  await expect(em.find(Flag, {}, { orderBy: { id: 'asc' } })).resolves.toHaveLength(2);
  await expect(em.find(Flag, { enabled: true, label: 'a' })).resolves.toMatchObject([{ id: 1 }]);
  await expect(em.find(Flag, { label: 'b?', enabled: false })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.count(Flag, { enabled: { $in: [true, false] } })).resolves.toBe(2);

  const flag = await em.findOneOrFail(Flag, 2);
  flag.enabled = true;
  flag.label = '?';
  await em.flush();
  await expect(em.nativeUpdate(Flag, { enabled: true }, { label: 'x?' })).resolves.toBe(2);
  await expect(em.nativeDelete(Flag, { id: 1, enabled: true })).resolves.toBe(1);
  await expect(em.fork().find(Flag, {})).resolves.toMatchObject([{ id: 2, enabled: true, label: 'x?' }]);

  // multi insert without any parameter
  await em.insertMany(Flag, [{}, {}]);
  await expect(em.count(Flag)).resolves.toBe(3);

  const qb = em.createQueryBuilder(Flag, 'f').select('enabled').where({ enabled: null });
  expect(qb.getQuery()).toBe('select `f`.`enabled?` from `flag?` as `f` where `f`.`enabled?` is null');
  expect(qb.getFormattedQuery()).toBe('select `f`.`enabled?` from `flag?` as `f` where `f`.`enabled?` is null');
  await expect(qb.execute()).resolves.toEqual([{ enabled: null }, { enabled: null }]);
});

test('schema of a table with question marks in its names', async () => {
  const createSql = await orm.schema.getCreateSchemaSQL();
  expect(createSql).toContain('create table `flag?` (`id?` integer not null primary key autoincrement');
  expect(createSql).toContain('create index `flag?_enabled?_index` on `flag?` (`enabled?`);');
  expect(createSql).not.toContain('\\?');
  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');
  await expect(orm.schema.getDropSchemaSQL()).resolves.not.toContain('\\?');
});

test('unknown keys containing question marks are used as column names', async () => {
  const em = orm.em.fork();
  const where = { 'u.name??': 'x', email: 'y' } as any;
  const qb1 = em.createQueryBuilder(User, 'u').where(where);
  expect(qb1.getFormattedQuery()).toBe(
    "select `u`.* from `user` as `u` where `u`.`name??` = 'x' and `u`.`email` = 'y'",
  );
  await expect(em.find(User, { $and: [{ 'u0.id??': '=0 or 1=1 -- ' }, { age: 10 }] } as any)).rejects.toThrow(
    'no such column: u0.id??',
  );

  const qb2 = em
    .createQueryBuilder(User)
    .update({ 'age??': 'x', name: 'y' } as any)
    .where({ id: 1 });
  expect(qb2.getFormattedQuery()).toBe("update `user` set `age??` = 'x', `name` = 'y' where `id` = 1");
  await expect(em.nativeUpdate(User, { id: 1 }, { 'age?': 5 } as any)).rejects.toThrow('no such column: age?');
  await expect(em.nativeDelete(User, { 'user.id??': 'x', age: 10 } as any)).rejects.toThrow(
    'no such column: user.id??',
  );
  await expect(em.find(User, {})).resolves.toHaveLength(3);
});

test('schema names containing question marks', async () => {
  const qb = orm.em.createQueryBuilder(User, 'u').withSchema('s??').where({ name: 'x', email: 'y' });
  expect(qb.getFormattedQuery()).toBe(
    "select `u`.* from `s??`.`user` as `u` where `u`.`name` = 'x' and `u`.`email` = 'y'",
  );
});

test('json keys containing question marks', async () => {
  const em = orm.em.fork();
  await expect(em.find(User, { meta: { 'ok?': 2 }, age: 20 })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.find(User, { meta: { 'ok??': 'x' }, age: 20 })).resolves.toEqual([]);
  const users = await em.find(User, { age: { $lt: 30 } }, { orderBy: { meta: { 'ok?': 'desc' } }, limit: 2 });
  expect(users.map(u => u.id)).toEqual([2, 1]);
});

test('values of raw fragments containing question marks', async () => {
  const em = orm.em.fork();
  const qb = () => em.createQueryBuilder(User, 'u');
  const isQ = () => sql`lower(u.name) = ${'?'}`;
  const pos = () => sql`instr(u.email, ${'?'})`;

  await expect(qb().where(isQ()).andWhere({ email: 'two??' }).getResultList()).resolves.toMatchObject([{ id: 2 }]);
  await expect(
    qb().where({ age: 20 }).andWhere(isQ()).andWhere({ email: 'two??' }).getResultList(),
  ).resolves.toMatchObject([{ id: 2 }]);
  await expect(
    qb()
      .where({ id: 1 })
      .orWhere(isQ())
      .andWhere({ age: { $gt: 0 } })
      .getResultList(),
  ).resolves.toHaveLength(2);
  await expect(
    qb()
      .where(raw('lower(u.name) = ?', ['?']))
      .andWhere({ age: 20 })
      .getCount(),
  ).resolves.toBe(1);
  await expect(qb().where(isQ()).getResultList()).resolves.toMatchObject([{ id: 2 }]);

  await expect(
    qb()
      .select(['id', pos().as('pos')])
      .where({ email: 'th?ree' })
      .execute(),
  ).resolves.toEqual([{ id: 3, pos: 3 }]);
  await expect(qb().select('id').addSelect(pos().as('pos')).where({ email: 'one?' }).execute()).resolves.toEqual([
    { id: 1, pos: 4 },
  ]);
  await expect(
    qb()
      .select('id')
      .where({ age: { $gte: 10 } })
      .orderBy([{ [pos()]: 'desc' }, { id: 'desc' }])
      .limit(2)
      .execute(),
  ).resolves.toEqual([{ id: 2 }, { id: 1 }]);
  await expect(
    qb()
      .select([pos().as('pos'), raw('count(*) as cnt')])
      .groupBy(pos())
      .having({ [raw('count(*)')]: { $gte: 1 } })
      .orderBy({ [pos()]: 'asc' })
      .execute(),
  ).resolves.toEqual([
    { pos: 3, cnt: 1 },
    { pos: 4, cnt: 2 },
  ]);

  await expect(
    qb()
      .update({ age: 99 })
      .where(raw('lower(u.name) = ?', ['?']))
      .andWhere({ email: 'two??' })
      .execute('run'),
  ).resolves.toMatchObject({ affectedRows: 1 });
  await expect(
    qb()
      .delete()
      .where(raw('lower(u.name) = ?', ['?']))
      .andWhere({ email: 'nope' })
      .execute('run'),
  ).resolves.toMatchObject({
    affectedRows: 0,
  });
  await expect(em.find(User, {}, { orderBy: { id: 'asc' } })).resolves.toMatchObject([
    { age: 10 },
    { age: 99 },
    { age: 30 },
  ]);

  // without any other parameter in the query
  await expect(qb().select(pos().as('pos')).orderBy({ id: 'asc' }).execute()).resolves.toEqual([
    { pos: 4 },
    { pos: 4 },
    { pos: 3 },
  ]);
  expect(qb().select(pos().as('pos')).getQuery()).toBe("select instr(u.email, '?') as `pos` from `user` as `u`");
});

test('em.find with raw fragments containing question marks', async () => {
  const em = orm.em.fork();
  const users = await em.find(
    User,
    { email: { $ne: 'nope' } },
    { orderBy: [{ [sql`instr(email, ${'?'})`]: 'asc' }, { id: 'asc' }], limit: 2 },
  );
  expect(users.map(u => u.id)).toEqual([3, 1]);
  await expect(em.find(User, { [sql`lower(name)`]: '?', email: 'two??' })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.find(User, { name: sql`lower(${'?'})`, email: 'two??' })).resolves.toMatchObject([{ id: 2 }]);
});

test('sub-queries with values containing question marks', async () => {
  const em = orm.em.fork();
  const qb = () => em.createQueryBuilder(User, 'u');
  const sub = () => em.createQueryBuilder(User, 's').select(['id', 'name']).where({ name: '?' });

  await expect(
    qb()
      .select('u.*')
      .innerJoin(sub(), 'j', { 'u.id': sql.ref('j.id') })
      .where({ email: 'two??' })
      .execute(),
  ).resolves.toMatchObject([{ id: 2 }]);
  await expect(
    qb()
      .where({ id: { $in: sub().select('id').getNativeQuery() }, email: 'two??' })
      .getResultList(),
  ).resolves.toMatchObject([{ id: 2 }]);
  await expect(
    qb()
      .withSubQuery(
        em.createQueryBuilder(User, 's').count('s.id').where({ name: '?' }).getNativeQuery(),
        'u.questionMarks',
      )
      .where({ 'u.questionMarks': 1, email: 'th?ree' } as any)
      .getResultList(),
  ).resolves.toMatchObject([{ id: 3 }]);
  await expect(
    em
      .createQueryBuilder(sub() as any, 'x')
      .where({ name: '?' } as any)
      .execute(),
  ).resolves.toEqual([{ id: 2, name: '?' }]);
});

test('virtual entity with a query builder expression', async () => {
  const em = orm.em.fork();
  await expect(em.find(NamedUser, { name: 'one' })).resolves.toEqual([{ id: 1, name: 'one' }]);
  await expect(em.find(NamedUser, {}, { orderBy: { id: 'asc' } })).resolves.toHaveLength(2);
  await expect(em.count(NamedUser, { name: { $in: ['one', '?'] } })).resolves.toBe(1);
});

test('plain queries and values are not altered', async () => {
  const em = orm.em.fork();
  await expect(em.execute(`select '\\?' as a, '?' as b`)).resolves.toEqual([{ a: '\\?', b: '?' }]);
  await expect(em.execute(`select '\\?' as a, ? as b`, ['?'])).resolves.toEqual([{ a: '?', b: '?' }]);
  await expect(em.find(User, { name: '?', email: { $like: '%??' } })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.find(User, { email: 'th?ree' })).resolves.toMatchObject([{ id: 3 }]);
  expect(orm.em.getPlatform().quoteIdentifier(raw('lower(?)', ['a?']))).toBe("lower('a\\?')");
  expect(orm.em.getPlatform().formatQuery('select ?? from ?? where a = ?', ['a?', 'b??', '?'])).toBe(
    "select `a?` from `b??` where a = '?'",
  );
});

test('kysely select of a column with a custom type', async () => {
  const orm = new MikroORM({ entities: [Doc], dbName: ':memory:' });
  await orm.schema.execute('create table `doc?` (`id` integer primary key, `title?` text, `meta?` json)');
  await orm.em.insert(Doc, { id: 1, title: 'a' });
  const kysely = orm.em.getKysely<any>({ tableNamingStrategy: 'entity', convertValues: true });
  await expect(kysely.selectFrom('Doc').select('title?').execute()).resolves.toEqual([{ 'title?': 'A' }]);
  await orm.close(true);
});

describe.each([
  ['postgresql', PostgreSqlMikroORM, {}, '"u"."name??"', `"u"."meta"->>'ok??'`],
  ['mysql', MySqlMikroORM, { port: 3308 }, '`u`.`name??`', 'json_extract(`u`.`meta`, \'$.\\"ok??\\"\')'],
  ['mssql', MsSqlMikroORM, {}, '[u].[name??]', `json_value([u].[meta], '$."ok??"')`],
] as const)('%s', (_type, ORM, options, column, jsonPath) => {
  test('identifiers and json paths containing question marks', async () => {
    const orm = new (ORM as typeof PostgreSqlMikroORM)({ entities: [User, Flag, Doc], dbName: 'not-used', ...options });
    const qb = orm.em
      .createQueryBuilder(User, 'u')
      .select('id')
      .where({ 'u.name??': 'x', meta: { 'ok??': 'y' }, email: 'z' } as any);
    const formatted = qb.getFormattedQuery();
    expect(formatted).toContain(`${column} = `);
    expect(formatted).toContain(`${jsonPath} = `);
    expect(formatted).toMatch(/'x'.*'z'.*'y'$/);

    const ddl = await orm.schema.getCreateSchemaSQL();
    expect(ddl).toMatch(/create table .flag\?. \(.id\?. /);
    expect(ddl).not.toContain('\\?');
    await orm.close(true);
  });
});
