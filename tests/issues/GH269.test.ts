import { unlinkSync } from 'fs';
import { Entity, IdentifiedReference, MikroORM, OneToOne, PrimaryKey, ReflectMetadataProvider, Property, wrap, Reference } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne({ entity: () => B, inversedBy: 'a', wrappedReference: true, nullable: true })
  b?: IdentifiedReference<B>;

  @Property()
  name!: string;

}

@Entity()
export class B {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @OneToOne({ entity: () => A, mappedBy: 'b', wrappedReference: true, nullable: true })
  a?: IdentifiedReference<A>;

  @Property()
  name!: string;

}

describe('GH issue 269', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh269.db',
      debug: false,
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      autoJoinOneToOneOwner: false,
      cache: { enabled: false },
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test('1:1 populates owner even with autoJoinOneToOneOwner: false', async () => {
    const em = orm.em.fork();
    const a = new A();
    a.id = 1;
    a.name = 'my name is a';
    const b = new B();
    b.id = 1;
    a.b = wrap(b).toReference();
    b.name = 'my name is b';
    b.a = wrap(a).toReference();
    await em.persistAndFlush([a, b]);
    em.clear();

    const bb = await em.findOneOrFail(B, b.id, ['a']);
    expect(bb.name).toBe('my name is b');
    expect(bb.a).toBeInstanceOf(Reference);
    expect(bb.a!.isInitialized()).toBe(true);
    expect(bb.a!.unwrap().name).toBe('my name is a');
    expect(bb.a!.unwrap().b).toBeInstanceOf(Reference);
    expect(bb.a!.unwrap().b!.isInitialized()).toBe(true);

    const a2 = new A();
    const b2 = new B();
    a2.name = 'a2';
    b2.name = 'b2';
    b2.a = Reference.create(a2);
    const spy = jest.spyOn(Reference.prototype, 'set');
    b.a = b2.a;
    expect(b.a!.unwrap().b!.unwrap()).toBe(b);
    expect(spy).toBeCalledTimes(1);
  });

  test('1:1 populates owner even with autoJoinOneToOneOwner: false and when already loaded', async () => {
    const em = orm.em.fork();
    const a = new A();
    a.id = 2;
    a.name = 'my name is a';
    const b = new B();
    b.id = 2;
    a.b = wrap(b).toReference();
    b.name = 'my name is b';
    b.a = wrap(a).toReference();
    await em.persistAndFlush([a, b]);
    em.clear();

    const bb0 = await em.findOneOrFail(B, b.id); // load first so it is already in IM
    expect(bb0.a).toBeUndefined();
    const bb = await em.findOneOrFail(B, b.id, ['a']);
    expect(bb).toBe(bb0);
    expect(bb.name).toBe('my name is b');
    expect(bb.a).toBeInstanceOf(Reference);
    expect(bb.a!.isInitialized()).toBe(true);
    expect(bb.a!.unwrap().name).toBe('my name is a');
    expect(bb.a!.unwrap().b).toBeInstanceOf(Reference);
    expect(bb.a!.unwrap().b!.isInitialized()).toBe(true);
  });

  test('1:1 populates inverse even with autoJoinOneToOneOwner: false', async () => {
    const em = orm.em.fork();
    const a = new A();
    a.id = 3;
    a.name = 'my name is a';
    const b = new B();
    b.id = 3;
    a.b = wrap(b).toReference();
    b.name = 'my name is b';
    b.a = wrap(a).toReference();
    await em.persistAndFlush([a, b]);
    em.clear();

    const aa = await em.findOneOrFail(A, a.id, ['b']);
    expect(aa.name).toBe('my name is a');
    expect(aa.b).toBeInstanceOf(Reference);
    expect(aa.b!.isInitialized()).toBe(true);
    expect(aa.b!.unwrap().name).toBe('my name is b');
    expect(aa.b!.unwrap().a).toBeInstanceOf(Reference);
    expect(aa.b!.unwrap().a!.isInitialized()).toBe(true);
  });

});
