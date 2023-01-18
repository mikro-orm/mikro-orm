import { Embeddable, Embedded, Entity, LoadStrategy, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
export class Z {

  @Property()
  name!: string;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => Z, object: true })
  z!: Z;

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A, onDelete: 'cascade' })
  a!: A;

}

describe('GH issue 2663', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, Z],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('should return Z data', async () => {
    // Create sample data
    const a = orm.em.create(A, {
      z: {
        name: 'test',
      },
    });
    orm.em.persist(a);

    const b = orm.em.create(B, { a });
    orm.em.persist(b);

    await orm.em.flush();

    const r = await orm.em.fork().findOne(B, b.id, {
      populate: ['a'],
      strategy: LoadStrategy.JOINED,
    });

    expect(r?.a.z?.name).toEqual('test');
  });
});
