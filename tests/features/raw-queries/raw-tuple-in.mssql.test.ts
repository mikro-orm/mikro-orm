import { MikroORM, raw } from '@mikro-orm/mssql';
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
    password: 'Root.Root',
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

const tupleKey = () => raw('([tool].[class_id], [tool].[role_id])');

// SQL Server has no row value constructor. `MsSqlPlatform.allowsComparingTuples()` returns false
// so that the ORM can decompose a composite key it renders itself into `(a = ? and b = ?) or ...`,
// but that rewrite needs the individual column names and a raw fragment does not expose them --
// it is an opaque SQL string. So the row-value form is emitted as written and mssql rejects it,
// exactly as it did in v6 where knex rendered the same shape for a raw key. Grouping the tuples
// is still the right output; it is just not something mssql can run. Use `$or` over the columns.
test('a raw column tuple is emitted as a row value and rejected by the driver', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id', 'classId', 'roleId'])
    .where({
      [tupleKey()]: {
        $in: [
          [1, 1],
          [2, 2],
        ],
      },
    });

  expect(qb.getFormattedQuery()).toBe(
    'select [tool].[id], [tool].[class_id], [tool].[role_id] from [tool] as [tool] ' +
      'where ([tool].[class_id], [tool].[role_id]) in ((1, 1), (2, 2))',
  );

  // the parser fails at the comma inside the tuple, before arity is even considered -- the
  // pre-fix output `in (1, 1, 2, 2)` is rejected with this very same error
  await expect(qb.getResult()).rejects.toThrow(
    'An expression of non-boolean type specified in a context where a condition is expected',
  );
});

// The rest of the raw-key handling is unaffected: only the row-value form is out of reach here.
test('a flat array on a raw key stays a scalar list', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id'])
    .where({ [raw('[tool].[class_id]')]: { $in: [1, 2] } });

  expect(qb.getFormattedQuery()).toBe('select [tool].[id] from [tool] as [tool] where [tool].[class_id] in (1, 2)');
  await expect(qb.getResult()).resolves.toHaveLength(4);
});

test('an empty tuple list is still a contradiction', async () => {
  const qb = orm.em
    .createQueryBuilder(Tool, 'tool')
    .select(['id'])
    .where({ [tupleKey()]: { $in: [] } });

  expect(qb.getFormattedQuery()).toBe('select [tool].[id] from [tool] as [tool] where 1 = 0');
  await expect(qb.getResult()).resolves.toHaveLength(0);
});
