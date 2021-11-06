import { Entity, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { v4 } from 'uuid';

@Entity()
export class B {

  @PrimaryKey()
  id: string = v4();

  @Property()
  name!: string;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => B)
  b!: B;

}

describe('GH issue 1171', () => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('searching by composite key relation', async () => {
    const b1 = orm.em.create(B, { name: 'Z' });
    const a1 = orm.em.create(A, { id: '1', b: b1 });
    const b2 = orm.em.create(B, { name: 'H' });
    const a2 = orm.em.create(A, { id: '2', b: b2 });
    const b3 = orm.em.create(B, { name: 'A' });
    const a3 = orm.em.create(A, { id: '3', b: b3 });
    await orm.em.persistAndFlush([a1, a2, a3]);
    orm.em.clear();
    const orderedAs = await orm.em
      .createQueryBuilder(A)
      .select('*')
      .leftJoinAndSelect('b', 'b')
      .orderBy({ 'b.name': 'asc' })
      .getResult();

    expect(orderedAs.map(e => e.id)).toEqual([a3.id, a2.id, a1.id]);
    expect(orderedAs.map(e => e.b.name)).toEqual([b3.name, b2.name, b1.name]);
  });

});
