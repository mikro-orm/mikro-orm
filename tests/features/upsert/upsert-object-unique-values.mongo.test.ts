import { Entity, MikroORM, ObjectId, PrimaryKey, Property, Unique, ValidationError } from '@mikro-orm/mongodb';

@Entity()
class User {

  @PrimaryKey({ name: '_id' })
  id!: ObjectId;

  @Unique()
  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property()
  tenant!: number;

  @Property({ type: 'json', nullable: true })
  settings?: Record<string, unknown>;

}

describe('upsert with object values in the unique keys (mongo)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-upsert-object-unique-values-6x',
    });
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    orm.em.create(User, { email: 'a@a', password: 'a', tenant: 1 });
    orm.em.create(User, { email: 'b@b', password: 'b', tenant: 2 });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.dropSchema();
    await orm.close(true);
  });

  const users = async () => {
    const rows = await orm.em.fork().find(User, {}, { orderBy: { email: 'asc' } });
    return rows.map(row => [row.email, row.password, row.tenant]);
  };
  const seeded = [
    ['a@a', 'a', 1],
    ['b@b', 'b', 2],
  ];

  test('em.upsert() does not match other documents via `onConflictFields` values', async () => {
    const upsert = () => orm.em.fork().upsert(
      User,
      { email: { $in: ['b@b'] } as any, password: 'new', tenant: 1 },
      { onConflictFields: ['email'], onConflictMergeFields: ['password'] },
    );
    await expect(upsert()).rejects.toThrow(ValidationError);
    await expect(upsert()).rejects.toThrow(`Invalid value of User.email, operators are not allowed in the unique keys of upsert data: { '$in': [ 'b@b' ] }`);
    expect(await users()).toEqual(seeded);
  });

  test('em.upsert() does not match other documents via unique property values', async () => {
    const em = orm.em.fork();
    await expect(em.upsert(User, { email: { $ne: null } as any, password: 'new', tenant: 1 })).rejects.toThrow(ValidationError);
    await expect(em.upsert(User, { email: { $regex: '.*' } as any, password: 'new', tenant: 1 })).rejects.toThrow(ValidationError);
    expect(await users()).toEqual(seeded);
  });

  test('em.upsert() does not match other documents via the primary key value', async () => {
    const em = orm.em.fork();
    const data = { id: { $ne: null } as any, email: 'c@c', password: 'new', tenant: 1 };
    await expect(em.upsert(User, data)).rejects.toThrow(ValidationError);
    await expect(em.upsert(User, { ...data, id: { $or: [{}] } as any })).rejects.toThrow(ValidationError);
    expect(await users()).toEqual(seeded);
  });

  test('em.upsert() does not read back other documents with `onConflictAction: ignore`', async () => {
    const data = { email: { $ne: null } as any, password: 'new', tenant: 1 };
    await expect(orm.em.fork().upsert(User, data, { onConflictAction: 'ignore' })).rejects.toThrow(ValidationError);
    expect(await users()).toEqual(seeded);
  });

  test('em.upsertMany() does not match other documents via unique key values', async () => {
    const data = [
      { email: 'a@a', password: 'a2', tenant: 1 },
      { email: { $in: ['b@b'] } as any, password: 'new', tenant: 1 },
    ];
    await expect(orm.em.fork().upsertMany(User, data)).rejects.toThrow(ValidationError);
    await expect(orm.em.fork().upsertMany(User, data, { onConflictFields: ['email'], onConflictMergeFields: ['password'] })).rejects.toThrow(ValidationError);
    await expect(orm.em.fork().upsertMany(User, [{ id: { $ne: null } as any, email: 'c@c', password: 'new', tenant: 1 }])).rejects.toThrow(ValidationError);
    expect(await users()).toEqual(seeded);
  });

  test('object values are matched as they are', async () => {
    const a = await orm.em.fork().upsert(User, { email: 'c@c', password: 'c', tenant: 3, settings: { a: 1 } }, { onConflictFields: ['settings'] });
    const b = await orm.em.fork().upsert(User, { email: 'c@c', password: 'd', tenant: 3, settings: { a: 1 } }, { onConflictFields: ['settings'] });
    const [c] = await orm.em.fork().upsertMany(User, [{ email: 'c@c', password: 'e', tenant: 3, settings: { a: 1 } }], { onConflictFields: ['settings'] });

    expect(b.id).toEqual(a.id);
    expect(c.id).toEqual(a.id);
    expect(await users()).toEqual([...seeded, ['c@c', 'e', 3]]);
  });

  test('operator keys outside of the unique keys are stored as they are', async () => {
    await orm.em.fork().upsert(User, { email: 'a@a', password: 'a', tenant: 1, settings: { $in: ['b@b'] } });
    const [a, b] = await orm.em.fork().find(User, {}, { orderBy: { email: 'asc' } });

    expect(a.settings).toEqual({ $in: ['b@b'] });
    expect(b.settings).toBeUndefined();
  });

});
