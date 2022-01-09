import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { v4 } from 'uuid';

@Entity()
export class A {

  @PrimaryKey()
  id: string = v4();

  @Property({ unique: true })
  value!: string;

}

@Entity()
export class T {

  @PrimaryKey()
  id: string = v4();

  @Property({ unique: true })
  value!: string;

}

@Entity()
export class I {

  @OneToOne({ entity: 'V', joinColumn: 'id', primary: true, mapToPk: true })
  id!: string;

  @Property({ unique: true })
  value!: number;

}

@Entity()
export class V {

  @PrimaryKey()
  id: string = v4();

  @OneToOne({ entity: 'I', mappedBy: 'id' })
  i!: I;

}

@Entity()
export class E {

  @PrimaryKey()
  id: string = v4();

  @ManyToOne({ entity: 'A' })
  a!: A;

  @ManyToOne({ entity: 'T'  })
  t!: T;

  @ManyToOne({ entity: 'V'   })
  v!: V;

}

@Entity()
export class M {

  @PrimaryKey()
  id: string = v4();

  @ManyToOne({ entity: 'N', hidden: true, mapToPk: true })
  n!: string;

  @ManyToOne({ entity: 'E' })
  e!: E;

}

@Entity()
export class N {

  @OneToOne({ entity: 'E', joinColumn: 'id', primary: true })
  id!: E;

  @ManyToOne({ entity: 'A' })
  a!: A;

  @OneToMany({ entity: 'M', mappedBy: 'n' })
  m = new Collection<M>(this);

}

async function createEntities(orm: MikroORM) {
  const a = orm.em.create(A, { value: 'A' });
  const t = orm.em.create(T, { value: 'T' });
  const v = orm.em.create(V, {});
  const a2 = orm.em.create(A, { value: 'A2' });
  const t2 = orm.em.create(T, { value: 'T2' });
  const v2 = orm.em.create(V, {});
  const e = orm.em.create(E, { a, t, v });
  const e2 = orm.em.create(E, { a: a2, t: t2, v: v2 });
  const n = orm.em.create(N, { id: e, a });
  const m = orm.em.create(M, { n: n.id.id, e: e2 });
  await orm.em.persistAndFlush([m, n]);

  const i = orm.em.create(I, { id: v.id, value: 5 });
  const i2 = orm.em.create(I, { id: v2.id, value: 6 });
  await orm.em.persistAndFlush([i, i2]);

  orm.em.clear();
}

describe('GH issue 1134', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [E, T, A, V, I, N, M],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
    await createEntities(orm);
  });

  beforeEach(() => orm.em.clear());
  afterAll(() => orm.close(true));

  test('Load nested data with smart populate (select-in strategy)', async () => {
    const entity = await orm.em.getRepository(N).findAll({ populate: true });
    const json = JSON.parse(JSON.stringify(entity));

    // check both entity and DTO
    [entity, json].forEach(item => {
      expect(item[0].m[0].e).toMatchObject({
        a: {
          value: 'A2',
        },
        t: {
          value: 'T2',
        },
        v: {
          i: {
            value: 6,
          },
        },
      });
    });
  });

  test('Load nested data with smart populate (select-in strategy will be forced due to `populate: true`)', async () => {
    const entity = await orm.em.getRepository(N).findAll({ populate: true, strategy: LoadStrategy.JOINED });
    const json = JSON.parse(JSON.stringify(entity));

    // check both entity and DTO
    [entity, json].forEach(item => {
      expect(item[0].m[0].e).toMatchObject({
        a: {
          value: 'A2',
        },
        t: {
          value: 'T2',
        },
        v: {
          i: {
            value: 6,
          },
        },
      });
    });
  });
});

