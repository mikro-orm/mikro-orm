import { Dictionary, Entity, MikroORM, PrimaryKey, Property, Utils } from '@mikro-orm/core';
import { initORMSqlite2, wipeDatabase } from './bootstrap';

/**
 * Computes difference between two objects, ignoring items missing in `b`.
 * Old version without JIT compilation, just for comparison.
 */
function diffOld(a: Dictionary, b: Dictionary): Record<keyof (typeof a & typeof b), any> {
  const ret: Dictionary = {};

  Object.keys(b).forEach(k => {
    if (Utils.equals(a[k], b[k])) {
      return;
    }

    ret[k] = b[k];
  });

  return ret;
}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  id2!: number;

  @Property()
  ready?: boolean;

  @Property()
  priority: number = 0;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

describe('EntityComparator', () => {

  let orm: MikroORM;

  // beforeAll(async () => orm = await initORMSqlite2());
  // beforeEach(async () => wipeDatabase(orm.em));

  test('diffing performance', async () => {
    const orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [User],
    });
    const comparator = orm.em.getComparator();

    const b1 = {
      name: 'b1',
      id2: 123,
      ready: true,
      priority: 5,
    };
    const b2 = {
      name: 'b2',
      id2: 123,
      ready: true,
      priority: 5,
    };
    // const b1 = {
    //   name: 'b1',
    //   version: 123,
    //   blob: Buffer.from([1, 2, 3, 4, 5]),
    //   array: [1, 2, 3, 4, 5],
    //   object: { foo: 'bar', bar: 3 },
    // };
    // const b2 = {
    //   name: 'b2',
    //   version: 321,
    //   blob: Buffer.from([1, 2, 3, 4, 5]),
    //   array: [1, 2, 3, 5],
    //   // object: { foo: 'baz', bar: 3 },
    // };
    const diff = comparator.getEntityComparator('User');

    const now = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      const d = diff(b1, b2);
    }
    const d1 = performance.now() - now;
    process.stdout.write(`compare test took ${d1}\n`);

    const now2 = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      const diff = diffOld(b1, b2);
    }
    const d2 = performance.now() - now2;
    console.log(d2);
    console.log(d2 / d1);
  });

  afterAll(async () => orm.close(true));

});
