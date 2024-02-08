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
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

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
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B, C, D],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #5213', async () => {
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

  expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`a_id` as `b1__a_id`, `b1`.`c1_id` as `b1__c1_id`, `b1`.`c2_id` as `b1__c2_id`, `a2`.`id` as `a2__id`, `c3`.`id` as `c3__id`, `c3`.`d_id` as `c3__d_id`, `d4`.`id` as `d4__id`, `d4`.`name` as `d4__name`, `c5`.`id` as `c5__id`, `c5`.`d_id` as `c5__d_id`, `d6`.`id` as `d6__id`, `d6`.`name` as `d6__name` from `a` as `a0` left join `b` as `b1` on `a0`.`id` = `b1`.`a_id` left join `a` as `a2` on `b1`.`a_id` = `a2`.`id` left join `c` as `c3` on `b1`.`c1_id` = `c3`.`id` left join `d` as `d4` on `c3`.`d_id` = `d4`.`id` left join `c` as `c5` on `b1`.`c2_id` = `c5`.`id` left join `d` as `d6` on `c5`.`d_id` = `d6`.`id`');
  expect(mock.mock.calls[1][0]).toMatch('begin');
  expect(mock.mock.calls[2][0]).toMatch('update `b` set `c1_id` = NULL where `id` = 1');
  expect(mock.mock.calls[3][0]).toMatch('delete from `c` where `id` in (1)');
  expect(mock.mock.calls[4][0]).toMatch('commit');
  expect(mock.mock.calls[5][0]).toMatch('select count(*) as `count` from `c` as `c0`');
});
