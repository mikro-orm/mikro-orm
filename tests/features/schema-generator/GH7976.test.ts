import { MikroORM, SchemaComparator } from '@mikro-orm/sqlite';
import type { Column } from '@mikro-orm/sql';

// GH #7976 — SchemaComparator.hasSameDefaultValue threw `to.default.toLowerCase is not a function`
// when `to.default` was a non-string (a number or boolean — e.g. a column whose entity default is
// `@Property({ default: 0 })` or `@Property({ default: true })`). The `from` side was already coerced
// with `.toString()`; the `to` side was not.
describe('GH 7976', () => {
  let orm: MikroORM;
  let comparator: SchemaComparator;

  const col = (def: unknown): Column => ({ default: def } as unknown as Column);

  beforeAll(async () => {
    orm = await MikroORM.init({ dbName: ':memory:', entities: [], discovery: { warnWhenNoEntities: false } });
    comparator = new SchemaComparator(orm.em.getPlatform());
  });

  afterAll(() => orm.close(true));

  it('does not throw on a numeric `to.default` (from.default null)', () => {
    expect(() => comparator.hasSameDefaultValue(col(null), col(0))).not.toThrow();
    expect(comparator.hasSameDefaultValue(col(null), col(0))).toBe(false);
  });

  it('does not throw on a boolean `to.default` (from.default null)', () => {
    expect(() => comparator.hasSameDefaultValue(col(null), col(false))).not.toThrow();
    expect(() => comparator.hasSameDefaultValue(col(null), col(true))).not.toThrow();
    expect(comparator.hasSameDefaultValue(col(null), col(false))).toBe(false);
  });

  it('does not throw on a numeric `to.default` (from.default a real value)', () => {
    expect(() => comparator.hasSameDefaultValue(col('1'), col(0))).not.toThrow();
  });

  it('still treats two null defaults as equal', () => {
    expect(comparator.hasSameDefaultValue(col(null), col(null))).toBe(true);
  });
});
