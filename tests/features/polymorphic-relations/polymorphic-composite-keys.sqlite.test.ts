import { Collection, MikroORM, PolymorphicRef, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Organization {
  [PrimaryKeyProp]?: ['tenantId', 'orgId'];

  @PrimaryKey()
  tenantId!: number;

  @PrimaryKey()
  orgId!: number;

  @Property()
  name!: string;

  @OneToMany(() => Notification, n => n.recipient)
  notifications = new Collection<Notification>(this);

  constructor(tenantId: number, orgId: number, name: string) {
    this.tenantId = tenantId;
    this.orgId = orgId;
    this.name = name;
  }
}

@Entity()
class User {
  [PrimaryKeyProp]?: ['tenantId', 'userId'];

  @PrimaryKey()
  tenantId!: number;

  @PrimaryKey()
  userId!: number;

  @Property()
  email!: string;

  @OneToMany(() => Notification, n => n.recipient)
  notifications = new Collection<Notification>(this);

  constructor(tenantId: number, userId: number, email: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.email = email;
  }
}

@Entity()
class Notification {
  @PrimaryKey()
  id!: number;

  @Property()
  message!: string;

  // Polymorphic relation to entities with composite PKs
  @ManyToOne(() => [Organization, User])
  recipient!: Organization | User;

  constructor(message: string) {
    this.message = message;
  }
}

describe('polymorphic relations with composite primary keys', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Organization, User, Notification],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Notification, {});
    await orm.em.nativeDelete(Organization, {});
    await orm.em.nativeDelete(User, {});
    orm.em.clear();
  });

  test('metadata correctly handles composite keys', async () => {
    const meta = orm.getMetadata().get(Notification);
    const recipientProp = meta.properties.recipient;

    expect(recipientProp.polymorphic).toBe(true);
    expect(recipientProp.fieldNames).toHaveLength(3); // discriminator + 2 PK columns
    expect(recipientProp.fieldNames).toContain('recipient_type');
    expect(recipientProp.referencedColumnNames).toHaveLength(2); // Both composite PK columns
    // Discriminator map uses table names as keys
    expect(Object.keys(recipientProp.discriminatorMap!)).toEqual(['organization', 'user']);
  });

  test('schema creates columns for all composite key parts', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    const notifTable = sql.split('\n').find(s => s.toLowerCase().includes('notification'));

    expect(notifTable).toBeDefined();
    expect(notifTable).toContain('recipient_type');
    // Should have columns for both parts of the composite key
    expect(notifTable).toMatch(/recipient_tenant_id|recipient_id_0/);
    expect(notifTable).toMatch(/recipient_org_id|recipient_user_id|recipient_id_1/);
  });

  test('can persist and load polymorphic relation to Organization with composite PK', async () => {
    const org = new Organization(1, 100, 'Acme Corp');
    const notif = orm.em.create(Notification, {
      message: 'Hello organization',
      recipient: org,
    });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Notification, { id: notif.id });
    expect(loaded.recipient).toBeInstanceOf(Organization);

    await orm.em.populate(loaded, ['recipient']);
    const loadedOrg = loaded.recipient as Organization;
    expect(loadedOrg.tenantId).toBe(1);
    expect(loadedOrg.orgId).toBe(100);
    expect(loadedOrg.name).toBe('Acme Corp');
  });

  test('can persist and load polymorphic relation to User with composite PK', async () => {
    const user = new User(1, 42, 'user@example.com');
    const notif = orm.em.create(Notification, {
      message: 'Hello user',
      recipient: user,
    });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Notification, { id: notif.id });
    expect(loaded.recipient).toBeInstanceOf(User);

    await orm.em.populate(loaded, ['recipient']);
    const loadedUser = loaded.recipient as User;
    expect(loadedUser.tenantId).toBe(1);
    expect(loadedUser.userId).toBe(42);
    expect(loadedUser.email).toBe('user@example.com');
  });

  test('can update from one entity to another with composite keys', async () => {
    const org = new Organization(1, 100, 'Org');
    const user = new User(1, 42, 'user@test.com');
    const notif = orm.em.create(Notification, {
      message: 'Test',
      recipient: org,
    });
    orm.em.persist(user);

    await orm.em.flush();
    orm.em.clear();

    const loadedNotif = await orm.em.findOneOrFail(Notification, { id: notif.id });
    const loadedUser = await orm.em.findOneOrFail(User, { tenantId: 1, userId: 42 });
    loadedNotif.recipient = loadedUser;

    await orm.em.flush();
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Notification, { id: notif.id });
    expect(reloaded.recipient).toBeInstanceOf(User);
    await orm.em.populate(reloaded, ['recipient']);
    expect((reloaded.recipient as User).email).toBe('user@test.com');
  });

  test('inverse side works with composite keys', async () => {
    const org = new Organization(1, 100, 'Test Org');
    const n1 = orm.em.create(Notification, { message: 'N1', recipient: org });
    const n2 = orm.em.create(Notification, { message: 'N2', recipient: org });

    await orm.em.flush();
    orm.em.clear();

    const loadedOrg = await orm.em.findOneOrFail(
      Organization,
      { tenantId: 1, orgId: 100 },
      { populate: ['notifications'] },
    );

    expect(loadedOrg.notifications).toHaveLength(2);
    expect(
      loadedOrg.notifications
        .getItems()
        .map(n => n.message)
        .sort(),
    ).toEqual(['N1', 'N2']);
  });

  test('handles same composite key values in different tables', async () => {
    // Both entities with same composite key values
    const org = new Organization(1, 100, 'Organization');
    const user = new User(1, 100, 'user@test.com');

    const orgNotif = orm.em.create(Notification, { message: 'To org', recipient: org });
    const userNotif = orm.em.create(Notification, { message: 'To user', recipient: user });

    await orm.em.flush();
    orm.em.clear();

    const notifications = await orm.em.find(Notification, {}, { populate: ['recipient'] });
    expect(notifications).toHaveLength(2);

    const orgN = notifications.find(n => n.message === 'To org')!;
    const userN = notifications.find(n => n.message === 'To user')!;

    expect(orgN.recipient).toBeInstanceOf(Organization);
    expect(userN.recipient).toBeInstanceOf(User);
  });

  test('batch loads polymorphic relations with composite keys', async () => {
    const org1 = new Organization(1, 100, 'Org 1');
    const org2 = new Organization(1, 200, 'Org 2');
    const user1 = new User(1, 100, 'user1@test.com');

    const n1 = orm.em.create(Notification, { message: 'N1', recipient: org1 });
    const n2 = orm.em.create(Notification, { message: 'N2', recipient: org2 });
    const n3 = orm.em.create(Notification, { message: 'N3', recipient: user1 });

    await orm.em.flush();
    orm.em.clear();

    // Load all notifications with populated recipients
    const notifications = await orm.em.find(
      Notification,
      {},
      {
        populate: ['recipient'],
        orderBy: { message: 'ASC' },
      },
    );

    expect(notifications).toHaveLength(3);
    expect(notifications[0].recipient).toBeInstanceOf(Organization);
    expect((notifications[0].recipient as Organization).name).toBe('Org 1');
    expect(notifications[1].recipient).toBeInstanceOf(Organization);
    expect((notifications[1].recipient as Organization).name).toBe('Org 2');
    expect(notifications[2].recipient).toBeInstanceOf(User);
  });

  test('multiple inverse side loads with composite keys', async () => {
    const org1 = new Organization(1, 100, 'Org 1');
    const org2 = new Organization(1, 200, 'Org 2');
    const user = new User(1, 100, 'user@test.com');

    orm.em.create(Notification, { message: 'N1', recipient: org1 });
    orm.em.create(Notification, { message: 'N2', recipient: org1 });
    orm.em.create(Notification, { message: 'N3', recipient: org2 });
    orm.em.create(Notification, { message: 'N4', recipient: user });

    await orm.em.flush();
    orm.em.clear();

    // Load multiple organizations with their notifications
    const orgs = await orm.em.find(Organization, {}, { populate: ['notifications'] });

    expect(orgs).toHaveLength(2);
    const org1Loaded = orgs.find(o => o.name === 'Org 1')!;
    const org2Loaded = orgs.find(o => o.name === 'Org 2')!;

    expect(org1Loaded.notifications).toHaveLength(2);
    expect(org2Loaded.notifications).toHaveLength(1);
  });

  test('batch updates with polymorphic composite keys', async () => {
    const org = new Organization(1, 100, 'Org');
    const user1 = new User(1, 42, 'user1@test.com');
    const user2 = new User(1, 43, 'user2@test.com');
    orm.em.persist([user1, user2]);

    orm.em.create(Notification, { message: 'N1', recipient: org });
    orm.em.create(Notification, { message: 'N2', recipient: org });
    orm.em.create(Notification, { message: 'N3', recipient: org });

    await orm.em.flush();
    orm.em.clear();

    // Load all notifications and change their recipients
    const notifications = await orm.em.find(
      Notification,
      {},
      {
        orderBy: { id: 'ASC' },
      },
    );

    // Change recipients to different users (batch update)
    notifications[0].recipient = await orm.em.findOneOrFail(User, { tenantId: 1, userId: 42 });
    notifications[1].recipient = await orm.em.findOneOrFail(User, { tenantId: 1, userId: 43 });
    notifications[2].message = 'Updated message'; // Also update a non-polymorphic field

    await orm.em.flush();
    orm.em.clear();

    // Verify updates
    const reloaded = await orm.em.find(
      Notification,
      {},
      {
        populate: ['recipient'],
        orderBy: { id: 'ASC' },
      },
    );

    expect(reloaded[0].recipient).toBeInstanceOf(User);
    expect((reloaded[0].recipient as User).email).toBe('user1@test.com');
    expect(reloaded[1].recipient).toBeInstanceOf(User);
    expect((reloaded[1].recipient as User).email).toBe('user2@test.com');
    expect(reloaded[2].recipient).toBeInstanceOf(Organization);
    expect(reloaded[2].message).toBe('Updated message');
  });

  test('insert via QueryBuilder with tuple format for composite key', async () => {
    // Create target entities first
    const org = new Organization(1, 100, 'Tuple Org');
    const user = new User(1, 42, 'tuple@test.com');
    orm.em.persist([org, user]);
    await orm.em.flush();
    orm.em.clear();

    // Insert notification using QueryBuilder with tuple format: ['discriminator', ...ids]
    const qb = orm.em.createQueryBuilder(Notification);
    await qb
      .insert({
        message: 'Via QB with tuple',
        recipient: ['organization', 1, 100] as const,
      })
      .execute();

    orm.em.clear();

    // Verify it was inserted correctly
    const loaded = await orm.em.findOneOrFail(
      Notification,
      { message: 'Via QB with tuple' },
      { populate: ['recipient'] },
    );
    expect(loaded.recipient).toBeInstanceOf(Organization);
    expect((loaded.recipient as Organization).tenantId).toBe(1);
    expect((loaded.recipient as Organization).orgId).toBe(100);
    expect((loaded.recipient as Organization).name).toBe('Tuple Org');
  });

  test('batch insert with tuple format for composite keys', async () => {
    // Create target entities
    const org1 = new Organization(1, 100, 'Batch Org 1');
    const org2 = new Organization(1, 200, 'Batch Org 2');
    const user1 = new User(1, 50, 'batch1@test.com');
    orm.em.persist([org1, org2, user1]);
    await orm.em.flush();
    orm.em.clear();

    // Batch insert notifications using tuple format: ['discriminator', ...ids]
    await orm.em.insertMany(Notification, [
      { message: 'Batch N1', recipient: ['organization', 1, 100] as const },
      { message: 'Batch N2', recipient: ['organization', 1, 200] as const },
      { message: 'Batch N3', recipient: ['user', 1, 50] as const },
    ]);

    orm.em.clear();

    // Verify
    const notifications = await orm.em.find(
      Notification,
      { message: { $like: 'Batch N%' } },
      {
        populate: ['recipient'],
        orderBy: { message: 'ASC' },
      },
    );

    expect(notifications).toHaveLength(3);
    expect(notifications[0].recipient).toBeInstanceOf(Organization);
    expect((notifications[0].recipient as Organization).name).toBe('Batch Org 1');
    expect(notifications[1].recipient).toBeInstanceOf(Organization);
    expect((notifications[1].recipient as Organization).name).toBe('Batch Org 2');
    expect(notifications[2].recipient).toBeInstanceOf(User);
    expect((notifications[2].recipient as User).email).toBe('batch1@test.com');
  });

  test('insert with PolymorphicRef using object-style composite key', async () => {
    // Create target entity
    const org = new Organization(1, 100, 'Object PK Org');
    orm.em.persist(org);
    await orm.em.flush();
    orm.em.clear();

    // Insert using PolymorphicRef with object-style ID (not array)
    const qb = orm.em.createQueryBuilder(Notification);
    await qb
      .insert({
        message: 'Via PolymorphicRef with object ID',
        recipient: new PolymorphicRef('organization', { tenantId: 1, orgId: 100 }) as any,
      })
      .execute();

    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(
      Notification,
      { message: 'Via PolymorphicRef with object ID' },
      { populate: ['recipient'] },
    );
    expect(loaded.recipient).toBeInstanceOf(Organization);
    expect((loaded.recipient as Organization).tenantId).toBe(1);
    expect((loaded.recipient as Organization).orgId).toBe(100);
  });
});
