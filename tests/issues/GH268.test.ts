import { v4 } from 'uuid';
import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class A {

  @PrimaryKey()
  uuid: string = v4();

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany(() => B, b => b.aCollection)
  bCollection: Collection<B> = new Collection<B>(this);

}

@Entity()
export class B {

  @PrimaryKey()
  uuid: string = v4();

  @Property()
  name!: string;

  @ManyToMany(() => A, undefined, { fixedOrder: true })
  aCollection: Collection<A> = new Collection<A>(this);

}

describe('GH issue 268', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('m:n with uuid PKs', async () => {
    const a1 = new A();
    a1.name = 'a1';
    const a2 = new A();
    a2.name = 'a2';
    const a3 = new A();
    a3.name = 'a3';
    const b = new B();
    b.name = 'b';
    b.aCollection.add(a1, a2, a3);
    await orm.em.persistAndFlush(b);

    const res = await orm.em.getConnection().execute('select * from b_a_collection');
    expect(res[0]).toEqual({ id: 1, a_uuid: a1.uuid, b_uuid: b.uuid });
  });

});
