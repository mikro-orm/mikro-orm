import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
class Account {
  @PrimaryKey({ name: '_id' })
  id!: ObjectId;

  @Unique()
  @Property({ nullable: true })
  email?: string | null;

  @Property()
  name!: string;
}

describe('upsert with a null unique key (mongo)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Account],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-upsert-null-unique-key',
    });
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.create(Account, { email: 'a@example.com', name: 'a' });
    orm.em.create(Account, { email: 'b@example.com', name: 'b' });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  const names = async () => {
    const rows = await orm.em.fork().find(Account, {}, { orderBy: { name: 'asc' } });
    return rows.map(row => [row.name, row.email]);
  };

  test('em.upsert() inserts instead of updating every document', async () => {
    const seeded = await orm.em.fork().find(Account, {});
    const account = await orm.em.upsert(Account, { email: null, name: 'c' });

    expect(account.id).toBeInstanceOf(ObjectId);
    expect(seeded.map(row => row.id.toHexString())).not.toContain(account.id.toHexString());
    expect(account.name).toBe('c');
    expect(await names()).toEqual([
      ['a', 'a@example.com'],
      ['b', 'b@example.com'],
      ['c', null],
    ]);
  });

  test('em.upsertMany() inserts the rows without a unique value', async () => {
    const seeded = await orm.em.fork().find(Account, {});
    const accounts = await orm.em.upsertMany(Account, [
      { email: 'a@example.com', name: 'a2' },
      { email: null, name: 'c' },
    ]);

    expect(accounts.map(row => row.name)).toEqual(['a2', 'c']);
    expect(accounts[0].id.toHexString()).toBe(seeded.find(row => row.email === 'a@example.com')!.id.toHexString());
    expect(seeded.map(row => row.id.toHexString())).not.toContain(accounts[1].id.toHexString());
    expect(await names()).toEqual([
      ['a2', 'a@example.com'],
      ['b', 'b@example.com'],
      ['c', null],
    ]);
  });
});
