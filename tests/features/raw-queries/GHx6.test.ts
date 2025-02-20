import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  QueryOrder,
  raw,
  RawQueryFragment,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Job {

  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'DateCompleted', nullable: true })
  dateCompleted?: Date | null;

}

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  created?: Date | null;

  @ManyToOne(() => Job, { name: 'custom_name' })
  job!: Job;

  @ManyToMany(() => Job)
  jobs = new Collection<Job>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [Job, Tag],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('raw fragments with findAndCount', async () => {
  await orm.em.findAndCount(Job, {
    dateCompleted: { $ne: null },
    [raw(alias => `${alias}.DateCompleted`)]: '2023-07-24',
  });
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('raw fragments as only key in conditions object', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(Job, {
    [raw('1 = 1')]: [],
  });
  expect(mock.mock.calls[0][0]).toMatch('select `j0`.* from `job` as `j0` where 1 = 1');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('raw fragments with orderBy', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Job, {
    orderBy: {
      [raw(alias => `${alias}.DateCompleted`)]: 'desc',
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `j0`.* from `job` as `j0` order by j0.DateCompleted desc');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('raw fragments with orderBy on relation', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Tag, {
    populate: ['job'],
    orderBy: {
      job: {
        [raw(alias => `${alias}.DateCompleted`)]: 'desc',
      },
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `t0`.*, `j1`.`id` as `j1__id`, `j1`.`DateCompleted` as `j1__DateCompleted` ' +
    'from `tag` as `t0` ' +
    'left join `job` as `j1` on `t0`.`custom_name` = `j1`.`id` ' +
    'order by j1.DateCompleted desc');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('raw fragments with populateOrderBy on relation', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Tag, {
    populate: ['job'],
    populateOrderBy: {
      [raw(alias => `${alias}.created`)]: 'desc',
      job: {
        [raw(alias => `${alias}.DateCompleted`)]: 'desc',
      },
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `t0`.*, `j1`.`id` as `j1__id`, `j1`.`DateCompleted` as `j1__DateCompleted` ' +
    'from `tag` as `t0` ' +
    'left join `job` as `j1` on `t0`.`custom_name` = `j1`.`id` ' +
    'order by t0.created desc, j1.DateCompleted desc');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('raw fragments with multiple items in filter', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Tag, {
    where: {
      [raw('id')]: { $gte: 10, $lte: 50 },
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `t0`.* from `tag` as `t0` where id >= 10 and id <= 50');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('qb.joinAndSelect', async () => {
  const query = orm.em.qb(Tag, 'u')
    .select('*')
    .leftJoinAndSelect('jobs', 'a')
    .where({
      [raw('coalesce("u"."name", ?)', ['abc'])]: { $gte: 0.3 },
    })
    .orderBy({
      [raw('coalesce(u."name", ?)', ['def'])]: QueryOrder.DESC_NULLS_LAST,
    })
    .limit(100)
    .offset(0);
  expect(query.toQuery().sql).toMatch('select `u`.*, `a`.`id` as `a__id`, `a`.`DateCompleted` as `a__DateCompleted` ' +
    'from `tag` as `u` ' +
    'left join `tag_jobs` as `t1` on `u`.`id` = `t1`.`tag_id` ' +
    'left join `job` as `a` on `t1`.`job_id` = `a`.`id` ' +
    'where `u`.`id` in (select `u`.`id` from (select `u`.`id` from `tag` as `u` left join `tag_jobs` as `t1` on `u`.`id` = `t1`.`tag_id` left join `job` as `a` on `t1`.`job_id` = `a`.`id` where coalesce("u"."name", \'abc\') >= ? group by `u`.`id` order by coalesce(u."name", \'def\') desc nulls last limit ?) as `u`) ' +
    'order by coalesce(u."name", \'def\') desc nulls last');
  await query.getResult();
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});

test('em.findByCursor', async () => {
  const mock = mockLogger(orm);
  await orm.em.findByCursor(Tag, {}, {
    populate: ['job'],
    first: 3,
    orderBy: {
      [raw(alias => `${alias}.created`)]: 'desc',
      job: {
        [raw(alias => `${alias}.DateCompleted`)]: 'desc',
      },
    },
  });
  const queries = mock.mock.calls.flat().sort();
  expect(queries[0]).toMatch('select `t0`.*, `j1`.`id` as `j1__id`, `j1`.`DateCompleted` as `j1__DateCompleted` ' +
    'from `tag` as `t0` ' +
    'left join `job` as `j1` on `t0`.`custom_name` = `j1`.`id` ' +
    'order by t0.created desc, j1.DateCompleted desc');
  expect(RawQueryFragment.checkCacheSize()).toBe(0);
});
