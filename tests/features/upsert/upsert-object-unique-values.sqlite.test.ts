import { MikroORM, ValidationError } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

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

describe('upsert with object values in the unique keys (sqlite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  beforeEach(async () => {
    await orm.schema.clear();
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
    const b = await orm.em.fork().upsert(
      User,
      { email: 'c@c', password: 'c', settings: { $ref: '#/a' } },
      {
        onConflictFields: ['settings'],
      },
    );
    const [c] = await orm.em.fork().upsertMany(User, [{ email: 'd@d', password: 'd', settings: { $ref: '#/a' } }], {
      onConflictFields: ['settings'],
    });

    expect(b.id).toBe(a.id);
    expect(c.id).toBe(a.id);
    expect(await users()).toEqual([
      ['a@a', 'a'],
      ['d@d', 'd'],
    ]);
    await expect(
      orm.em
        .fork()
        .upsert(User, { email: 'e@e', password: 'e', settings: { $in: ['a'] } }, { onConflictFields: ['settings'] }),
    ).rejects.toThrow(ValidationError);
  });
});
