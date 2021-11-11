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

  @ManyToOne(() => Parent, { fieldName:'foobar', wrappedReference: true })
  parent!: IdentifiedReference<Parent>;

}


describe('GH issue 2400', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Parent, Child],
      dbName: 'mikro_orm_test_2395',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should not persist child if marked for removal', async () => {
      const parent = orm.em.create(Parent, {});

      orm.em.persist(parent);

      const instance = orm.em.create(Child, { parent });

      orm.em.persist(instance);

      orm.em.remove(instance);

      await orm.em.flush();

      const count = await orm.em.count(Child, {});

      expect(count).toBe(0);

      const found = await orm.em.find(Child, {});

      expect(found).toHaveLength(0);
  });

});
