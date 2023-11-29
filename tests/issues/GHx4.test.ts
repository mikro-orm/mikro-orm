import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Parent {

  @PrimaryKey()
  id!: string;

  @OneToMany({ entity: 'Child', mappedBy: 'parent', orphanRemoval: true })
  children = new Collection<Child>(this);

  @OneToMany({ entity: 'Child2', mappedBy: 'parent' })
  children2 = new Collection<Child>(this);

}

@Entity()
class Child {

  @PrimaryKey()
  id!: string;

  @ManyToOne({ entity: () => Parent })
  parent!: Parent;

}

@Entity()
class Child2 {

  @PrimaryKey()
  id!: string;

  @ManyToOne({ entity: () => Parent, nullable: true })
  parent!: Parent;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Child, Child2, Parent],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`orphan removal`, async () => {
  const parent = orm.em.create(Parent, { id: 'parentId' });
  const child1 = orm.em.create(Child, { id: 'childId1', parent });
  const child2 = orm.em.create(Child, { id: 'childId2', parent });
  parent.children.add(child1, child2);
  await orm.em.flush();
  orm.em.clear();

  const storedParent = await orm.em.findOneOrFail(Parent, 'parentId');

  const newChild = orm.em.create(Child, { id: 'newChildId', parent: storedParent });
  storedParent.children.set([newChild]);
  await orm.em.flush();
  orm.em.clear();

  const storedParent2 = await orm.em.findOneOrFail(Parent, 'parentId', { populate: ['children'] });
  expect(storedParent2.children).toHaveLength(1);
  const children = await orm.em.find(Child, {});
  expect(children).toHaveLength(1);
});

test(`unsetting the FK`, async () => {
  const parent = orm.em.create(Parent, { id: 'parentId' });
  const child1 = orm.em.create(Child2, { id: 'childId1', parent });
  const child2 = orm.em.create(Child2, { id: 'childId2', parent });
  parent.children2.add(child1, child2);
  await orm.em.flush();
  orm.em.clear();

  const storedParent = await orm.em.findOneOrFail(Parent, 'parentId');

  const newChild = orm.em.create(Child2, { id: 'newChildId', parent: storedParent });
  storedParent.children2.set([newChild]);
  await orm.em.flush();
  orm.em.clear();

  const storedParent2 = await orm.em.findOneOrFail(Parent, 'parentId', { populate: ['children2'] });
  expect(storedParent2.children2).toHaveLength(1);
  const children = await orm.em.find(Child2, {});
  expect(children).toHaveLength(3);
});
