import { IdentityMap } from '@mikro-orm/core';

describe('IdentityMap large maps', () => {
  test('keys() and values() do not overflow the V8 argument limit', () => {
    const map = new IdentityMap();
    class Foo {}
    const store = map.getStore({ class: Foo } as any);

    for (let i = 0; i < 200_000; i++) {
      store.set(`pk${i}`, {} as any);
    }

    expect(map.keys()).toHaveLength(200_000);
    expect(map.values()).toHaveLength(200_000);
  });
});
