import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// User `@Property({ persist: false })` class getters live on the entity prototype
// and were invoked by deep-clone helpers (e.g. `@vitest/utils` `clone`,
// `safe-stable-stringify`) walking the object graph via `Object.getOwnPropertyNames`
// + plain `val[key]`. The getter then ran with `this === prototype`, dereferenced
// unhydrated instance fields, and threw.

@Entity()
class RowReference {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  discriminator!: string;

  @Property({ type: 'string', nullable: true })
  refA?: string | null;

  @Property({ persist: false, type: 'string', nullable: true })
  get referencedId(): string | null {
    if (this.discriminator === 'a') {
      return this.refA ?? null;
    }
    throw new Error(`unknown discriminator ${JSON.stringify(this.discriminator)}`);
  }
}

test('user getter on entity prototype is safe to read with `this === prototype`', async () => {
  const orm = await MikroORM.init({ dbName: ':memory:', entities: [RowReference] });

  // Plain property read on the prototype itself — this is what
  // `Object.getOwnPropertyNames` + `val[key]` walkers do.
  expect(() => (RowReference.prototype as any).referencedId).not.toThrow();

  // Hydrated instance still resolves the getter normally.
  const instance = orm.em.create(RowReference, { discriminator: 'a', refA: 'x' });
  expect(instance.referencedId).toBe('x');

  await orm.close(true);
});
