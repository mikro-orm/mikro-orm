import { defineEntity } from '@mikro-orm/core';

test('partial index `where` does not narrow the inferred properties', () => {
  const Booking = defineEntity({
    name: 'Booking',
    properties: p => ({
      id: p.string().primary(),
      booking: p.string(),
      current: p.boolean(),
    }),
    indexes: [{ properties: ['booking'], where: { current: true } }],
    uniques: [{ properties: ['booking'], where: { current: true } }],
  });

  expect(Booking.meta.indexes[0]).toMatchObject({ properties: ['booking'], where: { current: true } });
  expect(Booking.meta.uniques[0]).toMatchObject({ properties: ['booking'], where: { current: true } });
});

test('property-key options do not narrow the inferred properties', () => {
  const Versioned = defineEntity({
    name: 'Versioned',
    properties: p => ({
      id: p.string().primary(),
      name: p.string(),
      version: p.integer(),
    }),
    versionProperty: 'version',
    orderBy: { name: 'asc' },
  });

  const Serialized = defineEntity({
    name: 'Serialized',
    properties: p => ({
      id: p.string().primary(),
      name: p.string(),
    }),
    serializedPrimaryKey: 'id',
    orderBy: { name: 'asc' },
  });

  const Checked = defineEntity({
    name: 'Checked',
    properties: p => ({
      id: p.string().primary(),
      name: p.string(),
      code: p.string(),
    }),
    concurrencyCheckKeys: new Set(['code'] as const),
    orderBy: { name: 'asc' },
  });

  const Composite = defineEntity({
    name: 'Composite',
    properties: p => ({
      a: p.string().primary(),
      b: p.string().primary(),
      name: p.string(),
    }),
    primaryKeys: ['a', 'b'],
    orderBy: { name: 'asc' },
  });

  expect(Versioned.meta.versionProperty).toBe('version');
  expect(Serialized.meta.serializedPrimaryKey).toBe('id');
  expect(Checked.meta.concurrencyCheckKeys).toEqual(new Set(['code']));
  expect(Composite.meta.primaryKeys).toEqual(['a', 'b']);
});
