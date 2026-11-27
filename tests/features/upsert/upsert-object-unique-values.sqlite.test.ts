import { Entity, MikroORM, PrimaryKey, Property, Unique, ValidationError } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  email!: string;

  @Property()
  password!: string;

  @Unique()
  @Property({ type: 'json', nullable: true })
  settings?: Record<string, unknown>;

}

@Entity()
class Pair {

  @PrimaryKey()
  a!: number;

  @PrimaryKey()
  b!: number;

  @Property()
  name!: string;

}

describe('upsert with object values in the unique keys (sqlite)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Pair],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    orm.em.create(User, { email: 'a@a', password: 'a' });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  const users = async () => {
    const rows = await orm.em.fork().find(User, {}, { orderBy: { id: 'asc' } });
    return rows.map(row => [row.email, row.password]);
  };

  test('em.upsert() does not read back other rows', async () => {
    const data = { email: { $ne: null } as any, password: 'new' };
    await expect(orm.em.fork().upsert(User, data, { onConflictAction: 'ignore' })).rejects.toThrow(ValidationError);
    expect(await users()).toEqual([['a@a', 'a']]);
  });

  test('em.upsertMany() does not read back other rows', async () => {
    const data = [{ email: { $ne: null } as any, password: 'new' }];
    await expect(orm.em.fork().upsertMany(User, data, { onConflictAction: 'ignore' })).rejects.toThrow(ValidationError);
    expect(await users()).toEqual([['a@a', 'a']]);
  });

  test('JSON unique values with non-operator `$` keys are matched as they are', async () => {
    const a = await orm.em.fork().upsert(User, { email: 'b@b', password: 'b', settings: { $ref: '#/a' } });
    const b = await orm.em.fork().upsert(User, { email: 'c@c', password: 'c', settings: { $ref: '#/a' } }, { onConflictFields: ['settings'] });
    const [c] = await orm.em.fork().upsertMany(User, [{ email: 'd@d', password: 'd', settings: { $ref: '#/a' } }], { onConflictFields: ['settings'] });

    expect(b.id).toBe(a.id);
    expect(c.id).toBe(a.id);
    expect(await users()).toEqual([
      ['a@a', 'a'],
      ['d@d', 'd'],
    ]);
    await expect(orm.em.fork().upsert(User, { email: 'e@e', password: 'e', settings: { $in: ['a'] } }, { onConflictFields: ['settings'] })).rejects.toThrow(ValidationError);
  });

  test('the error names the composite primary key property', async () => {
    await expect(orm.em.fork().upsert(Pair, { a: 1, b: { $ne: null } as any, name: 'p' })).rejects.toThrow(`Invalid value of Pair.b, operators are not allowed in the unique keys of upsert data: { '$ne': null }`);
  });

});
