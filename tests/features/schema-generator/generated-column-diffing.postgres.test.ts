import { defineEntity, p, MikroORM, SchemaComparator, type Opt } from '@mikro-orm/postgresql';

// PostgreSQL stores `interval '1 minute'` as `'00:01:00'::interval` and adds a
// `::double precision` cast to the integer operand of the multiplication.
const Event = defineEntity({
  name: 'Event',
  properties: {
    id: p.integer().primary(),
    startDate: p.datetime(),
    durationMinutes: p.integer(),
    endDate: p
      .datetime()
      .$type<Opt<Date>>()
      .generated(
        cols =>
          `(((${cols.startDate} at time zone 'UTC') + ${cols.durationMinutes} * interval '1 minute') at time zone 'UTC') stored`,
      ),
    // `timestamptz + interval` with days or months is not immutable, so the other spellings use interval columns
    reminderOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * interval '1 day 2 hours') stored`),
    archiveOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * '1 year 13 months'::interval) stored`),
    cutoffOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * interval '1 day -90 seconds') stored`),
    localStart: p.datetime().columnType('timestamp'),
    // the untyped literal is stored as `'1 day'::interval`
    localEnd: p
      .datetime()
      .columnType('timestamp')
      .$type<Opt<Date>>()
      .generated(cols => `(${cols.localStart} + '1 day') stored`),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Event],
    dbName: 'mikro_orm_test_generated_column_diffing',
  });
  await orm.schema.refresh({ dropDb: true });
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('generated columns with interval literals do not cause drift', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });
});

test('interval literals are compared by value', () => {
  const comparator = new SchemaComparator(orm.em.getPlatform());
  expect(comparator.diffExpression(`a + interval '1 minute'`, `a + '00:01:00'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '1 day ago'`, `a + '-1 days'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '@ -1 hour -30 minutes'`, `a + '-01:30:00'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '01:30'`, `a + '01:30:00'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + '1 day'`, `a + '1 day'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '1 year 13 months'`, `a + '2 years 1 mon'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '1 day -90 seconds'`, `a + '1 day -00:01:30'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '-1 day 1 minute'`, `a + '-1 days +00:01:00'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval '1.5 seconds'`, `a + '00:00:01.5'::interval`)).toBe(false);
  // literals that are not understood are compared as they are
  expect(comparator.diffExpression(`a + '1.5 days'`, `a + '1.5 days'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + '1 fortnight'`, `a + '1 fortnight'::interval`)).toBe(false);
  expect(comparator.diffExpression(`a + interval 'P1D'`, `a + '1 day'::interval`)).toBe(true);
  expect(comparator.diffExpression(`a + interval '10 minutes'`, `a + '00:01:00'::interval`)).toBe(true);
  expect(comparator.diffExpression(`a + interval '1 day'`, `a + '24:00:00'::interval`)).toBe(true);
  expect(comparator.diffExpression(`a + interval '1 month'`, `a + '30 days'::interval`)).toBe(true);
});
