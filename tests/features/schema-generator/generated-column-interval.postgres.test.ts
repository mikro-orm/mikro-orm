import { defineEntity, p, MikroORM, type Opt } from '@mikro-orm/postgresql';

// PostgreSQL does not keep the text of an interval literal, `interval '1 minute'` is introspected as `'00:01:00'::interval`
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
    // `timestamptz + interval` with days or months is not immutable, so the other shapes use interval columns
    reminderOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * interval '1 day 2 hours') stored`),
    archiveOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * '1 year 2 months'::interval) stored`),
    graceOffset: p
      .string()
      .columnType('interval')
      .$type<Opt<string>>()
      .generated(cols => `(${cols.durationMinutes} * interval '90 seconds') stored`),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Event],
    dbName: 'mikro_orm_test_generated_column_interval',
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

test('interval literals are normalized the way PostgreSQL prints them', () => {
  const helper = orm.em.getPlatform().getSchemaHelper()!;
  expect(helper.normalizeExpression(`a + interval '1 minute'`)).toBe(`a + '00:01:00'::interval`);
  expect(helper.normalizeExpression(`a + '2 hours 30 minutes'::interval`)).toBe(`a + '02:30:00'::interval`);
  expect(helper.normalizeExpression(`a + interval '1 year 13 months'`)).toBe(`a + '2 years 1 mon'::interval`);
  expect(helper.normalizeExpression(`a + interval '2 weeks'`)).toBe(`a + '14 days'::interval`);
  expect(helper.normalizeExpression(`a + interval '1 day 90 seconds'`)).toBe(`a + '1 day 00:01:30'::interval`);
  expect(helper.normalizeExpression(`a + interval '1.5 seconds'`)).toBe(`a + '00:00:01.5'::interval`);
  expect(helper.normalizeExpression(`a + interval '59.9999999 seconds'`)).toBe(`a + '00:01:00'::interval`);
  // only the common shapes are covered, anything else is left for the user to write the way PostgreSQL prints it
  expect(helper.normalizeExpression(`a + interval '1.5 days'`)).toBe(`a + interval '1.5 days'`);
  expect(helper.normalizeExpression(`a + interval '-1 day'`)).toBe(`a + interval '-1 day'`);
  expect(helper.normalizeExpression(`a + interval 'P1D'`)).toBe(`a + interval 'P1D'`);
  expect(helper.normalizeExpression(`a + interval '1 day ago'`)).toBe(`a + interval '1 day ago'`);
});
