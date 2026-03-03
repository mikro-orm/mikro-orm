import { BaseEntity, Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import type { Ref } from '@mikro-orm/sqlite';

@Entity()
class Parent extends BaseEntity {
  @PrimaryKey()
  id!: string;

  @OneToMany({ entity: () => Child, mappedBy: 'parent' })
  children = new Collection<Child>(this);
}

@Entity()
class Child extends BaseEntity {
  @PrimaryKey()
  id!: string;

  @ManyToOne({
    entity: () => Parent,
    ref: true,
    index: true,
    deleteRule: 'cascade',
  })
  parent!: Ref<Parent>;
}

describe('GH issue 1003', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Child, Parent],
      dbName: ':memory:',
    });
    await orm.schema.create();
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
        children: [{ id: 'childId2', parent: { id: 'parentId' } }, { id: 'newChildId' }],
      },
    });
  });
});
