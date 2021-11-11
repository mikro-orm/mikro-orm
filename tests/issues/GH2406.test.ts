import {
  Collection,
  Entity,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
} from '@mikro-orm/core';
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
      dbName: 'mikro_orm_test_2406',
      forceEntityConstructor: true,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should fetch children when forceEntityConstructor is turned on', async () => {
    const parent = new Parent();

    await orm.em.persistAndFlush(parent);

    const child = orm.em.create(Child, { parent });

    await orm.em.persistAndFlush(child);

    const forked = await orm.em.fork({ clear: true });

    const refreshed = await forked.findOneOrFail(Parent, parent.id);

    await refreshed.children.loadItems();

    expect(refreshed.children).toHaveLength(1);
  });

});
