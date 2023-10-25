import { Entity, Ref, MikroORM, OneToOne, PrimaryKey, Property, wrap, Reference } from '@mikro-orm/sqlite';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @OneToOne({ entity: () => B, inversedBy: 'a', ref: true, nullable: true })
  b?: Ref<B>;

  @Property()
  name!: string;

}

@Entity()
export class B {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @OneToOne({ entity: () => A, mappedBy: 'b', ref: true, nullable: true })
  a?: Ref<A>;

  @Property()
  name!: string;

}

describe('GH issue 269', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      autoJoinOneToOneOwner: false,
    });
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

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

    const bb = await em.findOneOrFail(B, b.id, { populate: ['a'] });
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
    b.a = b2.a;
    expect(b.a!.unwrap().b!.unwrap()).toBe(b);
    expect(b.a!.unwrap().b).toBe(wrap(b).toReference());
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
    const bb = await em.findOneOrFail(B, b.id, { populate: ['a'] });
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

    const aa = await em.findOneOrFail(A, a.id, { populate: ['b'] });
    expect(aa.name).toBe('my name is a');
    expect(aa.b).toBeInstanceOf(Reference);
    expect(aa.b!.isInitialized()).toBe(true);
    expect(aa.b!.unwrap().name).toBe('my name is b');
    expect(aa.b!.unwrap().a).toBeInstanceOf(Reference);
    expect(aa.b!.unwrap().a!.isInitialized()).toBe(true);
  });

});
