import { unlinkSync } from 'fs';
import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider, wrap } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => B)
  b!: any;

  @Property({ type: String })
  prop!: string;

}

@Entity()
export class C {

  @PrimaryKey({ type: Number })
  id!: number;

  @OneToOne(() => A)
  a!: A;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => B, b => b.c, { eager: true })
  bCollection = new Collection<B>(this);

}

@Entity()
export class B {

  @PrimaryKey({ type: Number })
  id!: number;

  @OneToOne(() => A, a => a.b, { eager: true })
  a!: A;

  @ManyToOne(() => C)
  c!: C;

  @Property({ type: String })
  prop!: string;

}

describe('GH issue 222', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh222.db',
      debug: false,
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const a = new A();
    a.id = 1;
    a.prop = 'data';
    const b = new B();
    b.id = 1;
    a.b = b;
    b.prop = 'my name is b';
    const c = new C();
    c.id = 1;
    c.a = a;
    c.bCollection.add(b);
    await orm.em.persistAndFlush(c);
    orm.em.clear();

    const cc = await orm.em.findOneOrFail(C, c.id);
    expect(cc.id).toBeDefined();
    expect(cc.a.id).toBeDefined();
    expect(cc.bCollection[0].id).toBeDefined();
    expect(cc.bCollection[0].a.id).toBe(cc.a.id);
  });

  test('toObject() with cycles', async () => {
    const a = new A();
    a.prop = 'data';
    const b = new B();
    a.b = b;
    b.prop = 'my name is b';
    const c = new C();
    c.a = a;
    c.bCollection.add(b);
    await orm.em.persistAndFlush(c);
    orm.em.clear();

    const cc = await orm.em.findOneOrFail(C, c.id);
    expect(cc.bCollection.count()).toBe(1);
    expect(cc.a.prop).toEqual(cc.bCollection[0].a.prop);
    const ccJson = wrap(cc).toJSON();
    expect(ccJson.a.prop).toEqual(ccJson.bCollection[0].a.prop);
  });

});
