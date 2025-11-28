import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Parent {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Child, child => child.parent)
  children = new Collection<Child>(this);

}

@Entity()
export default class Child {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent)
  parent!: Parent;

}

describe('GH issue 2882', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Parent, Child],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should not leave duplicate entity in collection`, async () => {
    const p = new Parent();
    await orm.em.fork().persistAndFlush(p);

    const parent = await orm.em.findOneOrFail(Parent, p.id, { populate: ['children'] });
    expect(parent.children).toHaveLength(0);
    expect(wrap(parent, true).__em?.id).toBe(1);

    await orm.em.transactional(async em => {
      // const parent = await em.findOneOrFail(Parent, p.id);
      em.create(Child, { parent });
      expect(wrap(parent, true).__em?.id).not.toBe(1);
    });

    expect(parent.children).toHaveLength(1);
    expect(wrap(parent.children[0], true).__em?.id).toBe(1);
    await orm.em.find(Child, {});

    expect(parent.children).toHaveLength(1);
    expect(wrap(parent.children[0], true).__em?.id).toBe(1);
  });

});
