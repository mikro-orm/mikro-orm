import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// GH #7506 — Entity class prototype exposes user `@Property({ persist: false })`
// getters to deep-clone helpers (e.g. vitest's `@vitest/utils` `clone`,
// `safe-stable-stringify`). Walking via `Object.getOwnPropertyNames` + `val[k]`
// invokes the getter with `this === EntityClass.prototype`, which has no
// hydrated state, so any getter that dereferences `this.someField` blows up.
//
// MikroORM previously fixed this for the single `toJSON` method (GH #7151),
// but the same hazard exists for any user-defined getter on the prototype.

@Entity({ tableName: 'gh7506_row_reference' })
class RowReference {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  discriminator!: string;

  @Property({ type: 'string', nullable: true })
  refA?: string | null;

  @Property({ type: 'string', nullable: true })
  refB?: string | null;

  @Property({ persist: false, type: 'string', nullable: true })
  get referencedId(): string | null {
    if (this.discriminator === 'a') {
      return this.refA ?? null;
    }
    if (this.discriminator === 'b') {
      return this.refB ?? null;
    }
    throw new Error(`referencedId: unknown discriminator ${JSON.stringify(this.discriminator)}`);
  }
}

// Minimal port of @vitest/utils `clone` helper. The relevant behavior:
// for each own property name on the value, read `val[k]` — which invokes
// getters with `this` bound to the walked object.
function vitestStyleDeepClone(val: unknown, seen = new WeakMap()): unknown {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (seen.has(val as object)) {
    return seen.get(val as object);
  }
  if (Array.isArray(val)) {
    const out: unknown[] = Array.from({ length: val.length });
    seen.set(val, out);
    for (let index = 0; index < val.length; index++) {
      out[index] = vitestStyleDeepClone(val[index], seen);
    }
    return out;
  }
  if (Object.prototype.toString.call(val) === '[object Object]') {
    const out = Object.create(Object.getPrototypeOf(val));
    seen.set(val as object, out);
    for (const key of Object.getOwnPropertyNames(val)) {
      const descriptor = Object.getOwnPropertyDescriptor(val, key);
      if (!descriptor) {
        continue;
      }
      // This is the line that fires the getter: plain `val[key]` access.
      const cloned = vitestStyleDeepClone((val as Record<string, unknown>)[key], seen);
      if ('get' in descriptor) {
        Object.defineProperty(out, key, {
          ...descriptor,
          get() {
            return cloned;
          },
        });
      } else {
        Object.defineProperty(out, key, { ...descriptor, value: cloned });
      }
    }
    return out;
  }
  return val;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [RowReference],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('user getter on entity prototype does not throw when walked by deep-clone helpers (GH7506)', () => {
  // The user-defined getter is reachable via getOwnPropertyNames on the
  // entity class prototype. A naive deep-clone walker will invoke the
  // getter with `this === prototype`, where the discriminator is undefined
  // and the getter throws. The fix is to make the prototype non-walkable
  // for these getters (they should be skipped during prototype enumeration).
  const wrapper = { proto: RowReference.prototype };

  expect(() => vitestStyleDeepClone(wrapper)).not.toThrow();
});

test('user getter still works correctly when invoked on a hydrated instance', () => {
  const instance = orm.em.create(RowReference, {
    discriminator: 'a',
    refA: '22222222-2222-2222-2222-222222222222',
  });

  expect(instance.referencedId).toBe('22222222-2222-2222-2222-222222222222');
});
