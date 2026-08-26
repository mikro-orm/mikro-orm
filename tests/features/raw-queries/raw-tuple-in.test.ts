import { MikroORM, raw } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tool {
  @PrimaryKey()
  id!: number;

  @Property()
  classId: number;

  @Property()
  roleId: number;

  constructor(classId: number, roleId: number) {
    this.classId = classId;
    this.roleId = roleId;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Tool],
  });
  await orm.schema.create();

  orm.em.create(Tool, { classId: 1, roleId: 1 });
  orm.em.create(Tool, { classId: 1, roleId: 2 });
  orm.em.create(Tool, { classId: 2, roleId: 1 });
  orm.em.create(Tool, { classId: 2, roleId: 2 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

// A raw key can hold a column tuple, and the pairs are meaningful together --
// `classId in (1, 2) and roleId in (1, 2)` is a different, wider condition.
const tupleKey = () => raw('(`tool`.`class_id`, `tool`.`role_id`)');

test('tuple $in on a raw key renders a row-value comparison', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id', 'classId', 'roleId'])
    .where({
      [tupleKey()]: {
        $in: [
          [-1, -1],
          [1, 1],
          [2, 2],
        ],
      },
    });

  expect(qb.getFormattedQuery()).toBe(
    'select `tool`.`id`, `tool`.`class_id`, `tool`.`role_id` from `tool` as `tool` ' +
      'where (`tool`.`class_id`, `tool`.`role_id`) in ((-1, -1), (1, 1), (2, 2))',
  );

  const rows = await qb.getResult();
  expect(rows.map(r => [r.classId, r.roleId])).toEqual([
    [1, 1],
    [2, 2],
  ]);
});

test('tuple $nin on a raw key renders a row-value comparison', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id', 'classId', 'roleId'])
    .where({
      [tupleKey()]: {
        $nin: [
          [1, 1],
          [2, 2],
        ],
      },
    })
    .orderBy({ classId: 'asc', roleId: 'asc' });

  expect(qb.getFormattedQuery()).toBe(
    'select `tool`.`id`, `tool`.`class_id`, `tool`.`role_id` from `tool` as `tool` ' +
      'where (`tool`.`class_id`, `tool`.`role_id`) not in ((1, 1), (2, 2)) ' +
      'order by `tool`.`class_id` asc, `tool`.`role_id` asc',
  );

  const rows = await qb.getResult();
  expect(rows.map(r => [r.classId, r.roleId])).toEqual([
    [1, 2],
    [2, 1],
  ]);
});

test('a single tuple is still wrapped as a row value', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id'])
    .where({ [tupleKey()]: { $in: [[1, 2]] } });

  expect(qb.getFormattedQuery()).toBe(
    'select `tool`.`id` from `tool` as `tool` where (`tool`.`class_id`, `tool`.`role_id`) in ((1, 2))',
  );
  await expect(qb.getResult()).resolves.toHaveLength(1);
});

test('a flat array on a raw key stays a scalar list', async () => {
  // the arity of a raw key is opaque, so a flat array keeps its scalar meaning;
  // pass `[[1, 1]]` to ask for a single tuple
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id'])
    .where({ [raw('`tool`.`class_id`')]: { $in: [1, 2] } });

  expect(qb.getFormattedQuery()).toBe('select `tool`.`id` from `tool` as `tool` where `tool`.`class_id` in (1, 2)');
  await expect(qb.getResult()).resolves.toHaveLength(4);
});

test('an empty tuple list is still a contradiction', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id'])
    .where({ [tupleKey()]: { $in: [] } });

  expect(qb.getFormattedQuery()).toBe('select `tool`.`id` from `tool` as `tool` where 1 = 0');
  await expect(qb.getResult()).resolves.toHaveLength(0);
});
