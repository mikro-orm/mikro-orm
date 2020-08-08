import { unlinkSync } from 'fs';
import { Collection, Entity, PrimaryKey, ManyToOne, OneToMany, MikroORM, IdentifiedReference } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

  @ManyToOne({ entity: 'B', wrappedReference: true, nullable: true })
  b?: IdentifiedReference<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => A, a => a.b)
  as = new Collection<A>(this);

}

describe('GH issue 467', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: __dirname + '/../../temp/mikro_orm_test_gh467.db',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`wrap().assign to collections is persisted`, async () => {
    const a = new A();
    a.id = 'a1';
    await orm.em.persistAndFlush(a);

    const b = new B();
    orm.em.assign(b, {
      id: 'b1',
      as: ['a1'],
    });
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b1', ['as']);
    expect(b1.as.getIdentifiers()).toEqual(['a1']);
  });

  test(`assigning to new collection from inverse side is persisted`, async () => {
    const a = new A();
    a.id = 'a2';
    await orm.em.persistAndFlush(a);

    const b = new B();
    b.id = 'b2';
    b.as.set([orm.em.getReference(A, 'a2')]);
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b2', ['as']);
    expect(b1.as.getIdentifiers()).toEqual(['a2']);
  });

  test(`assigning to loaded collection from inverse side is persisted`, async () => {
    const a = new A();
    a.id = 'a3';
    await orm.em.persistAndFlush(a);

    const b = new B();
    b.id = 'b3';
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b3', ['as']);
    b1.as.set([orm.em.getReference(A, 'a3')]);
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(B, 'b3', ['as']);
    expect(b2.as.getIdentifiers()).toEqual(['a3']);
  });

});
