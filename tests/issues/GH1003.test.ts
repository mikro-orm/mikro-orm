import type { IdentifiedReference } from '@mikro-orm/core';
import { BaseEntity, Collection, Entity, ManyToOne, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class Parent extends BaseEntity<Parent, 'id'> {

  @PrimaryKey()
  id!: string;

  @OneToMany({ entity: 'Child', mappedBy: 'parent' })
  children = new Collection<Child>(this);

}

@Entity()
export class Child extends BaseEntity<Parent, 'id'> {

  @PrimaryKey()
  id!: string;

  @ManyToOne({
    entity: () => Parent,
    wrappedReference: true,
    index: true,
    onDelete: 'cascade',
  })
  parent!: IdentifiedReference<Parent>;

}

describe('GH issue 1003', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Child, Parent],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1003`, async () => {
    const parent = orm.em.create(Parent, { id: 'parentId' });
    const child1 = orm.em.create(Child, { id: 'childId1', parent });
    const child2 = orm.em.create(Child, { id: 'childId2', parent });
    parent.children.add(child1, child2);
    await orm.em.persist(parent).flush();
    orm.em.clear();

    const removeStack = orm.em.getUnitOfWork().getRemoveStack();
    const storedParent = await orm.em.findOneOrFail(Parent, 'parentId', { populate: ['children'] });
    const removeChild = storedParent.children[0];
    expect(removeStack.size).toBe(0);
    orm.em.remove(removeChild); // Remove child
    expect(removeStack.size).toBe(1);

    // Add unrelated child to same parent
    const newChild = orm.em.create(Child, { id: 'newChildId', parent: storedParent });
    expect(removeStack.size).toBe(1);
    orm.em.persist(newChild);
    expect(removeStack.size).toBe(1);
    await orm.em.flush();
    expect(newChild.toPOJO()).toEqual({
      id: 'newChildId',
      parent: {
        id: 'parentId',
        children: [
          { id: 'childId2', parent: { id: 'parentId' } },
          { id: 'newChildId' },
        ],
      },
    });
  });

});
