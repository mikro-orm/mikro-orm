import { raw, Utils } from '@mikro-orm/core';

test('getObjectQueryKeys returns enumerable string keys followed by enumerable raw fragment symbols', () => {
  const fragment = raw('lower(name)');
  const hidden = raw('upper(name)');
  const unknown = Symbol('unknown');
  const obj: Record<PropertyKey, unknown> = { b: 1, [fragment]: 2, 2: 3, a: 4, [unknown]: 5, 1: 6 };
  Object.defineProperty(obj, 'nonEnumerable', { value: 7, enumerable: false });
  Object.defineProperty(obj, hidden, { value: 8, enumerable: false });

  expect(Utils.getObjectQueryKeys(obj)).toEqual(['1', '2', 'b', 'a', fragment.key]);
  expect(Utils.getObjectQueryKeys({ b: 1, a: 2 })).toEqual(['b', 'a']);
});
