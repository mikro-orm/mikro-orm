import { Entity, IdentifiedReference, JsonType, ManyToOne, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType, Property, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresl';

interface Test {
  t1: string;
  t2: {
    t3: string | null;
    t4?: {
      t5: string;
    };
  };
}

@Entity()
export class A {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property({ type: JsonType })
  test: Test;

}

describe('GH issue GHx3', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: ':memory:',
      type: 'postgresql',
      debug: true,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    orm.close(true);
  });

  test('Persist JSON', async () => {
    await orm.em.transactional(em => {
      const a = em.create(A, { test: { t1: 'a', t2: { t3: null } } });
      em.persist(a);
    });

    orm.em.clear();

    await orm.em.transactional(async em => {
      const a = await em.find(A);

      wrap(a[0]).assign({
        test: { t2: { t3: 'x', t4: { t5: 'y' } } },
      });
    });

    orm.em.clear();

    const a = await orm.em.find(A);

    expect(a.length).toBe(1);
    expect(a[0]).not.toBeNull();
    expect(a[0].test.t1).not.toBeDefined();
    expect(a[0].test.t2).not.toBeNull();
    expect(a[0].test.t2.t3).toBe('x');
    expect(a[0].test.t2.t4.t5).toBe('y');
  });
});
