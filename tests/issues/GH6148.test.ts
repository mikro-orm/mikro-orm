import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { SqliteDriver } from '../../packages/sqlite/src';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => B, b => b.a)
  b = new Collection<B>(this);

  @OneToMany(() => C, c => c.a)
  c = new Collection<C>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => A, { nullable: true, ref: true })
  a?: Ref<A>;

  @OneToMany(() => C, c => c.b)
  c = new Collection<C>(this);

}

@Entity()
class C {

    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @ManyToOne(() => A, { nullable: true, ref: true })
    a?: Ref<A>;

    @ManyToOne(() => B, { nullable: true, ref: true })
    b?: Ref<B>;

}

describe('GH6148', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      dbName: ':memory:',
      driver: SqliteDriver,
      debug: true,
      dataloader: true,
      allowGlobalContext: true,
      populateWhere: 'infer',
    });
    await orm.getSchemaGenerator().refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('Load with relation from different entities', async () => {
    const a = orm.em.create(A, { name: 'a1', c: [{ name: 'c1' }] });
    const b = orm.em.create(B, { name: 'b1', c: [{ name: 'c2' }] });
    await orm.em.flush();
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(A, a.id);
    const b1 = await orm.em.findOneOrFail(B, b.id);
    a1.c.load();
    const bc = await b1.c.load();
    expect(bc.length).toBe(1);
    expect(bc[0].name).toBe('c2');
  });
});
