import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, raw } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

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
});

test('raw fragments with orderBy', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Job, {
    orderBy: {
      [raw(alias => `${alias}.DateCompleted`)]: 'desc',
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `j0`.* from `job` as `j0` order by j0.DateCompleted desc');
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
});

test('raw fragments with multiple items in filter', async () => {
  const mock = mockLogger(orm);
  await orm.em.findAll(Tag, {
    where: {
      [raw('id')]: { $gte: 10, $lte: 50 },
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `t0`.* from `tag` as `t0` where id >= 10 and id <= 50');
});
