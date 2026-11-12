import { Collection, MikroORM, type Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => User, { nullable: true, ref: true })
  owner?: Ref<User>;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Item)
  items = new Collection<Item>(this);

  @OneToMany(() => Item, item => item.owner)
  owned = new Collection<Item>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Item],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const items = [1, 2, 3].map(id => orm.em.create(Item, { id, name: `${id}` }));
  orm.em.create(User, { id: 1, name: 'Foo', items: [items[0], items[2]], owned: [items[0], items[2]] });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test.each(['items', 'owned'] as const)(
  'populate keeps a reference added to an initialized collection (%s)',
  async prop => {
    const user = await orm.em.findOneOrFail(User, 1, { populate: [prop] });
    user[prop].add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, [prop]);
    expect(user[prop].getItems().map(i => i.name)).toEqual(['1', '3', '2']);

    await orm.em.flush();
    orm.em.clear();
    const reloaded = await orm.em.findOneOrFail(User, 1, { populate: [prop] });
    expect(reloaded[prop].getItems().map(i => i.name)).toEqual(['1', '2', '3']);
  },
);

test.each(['items', 'owned'] as const)(
  'populate keeps unflushed removals of an initialized collection (%s)',
  async prop => {
    const user = await orm.em.findOneOrFail(User, 1, { populate: [prop] });
    user[prop].remove(user[prop][1]);
    user[prop].add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, [prop]);
    expect(user[prop].getItems().map(i => i.name)).toEqual(['1', '2']);
  },
);

test.each(['items', 'owned'] as const)(
  'populate keeps a reference added to an uninitialized collection (%s)',
  async prop => {
    const user = await orm.em.findOneOrFail(User, 1);
    user[prop].add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, [prop]);
    // the 1:m owner is auto-flushed before the collection gets loaded, so the order differs
    const names = user[prop].getItems().map(i => i.name);
    expect(names.sort()).toEqual(['1', '2', '3']);
  },
);

test.each(['items', 'owned'] as const)(
  'populate keeps a reference added to an uninitialized collection when loading references (%s)',
  async prop => {
    const user = await orm.em.findOneOrFail(User, 1);
    user[prop].add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, [`${prop}:ref`]);
    const ids = user[prop].getItems().map(i => i.id);
    expect(ids.sort()).toEqual([1, 2, 3]);
  },
);

test('populate does not touch a readonly collection changed via propagation', async () => {
  const user = await orm.em.findOneOrFail(User, 1);
  await user.owned.matching({ where: { name: '1' }, store: true });
  await orm.em.find(Item, {});
  expect(user.owned.isDirty()).toBe(true);
  await orm.em.populate(user, ['owned']);
  expect(user.owned.getItems().map(i => i.name)).toEqual(['1', '3']);
});

test('refresh drops unflushed changes of the collection', async () => {
  const user = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
  user.items.add(orm.em.getReference(Item, 2));
  await orm.em.populate(user, ['items'], { refresh: true });
  expect(user.items.getItems().map(i => i.name)).toEqual(['1', '3']);
});

test('populate with a limit ignores unflushed changes of an uninitialized collection', async () => {
  const user = await orm.em.findOneOrFail(User, 1);
  user.items.add(orm.em.getReference(Item, 2));
  await orm.em.populate(user, ['items'], { populateHints: { items: { limit: 1 } } });
  expect(user.items.getItems().map(i => i.name)).toEqual(['1']);
});
