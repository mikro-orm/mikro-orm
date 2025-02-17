import { MikroORM, ArrayType, Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/mysql';
import { mockLogger } from '../helpers.js';

@Entity()
export class Foo {

  @PrimaryKey()
  id!: number;

  @Property({ type: ArrayType, nullable: true })
  names!: string[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo],
    dbName: `mikro_orm_test_3540`,
    port: 3308,
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 3540', async () => {
  const foo = new Foo();
  foo.id = 1;
  foo.names = [];

  const mock = mockLogger(orm, ['query', 'query-params']);
  await orm.em.persistAndFlush(foo);

  foo.names.push('1');
  await orm.em.flush();

  foo.names.push('2', '3');
  await orm.em.flush();

  foo.names = [];
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `foo` (`id`, `names`) values (1, \'\')'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = \'1\' where `id` = 1'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = \'1,2,3\' where `id` = 1'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = \'\' where `id` = 1'],
    ['[query] commit'],
  ]);
});

test('GH issue 3540 batch update', async () => {
  const foos = [new Foo(), new Foo()];
  foos[0].id = 1;
  foos[0].names = [];
  foos[1].id = 2;
  foos[1].names = [];

  const mock = mockLogger(orm, ['query', 'query-params']);
  await orm.em.persistAndFlush(foos);

  foos[0].names.push('1');
  foos[1].names.push('1');
  await orm.em.flush();

  foos[0].names.push('2', '3');
  foos[1].names.push('2', '3');
  await orm.em.flush();

  foos[0].names = [];
  foos[1].names = [];
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `foo` (`id`, `names`) values (1, \'\'), (2, \'\')'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = case when (`id` = 1) then \'1\' when (`id` = 2) then \'1\' else `names` end where `id` in (1, 2)'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = case when (`id` = 1) then \'1,2,3\' when (`id` = 2) then \'1,2,3\' else `names` end where `id` in (1, 2)'],
    ['[query] commit'],
    ['[query] begin'],
    ['[query] update `foo` set `names` = case when (`id` = 1) then \'\' when (`id` = 2) then \'\' else `names` end where `id` in (1, 2)'],
    ['[query] commit'],
  ]);
});
