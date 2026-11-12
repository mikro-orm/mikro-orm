import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Item)
  items = new Collection<Item>(this);
}

describe('GH issue 8690', () => {
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
    const items = [1, 2, 3].map(id => orm.em.create(Item, { id, name: '' + id }));
    orm.em.create(User, { id: 1, name: 'Foo', items: [items[0], items[2]] });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populate keeps a reference added to an initialized collection', async () => {
    const user = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
    user.items.add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, ['items']);
    expect(user.items.getItems().map(i => i.name)).toEqual(['1', '3', '2']);
  });

  test('populate keeps a reference added to an uninitialized collection', async () => {
    const user = await orm.em.findOneOrFail(User, 1);
    user.items.add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, ['items']);
    expect(user.items.getItems().map(i => i.name)).toEqual(['1', '3', '2']);
  });

  test('populate keeps the unflushed changes of the collection', async () => {
    const user = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
    user.items.remove(user.items[1]);
    user.items.add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, ['items']);
    expect(user.items.getItems().map(i => i.name)).toEqual(['1', '2']);

    await orm.em.flush();
    orm.em.clear();
    const reloaded = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
    expect(reloaded.items.getItems().map(i => i.name)).toEqual(['1', '2']);
  });

  test('populate keeps the items set to an uninitialized collection', async () => {
    const user = await orm.em.findOneOrFail(User, 1);
    user.items.set([orm.em.getReference(Item, 2)]);
    await orm.em.populate(user, ['items']);
    expect(user.items.getItems().map(i => i.name)).toEqual(['2']);

    await orm.em.flush();
    orm.em.clear();
    const reloaded = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
    expect(reloaded.items.getItems().map(i => i.name)).toEqual(['2']);
  });

  test('refresh drops the unflushed changes of the collection', async () => {
    const user = await orm.em.findOneOrFail(User, 1, { populate: ['items'] });
    user.items.add(orm.em.getReference(Item, 2));
    await orm.em.populate(user, ['items'], { refresh: true });
    expect(user.items.getItems().map(i => i.name)).toEqual(['1', '3']);
    expect(user.items.isDirty()).toBe(false);
  });
});
