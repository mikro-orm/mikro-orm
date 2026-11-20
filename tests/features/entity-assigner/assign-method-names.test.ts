import { BaseEntity, Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Embeddable()
class Address {

  @Property()
  city!: string;

  @Property({ hidden: true, nullable: true })
  note?: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ hidden: true })
  password!: string;

  @Embedded(() => Address, { nullable: true })
  address?: Address;

}

@Entity()
class Task {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User)
  owner!: User;

}

@Entity()
class Account extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ hidden: true })
  token!: string;

  local = 'initial';

  describe() {
    return `account ${this.name}`;
  }

  set plainToken(value: string) {
    this.token = `hashed:${value}`;
  }

}

describe('assign() with keys named like entity methods', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Task, Address, Account],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    const em = orm.em.fork();
    const user = em.create(User, { id: 1, name: 'a', password: 'pw', address: { city: 'c', note: 'n' } });
    em.create(Task, { id: 1, title: 't', owner: user });
    em.persist(Object.assign(new Account(), { id: 1, name: 'n', token: 'tok' }));
    await em.flush();
  });

  test('keeps `toJSON` of the entity intact', async () => {
    const em = orm.em.fork();
    const user = await em.findOneOrFail(User, 1);
    em.assign(user, JSON.parse('{"name":"b","toJSON":1}'));

    expect(Object.hasOwn(user, 'toJSON')).toBe(false);
    expect(JSON.parse(JSON.stringify(user))).toEqual({ id: 1, name: 'b', address: { city: 'c' } });
  });

  test('keeps `toJSON` of nested entities and embeddables intact', async () => {
    const em = orm.em.fork();
    const task = await em.findOneOrFail(Task, 1, { populate: ['owner'] });
    em.assign(task, JSON.parse('{"toJSON":1,"owner":{"id":1,"toJSON":1,"address":{"city":"d","toJSON":1}}}'));

    expect(JSON.parse(JSON.stringify(task))).toEqual({
      id: 1,
      title: 't',
      owner: { id: 1, name: 'a', address: { city: 'd' } },
    });
  });

  test('keeps class methods intact, with and without `onlyProperties`', async () => {
    const em = orm.em.fork();
    const account = await em.findOneOrFail(Account, 1);
    em.assign(account, JSON.parse('{"describe":1,"toObject":2,"toString":3}'));
    em.assign(account, JSON.parse('{"toString":3,"valueOf":4}'), { onlyProperties: true });

    expect(account.describe()).toBe('account n');
    expect(account.toObject()).toEqual({ id: 1, name: 'n' });
    expect(String(account)).toBe('[object Object]');
  });

  test('still assigns other keys that are not entity properties', async () => {
    const em = orm.em.fork();
    const account = await em.findOneOrFail(Account, 1);
    em.assign(account, JSON.parse('{"local":"changed","extra":1,"plainToken":"x"}'));

    expect(account.local).toBe('changed');
    expect((account as unknown as { extra: number }).extra).toBe(1);
    expect(account.token).toBe('hashed:x');
  });

});
