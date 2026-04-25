import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

// Reports infinite migrations when using `columnType('time with time zone')` or
// `columnType('timetz')`: postgres introspection reports those as `timetz(6)` while
// `mappedType.getColumnType` produced a different string for the entity side.

const Foo = defineEntity({
  name: 'Foo',
  tableName: 'foo',
  properties: {
    id: p.integer().primary().autoincrement(),
    start: p.string().columnType('time with time zone'),
    stop: p.string().columnType('timetz'),
    createdAt: p.datetime().columnType('timestamp with time zone'),
    plainTime: p.time(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo],
    dbName: `mikro_orm_test_gh_x43`,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop table if exists foo');
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('schema diff is empty for time with time zone / timetz columns', async () => {
  await expect(orm.schema.getUpdateSchemaMigrationSQL({ wrap: false })).resolves.toEqual({
    down: '',
    up: '',
  });
});
