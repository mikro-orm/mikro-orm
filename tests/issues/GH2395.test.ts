import { Cascade, Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Parent {

  @PrimaryKey()
  id!: number;

  @OneToMany('Child', 'parent')
  children = new Collection<Child>(this);

  @OneToMany('Child2', 'parent')
  children2 = new Collection<Child>(this);

  @OneToMany('Child3', 'parent', { orphanRemoval: true })
  children3 = new Collection<Child>(this);

}

@Entity()
export class Child {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { wrappedReference: true })
  parent!: IdentifiedReference<Parent>;

}

@Entity()
export class Child2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { wrappedReference: true, cascade: [Cascade.ALL] })
  parent!: IdentifiedReference<Parent>;

}

@Entity()
export class Child3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { wrappedReference: true })
  parent!: IdentifiedReference<Parent>;

}

describe('GH issue 2395', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Parent, Child, Child2, Child3],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('should not persist child if marked for removal 1/3', async () => {
    const parent = orm.em.create(Parent, {});
    orm.em.persist(parent);

    const instance = orm.em.create(Child, { parent });
    orm.em.persist(instance);
    orm.em.remove(instance);
    await orm.em.flush();
    expect(parent.children).toHaveLength(0);

    const count = await orm.em.count(Child, {});
    expect(count).toBe(0);

    const found = await orm.em.find(Child, {});
    expect(found).toHaveLength(0);
  });

  test('should not persist child if marked for removal 2/3', async () => {
    const parent = orm.em.create(Parent, {});
    orm.em.persist(parent);

    const instance = orm.em.create(Child2, { parent });
    orm.em.persist(instance);
    orm.em.remove(instance);
    await orm.em.flush();
    expect(parent.children2).toHaveLength(0);

    const count = await orm.em.count(Child2, {});
    expect(count).toBe(0);

    const found = await orm.em.find(Child2, {});
    expect(found).toHaveLength(0);
  });

  test('should not persist child if marked for removal 3/3', async () => {
    const parent = orm.em.create(Parent, {});
    orm.em.persist(parent);

    const instance = orm.em.create(Child3, { parent });
    orm.em.persist(instance);
    orm.em.remove(instance);
    await orm.em.flush();
    expect(parent.children3).toHaveLength(0);

    const count = await orm.em.count(Child3, {});
    expect(count).toBe(0);

    const found = await orm.em.find(Child3, {});
    expect(found).toHaveLength(0);
  });

});
