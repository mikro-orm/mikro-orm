import { DatabaseSchema, MikroORM } from '@mikro-orm/postgresql';
import { Check, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

// single-column checks over a list of values, which postgres stores like the enum checks it generates
@Entity()
@Check({ name: 'entry_delta_check', expression: 'delta in (1, -1)' })
@Check({ name: 'entry_sign_check', expression: 'sign in (-1, -2)' })
@Check({ name: 'entry_amount_check', expression: 'amount in (1.5, -1.5)' })
@Check({ name: 'entry_ratio_check', expression: 'ratio in (1.5, -1.5)' })
@Check({ name: 'entry_kind_check', expression: `kind = 'manual'` })
@Check({ name: 'entry_day_check', expression: `day in ('2020-01-01', '2021-01-01')` })
class Entry {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'smallint' })
  delta!: number;

  @Property({ type: 'smallint' })
  sign!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Property({ type: 'double' })
  ratio!: number;

  @Property({ type: 'text' })
  kind!: string;

  @Property({ type: 'date' })
  day!: string;

  @Enum({ items: ['only'] })
  mode!: string;

  @Enum({ items: ['a', 'b'] })
  type!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Entry], dbName: 'mikro_orm_test_gh8652' });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('a check over a list of values is not diffed as an enum', async () => {
  expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  const { up, down } = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect([up, down]).toEqual(['', '']);
});

test('a check on a number column is not read as an enum', async () => {
  const schema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
  const table = schema.getTable('entry')!;
  expect(table.getColumn('delta')!.enumItems ?? []).toEqual([]);
  expect(table.getColumn('sign')!.enumItems ?? []).toEqual([]);
  expect(table.getColumn('amount')!.enumItems ?? []).toEqual([]);
  expect(table.getColumn('ratio')!.enumItems ?? []).toEqual([]);
  expect(table.getColumn('mode')!.enumItems).toEqual(['only']);
  expect(table.getColumn('type')!.enumItems).toEqual(['a', 'b']);
});
