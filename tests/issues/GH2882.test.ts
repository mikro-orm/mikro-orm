import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Parent {

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

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
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
    expect(wrap(parent, true).__em.id).toBe(1);

    await orm.em.transactional(async em => {
      const parent = await em.findOneOrFail(Parent, p.id);
      em.create(Child, { parent });
    });

    expect(parent.children).toHaveLength(1);
    expect(wrap(parent.children[0], true).__em.id).toBe(1);
    await orm.em.find(Child, {});

    expect(parent.children).toHaveLength(1);
    expect(wrap(parent.children[0], true).__em.id).toBe(1);
  });

});
