import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Parent {

  @PrimaryKey()
  id!: number;

  @OneToMany('Child', 'parent')
  children = new Collection<Child>(this);

}

@Entity()
export class Child {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Parent, wrappedReference: true })
  parent!: IdentifiedReference<Parent>;

}

describe('GH issue 2406', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Parent, Child],
      dbName: ':memory:',
      forceEntityConstructor: true,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should fetch children when forceEntityConstructor is turned on', async () => {
    const parent = orm.em.create(Parent, {});
    expect(parent.children.isInitialized()).toBe(true);
    expect(parent.children.isDirty()).toBe(false);
    const child = orm.em.create(Child, { parent });
    expect(parent.children.isDirty()).toBe(true);
    await orm.em.persistAndFlush(child);

    const refreshed = await orm.em.fork().findOneOrFail(Parent, parent.id);
    expect(refreshed.children.isInitialized()).toBe(false);
    expect(refreshed.children.isDirty()).toBe(false);
    await refreshed.children.loadItems();
    expect(refreshed.children.isInitialized()).toBe(true);
    expect(refreshed.children).toHaveLength(1);
  });

  test('create and assign collection items', async () => {
    const parent = orm.em.create(Parent, {
      children: [{}, {}],
    });
    await orm.em.persistAndFlush(parent);

    const refreshed = await orm.em.fork().findOneOrFail(Parent, parent.id);
    expect(refreshed.children.isInitialized()).toBe(false);
    expect(refreshed.children.isDirty()).toBe(false);
    await refreshed.children.loadItems();
    expect(refreshed.children.isInitialized()).toBe(true);
    expect(refreshed.children).toHaveLength(2);
  });

});
