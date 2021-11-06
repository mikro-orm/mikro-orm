import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { v4 } from 'uuid';

@Entity()
export class D {

  @PrimaryKey()
  id = v4();

  @ManyToOne({ entity: 'A' })
  a!: any;

}

@Entity()
export class C {

  @PrimaryKey()
  id = v4();

}

@Entity()
export class B {

  @PrimaryKey()
  id = v4();

}

@Entity()
export class A {

  @OneToOne({ entity: 'B', joinColumn: 'id', primary: true })
  id!: B;

  @ManyToOne({ entity: 'C', primary: true })
  c!: C;

  @OneToMany({ entity: 'D', mappedBy: 'a', eager: true })
  d = new Collection<D>(this);

}

describe('GH issue 1157', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C, D],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('searching by composite key relation', async () => {
    const c = orm.em.create(C, {});
    const b = orm.em.create(B, {});
    const a = orm.em.create(A, { id: b, c });
    const d = orm.em.create(D, { a });
    await orm.em.persistAndFlush(d);
    orm.em.clear();
    const d1 = await orm.em.findOneOrFail(D, { a });
    expect(d1.a.id).toBeInstanceOf(B);
  });

});
