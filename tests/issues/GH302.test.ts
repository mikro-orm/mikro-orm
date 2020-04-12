import { unlinkSync } from 'fs';
import { Entity, IdentifiedReference, MikroORM, PrimaryKey, ReflectMetadataProvider, Property, Reference, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id: number;

  @Property()
  name: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne({ entity: () => B, inversedBy: 'a', wrappedReference: true, nullable: true })
  b?: IdentifiedReference<B>;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

}

@Entity()
export class B {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property()
  name!: string;

  @OneToMany({ entity: () => A, mappedBy: 'b', nullable: true })
  a = new Collection<A>(this);

}

describe('GH issue 302', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh302.db',
      debug: false,
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test('populate m:1 with reference wrapper', async () => {
    const em = orm.em.fork();
    const b = new B();
    b.id = 1;
    b.name = 'my name is b';
    b.a.add(new A(1, 'a1'), new A(2, 'a2'), new A(3, 'a3'));
    await em.persistAndFlush(b);
    em.clear();

    const bb = await em.findOneOrFail(B, b.id, ['a']);
    expect(bb.name).toBe('my name is b');
    expect(bb.a!.isInitialized(true)).toBe(true);
    expect(bb.a.count()).toBe(3);
    expect(bb.a[0].b).toBeInstanceOf(Reference);
    expect(bb.a[0].b!.unwrap()).toBeInstanceOf(B);
    expect(bb.a[0].name).toBe('a1');
    expect(bb.a[1].name).toBe('a2');
    expect(bb.a[2].name).toBe('a3');
  });

});
