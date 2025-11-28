import { DeferMode, MikroORM, Ref, Reference } from '@mikro-orm/postgresql';

import { Entity, ManyToOne, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Parent {

  @PrimaryKey()
  id!: number;

}

@Entity()
class Child {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent, { ref: true, deferMode: DeferMode.INITIALLY_DEFERRED })
  parent!: Ref<Parent>;

}

@Entity()
class Child1 {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Parent, { ref: true, deferMode: DeferMode.INITIALLY_DEFERRED })
  parent!: Ref<Parent>;

}

describe('deferrable constraints in postgres', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Parent, Child, Child1],
      dbName: `mikro_orm_test_deferrable`,
    });
    await orm.schema.refreshDatabase();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('insert deferred', async () => {
    await orm.em.transactional(async em => {
      const parent = new Parent();
      parent.id = 1;
      const child = new Child();
      child.id = 1;
      child.parent = Reference.createFromPK(Parent, 1);

      await em.persistAndFlush(child);
      await em.persistAndFlush(parent);
    });
  });

  test('replace one-to-one', async () => {
    const parent1 = new Parent();
    parent1.id = 1;
    const parent2 = new Parent();
    parent2.id = 2;
    const child1 = new Child1();
    child1.id = 1;
    child1.parent = Reference.createFromPK(Parent, 1);
    const child2 = new Child1();
    child2.id = 2;
    child2.parent = Reference.createFromPK(Parent, 2);

    await orm.em.persistAndFlush(parent1);
    await orm.em.persistAndFlush(parent2);
    await orm.em.persistAndFlush(child1);
    await orm.em.persistAndFlush(child2);

    await orm.em.transactional(async em => {
      child2.parent = Reference.createFromPK(Parent, 1);
      child1.parent = Reference.createFromPK(Parent, 2);

      em.persist([child1, child2]);
    });
  });

});
