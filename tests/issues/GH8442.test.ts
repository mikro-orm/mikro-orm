import { EntitySchema, MikroORM, type Opt, wrap } from '@mikro-orm/sqlite';

class Owner {
  id!: number;
  createdAt!: Date;

  get age(): Opt<number> {
    return Date.now() - this.createdAt.getTime();
  }
}

class Item {
  id!: number;
  quantity!: number;
  owner!: Owner;
}

const OwnerSchema = new EntitySchema({
  class: Owner,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'datetime' },
    age: { type: 'number', persist: false, getter: true },
  },
});

const ItemSchema = new EntitySchema({
  class: Item,
  properties: {
    id: { type: 'number', primary: true },
    quantity: { type: 'number' },
    owner: { kind: 'm:1', entity: () => Owner },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [OwnerSchema, ItemSchema], dbName: ':memory:' });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(Owner, { id: 1, createdAt: new Date() });
  em.create(Item, { id: 1, quantity: 1, owner: 1 });
  await em.flush();
});

afterAll(() => orm.close(true));

test('refresh does not read scalars of uninitialized references', async () => {
  const em = orm.em.fork();
  const item = await em.findOneOrFail(Item, 1);
  expect(wrap(item.owner).isInitialized()).toBe(false);
  await orm.em.nativeUpdate(Item, 1, { quantity: 2 });

  await em.refresh(item);
  expect(item.quantity).toBe(2);
  expect(item.owner.id).toBe(1);
  expect(wrap(item.owner).isInitialized()).toBe(false);
});

test('refresh keeps scalars of a loaded entity referenced by the refreshed one', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1);
  const createdAt = owner.createdAt;
  const item = await em.findOneOrFail(Item, 1);

  await em.refresh(item);
  expect(item.owner).toBe(owner);
  expect(owner.createdAt).toEqual(createdAt);
  expect(owner.age).toBeGreaterThanOrEqual(0);
});
