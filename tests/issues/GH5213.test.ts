import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/libsql';
import { mockLogger } from '../helpers.js';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => B, b => b.a, { eager: true, orphanRemoval: true })
  b = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A, deleteRule: 'cascade', updateRule: 'cascade' })
  a!: Ref<A>;

  @OneToOne(() => C, c => c.b1, { owner: true, nullable: true, default: null, orphanRemoval: true })
  c1!: Ref<C> | null;

  @OneToOne(() => C, c => c.b2, { owner: true, nullable: true, default: null, orphanRemoval: true })
  c2!: Ref<C> | null;

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => D, deleteRule: 'cascade', updateRule: 'cascade', eager: true })
  d!: Ref<D>;

  @OneToOne(() => B, b => b.c1, { nullable: true })
  b1!: B | null;

  @OneToOne(() => B, b => b.c2, { nullable: true })
  b2!: B | null;

}

@Entity()
class D {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    dbName: ':memory:',
    entities: [A, B, C, D],
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #5213 1/2', async () => {
  orm.em.create(A, {
    b: [{
      c1: {
        d: { name: 'test' },
      },
    }],
  });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const [a] = await orm.em.findAll(A, { populate: ['b'] });

  a.b.getItems().forEach(b => orm.em.assign(b, {
    c1: null,
    c2: null,
  }));

  await orm.em.flush();
  orm.em.clear();

  const count = await orm.em.count(C);

  // expecting that count is 0, because the only existing C is not referenced in any B anymore
  expect(count).toBe(0);

  expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`a_id` as `b1__a_id`, `b1`.`c1_id` as `b1__c1_id`, `b1`.`c2_id` as `b1__c2_id` from `a` as `a0` left join `b` as `b1` on `a0`.`id` = `b1`.`a_id`');
  expect(mock.mock.calls[1][0]).toMatch('begin');
  expect(mock.mock.calls[2][0]).toMatch('update `b` set `c1_id` = NULL where `id` = 1');
  expect(mock.mock.calls[3][0]).toMatch('delete from `c` where `id` in (1)');
  expect(mock.mock.calls[4][0]).toMatch('commit');
  expect(mock.mock.calls[5][0]).toMatch('select count(*) as `count` from `c` as `c0`');
});

test('GH #5213 2/2', async () => {
  orm.em.create(A, {
    b: [{
      c1: {
        d: { name: 'test' },
      },
    }],
  });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const [a] = await orm.em.findAll(A, { populate: ['b.*'] });

  a.b.getItems().forEach(b => orm.em.assign(b, {
    c1: null,
    c2: null,
  }));

  await orm.em.flush();
  orm.em.clear();

  const count = await orm.em.count(C);

  // expecting that count is 0, because the only existing C is not referenced in any B anymore
  expect(count).toBe(0);

  expect(mock.mock.calls[0][0]).toMatch('select `a0`.*');
  expect(mock.mock.calls[1][0]).toMatch('begin');
  expect(mock.mock.calls[2][0]).toMatch('update `b` set `c1_id` = NULL where `id` = 1');
  expect(mock.mock.calls[3][0]).toMatch('delete from `c` where `id` in (1)');
  expect(mock.mock.calls[4][0]).toMatch('commit');
  expect(mock.mock.calls[5][0]).toMatch('select count(*) as `count` from `c` as `c0`');
});
