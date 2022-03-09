import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  RequestContext
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Parent {
  @PrimaryKey()
  id!: number

  @OneToMany(() => Child, child => child.parent)
  children = new Collection<Child>(this);
}

@Entity()
export default class Child {
  @PrimaryKey()
  id!: number

  @ManyToOne(() => Parent)
  parent!: Parent;
}

describe('GH issue 2882', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Parent, Child],
    });
    await orm.getSchemaGenerator().refreshDatabase();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should not leave duplicate entity in collection`, async () => {
    let parentId: number
    await RequestContext.createAsync(orm.em, async () => {
      const parent = orm.em.create(Parent, {})
      await orm.em.persistAndFlush(parent)
      parentId = parent.id
    })

    await RequestContext.createAsync(orm.em, async () => {
      const parent = await orm.em.findOneOrFail(Parent, { id: parentId }, { populate: ['children'] })

      await orm.em.transactional(async (em) => {
        const parent = await em.findOneOrFail(Parent, { id: parentId })
        em.create(Child, { parent })
      })

      await orm.em.find(Child, {})

      expect(parent.children).toHaveLength(1)
    })
  });

});
