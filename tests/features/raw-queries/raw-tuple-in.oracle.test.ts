import { MikroORM, raw } from '@mikro-orm/oracledb';
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
    entities: [Tool],
    dbName: 'mikro_orm_test_raw_tuple_in',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();

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
//
// `OraclePlatform.allowsComparingTuples()` returns false, so the ORM avoids row values when it
// renders a composite key itself. That opt-out is more conservative than the database requires:
// Oracle does accept row-value comparisons, and a raw fragment gets them either way, since its
// column names are not recoverable from the SQL string and cannot be compared one by one.
const tupleKey = () => raw('("tool"."class_id", "tool"."role_id")');

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
    })
    .orderBy({ classId: 'asc' });

  expect(qb.getFormattedQuery()).toBe(
    'select "tool"."id", "tool"."class_id", "tool"."role_id" from "tool" "tool" ' +
      'where ("tool"."class_id", "tool"."role_id") in ((-1, -1), (1, 1), (2, 2)) ' +
      'order by "tool"."class_id" asc',
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
    'select "tool"."id", "tool"."class_id", "tool"."role_id" from "tool" "tool" ' +
      'where ("tool"."class_id", "tool"."role_id") not in ((1, 1), (2, 2)) ' +
      'order by "tool"."class_id" asc, "tool"."role_id" asc',
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
    'select "tool"."id" from "tool" "tool" where ("tool"."class_id", "tool"."role_id") in ((1, 2))',
  );
  await expect(qb.getResult()).resolves.toHaveLength(1);
});
