import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ManyToMany, Collection, ref, SimpleLogger } from '@mikro-orm/core';
import { mockLogger } from '../helpers.js';

@Entity()
export class Parent {

  @PrimaryKey()
  id!: string;

  @Property()
  createdAt!: Date;

  @ManyToMany({ entity: () => Child, owner: true })
  refs = new Collection<Child>(this);

}

@Entity()
export class Child {

  @PrimaryKey()
  id!: string;

  @Property()
  createdAt!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Parent],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH 4027', async () => {
  const mock = mockLogger(orm);

  // Child entity create
  let em = orm.em.fork();

  const e2 = new Child();
  e2.id = 'e80ccf60-5cb2-4972-9227-7a4b9138c845';
  e2.createdAt = new Date(1676050010440);

  em.persist(e2);

  await em.flush();

  // Parent referencing child create
  em = orm.em.fork();
  const e1 = new Parent();
  e1.id = '9a061473-4a98-477d-ad03-fd7bcba3ec4f';
  e1.createdAt = new Date(1676050010441);
  e1.refs.set([ref(Child, e2.id)]);
  em.persist(e1);

  await em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into `child` (`id`, `created_at`) values ('e80ccf60-5cb2-4972-9227-7a4b9138c845', 1676050010440)"],
    ['[query] commit'],
    ['[query] begin'],
    ["[query] insert into `parent` (`id`, `created_at`) values ('9a061473-4a98-477d-ad03-fd7bcba3ec4f', 1676050010441)"],
    ["[query] insert into `parent_refs` (`child_id`, `parent_id`) values ('e80ccf60-5cb2-4972-9227-7a4b9138c845', '9a061473-4a98-477d-ad03-fd7bcba3ec4f')"],
    ['[query] commit'],
  ]);
});
