import { Collection, Entity, Enum, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, QueryOrder } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';
import { mockLogger } from '../../bootstrap';

type Rating = 'bad' | 'ok' | 'good';

enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

// Out of order on purpose
enum Difficulty {
  Easy = 2,
  Hard = 1,
  Medium = 0
}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Task, ({ owner }) => owner)
  tasks = new Collection<Task>(this);

}

@Entity()
class Task {

  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @ManyToOne(() => User, { nullable: true })
  owner?: User;

  @Enum({
    items: () => Priority,
    customOrder: [Priority.Low, Priority.Medium, Priority.High],
    nullable: true,
  })
  priority?: Priority;

  @Property({ customOrder: ['bad', 'ok', 'good'], nullable: true })
  rating?: Rating;

  @Enum({
    items: () => Difficulty,
    customOrder: [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard],
    nullable: true,
  })
  difficulty?: Difficulty;

}

const createWithPriority = (label: string, priority?: Priority) => {
  const t = new Task();
  t.label = label;
  t.priority = priority;
  return t;
};

const createWithRating = (label: string, rating?: Rating) => {
  const t = new Task();
  t.label = label;
  t.rating = rating;
  return t;
};

const createWithDifficulty = (label: string, difficulty?: Difficulty) => {
  const t = new Task();
  t.label = label;
  t.difficulty = difficulty;
  return t;
};

describe('custom order [mysql]', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<MySqlDriver>({
      entities: [Task, User],
      dbName: `mikro_orm_test_custom_order`,
      type: 'mysql',
      port: 3307,
    });

    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });
  beforeEach(async () => {
    await orm.em.nativeDelete(Task, {});
    await orm.em.nativeDelete(User, {});
  });
  afterAll(async () => orm.close(true));

  test('query string enum ASC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithPriority('a', Priority.Medium),
      createWithPriority('b', Priority.High),
      createWithPriority('c', Priority.Low),
      createWithPriority('d'),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { priority: QueryOrder.ASC } });
    expect(tasks.map(({ label }) => label)).toEqual(['d', 'c', 'a', 'b']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`priority` = \'low\' then 0 when `t0`.`priority` = \'medium\' then 1 when `t0`.`priority` = \'high\' then 2 else null end) asc');
  });

  test('query string enum DESC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithPriority('a', Priority.Medium),
      createWithPriority('b', Priority.High),
      createWithPriority('c', Priority.Low),
      createWithPriority('d'),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { priority: QueryOrder.DESC } });
    expect(tasks.map(({ label }) => label)).toEqual(['b', 'a', 'c', 'd']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`priority` = \'low\' then 0 when `t0`.`priority` = \'medium\' then 1 when `t0`.`priority` = \'high\' then 2 else null end) desc');
  });

  test('query raw string ASC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithRating('a', 'good'),
      createWithRating('b', 'bad'),
      createWithRating('c', 'ok'),
      createWithRating('d'),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { rating: QueryOrder.ASC } });
    expect(tasks.map(({ label }) => label)).toEqual(['d', 'b', 'c', 'a']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`rating` = \'bad\' then 0 when `t0`.`rating` = \'ok\' then 1 when `t0`.`rating` = \'good\' then 2 else null end) asc');
  });

  test('query raw string DESC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithRating('a', 'good'),
      createWithRating('b', 'bad'),
      createWithRating('c', 'ok'),
      createWithRating('d'),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { rating: QueryOrder.DESC } });
    expect(tasks.map(({ label }) => label)).toEqual(['a', 'c', 'b', 'd']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`rating` = \'bad\' then 0 when `t0`.`rating` = \'ok\' then 1 when `t0`.`rating` = \'good\' then 2 else null end) desc');
  });

  test('query numeric enum ASC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithDifficulty('a', Difficulty.Hard),
      createWithDifficulty('b'),
      createWithDifficulty('c', Difficulty.Medium),
      createWithDifficulty('d', Difficulty.Easy),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { difficulty: QueryOrder.ASC } });
    expect(tasks.map(({ label }) => label)).toEqual(['b', 'd', 'c', 'a']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`difficulty` = 2 then 0 when `t0`.`difficulty` = 0 then 1 when `t0`.`difficulty` = 1 then 2 else null end) asc');
  });

  test('query numeric enum DESC', async () => {
    const mock = mockLogger(orm);

    await orm.em.persistAndFlush([
      createWithDifficulty('a', Difficulty.Hard),
      createWithDifficulty('b'),
      createWithDifficulty('c', Difficulty.Medium),
      createWithDifficulty('d', Difficulty.Easy),
    ]);
    orm.em.clear();

    const tasks = await orm.em.find(Task, {}, { orderBy: { difficulty: QueryOrder.DESC } });
    expect(tasks.map(({ label }) => label)).toEqual(['a', 'c', 'd', 'b']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`difficulty` = 2 then 0 when `t0`.`difficulty` = 0 then 1 when `t0`.`difficulty` = 1 then 2 else null end) desc');
  });

  test('multiple order', async () => {
    const mock = mockLogger(orm);

    const { em } = orm;

    await em.persistAndFlush([
      em.create(Task, { label: 'a', priority: Priority.High, difficulty: Difficulty.Easy }),
      em.create(Task, { label: 'b', priority: Priority.High, difficulty: Difficulty.Hard }),
      em.create(Task, { label: 'c', priority: Priority.Low, difficulty: Difficulty.Hard }),
      em.create(Task, { label: 'd', priority: Priority.Medium, difficulty: Difficulty.Medium }),
      em.create(Task, { label: 'e', priority: Priority.Low, difficulty: Difficulty.Easy }),
      em.create(Task, { label: 'f', priority: Priority.High, difficulty: Difficulty.Medium }),
    ]);
    em.clear();

    const tasks = await em.find(Task, {}, { orderBy: { priority: QueryOrder.ASC, difficulty: QueryOrder.DESC } });
    expect(tasks.map(({ label }) => label)).toEqual(['c', 'e', 'd', 'b', 'f', 'a']);
    expect(mock.mock.calls[3][0]).toMatch('select `t0`.* from `task` as `t0` order by (case when `t0`.`priority` = \'low\' then 0 when `t0`.`priority` = \'medium\' then 1 when `t0`.`priority` = \'high\' then 2 else null end) asc, (case when `t0`.`difficulty` = 2 then 0 when `t0`.`difficulty` = 0 then 1 when `t0`.`difficulty` = 1 then 2 else null end) desc');
  });

  test('as a relation', async () => {
    const mock = mockLogger(orm);

    const { em } = orm;

    const user1 = em.create(User, { name: 'u1' });
    const user2 = em.create(User, { name: 'u2' });

    user1.tasks.add(em.create(Task, { label: '1a', priority: Priority.High }));
    user1.tasks.add(em.create(Task, { label: '1b', priority: Priority.Medium }));
    user1.tasks.add(em.create(Task, { label: '1c', priority: Priority.Low }));

    user2.tasks.add(em.create(Task, { label: '2a', priority: Priority.Medium }));
    user2.tasks.add(em.create(Task, { label: '2b', priority: Priority.Low }));
    user2.tasks.add(em.create(Task, { label: '2c', priority: Priority.High }));

    await em.persistAndFlush([user1, user2]);
    em.clear();

    const users = await em.find(User, {}, {
      populate: ['tasks'],
      orderBy: {
        name: QueryOrder.ASC,
        tasks: {
          priority: QueryOrder.ASC,
        },
      },
    });

    const ret = users.flatMap(u => u.tasks.getItems()).map(({ owner, label }) => `${owner?.name}-${label}`);
    expect(ret).toEqual(['u1-1c', 'u1-1b', 'u1-1a', 'u2-2b', 'u2-2a', 'u2-2c']);
    expect(mock.mock.calls[4][0]).toMatch('select `u0`.* from `user` as `u0` left join `task` as `t1` on `u0`.`id` = `t1`.`owner_id` order by `u0`.`name` asc, (case when `t1`.`priority` = \'low\' then 0 when `t1`.`priority` = \'medium\' then 1 when `t1`.`priority` = \'high\' then 2 else null end) asc');
    expect(mock.mock.calls[5][0]).toMatch('select `t0`.* from `task` as `t0` where `t0`.`owner_id` in (1, 2) order by (case when `t0`.`priority` = \'low\' then 0 when `t0`.`priority` = \'medium\' then 1 when `t0`.`priority` = \'high\' then 2 else null end) asc, `t0`.`owner_id` asc');
  });
});
