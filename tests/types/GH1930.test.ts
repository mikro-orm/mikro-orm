import { v4, parse, stringify } from 'uuid';
import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { MySqlDriver, SchemaGenerator } from '@mikro-orm/mysql';

export class UuidBinaryType extends Type<string, Buffer> {

  convertToDatabaseValue(value: string): Buffer {
    return Buffer.from(parse(value) as number[]);
  }

  convertToJSValue(value: Buffer): string {
    return stringify(value);
  }

  getColumnType(): string {
    return 'binary(16)';
  }

}

@Entity()
class B {

  @PrimaryKey({ type: UuidBinaryType, name: 'uuid' })
  id: string = v4();

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class A {

  @PrimaryKey({ type: UuidBinaryType, name: 'uuid' })
  id: string = v4();

  @Property()
  name: string;

  @ManyToMany(() => B)
  fields = new Collection<B>(this);

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1930', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: `mikro_orm_test_gh_1930`,
      type: 'mysql',
      port: 3307,
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  afterEach(async () => {
    await orm.em.nativeDelete(B, {});
    await orm.em.nativeDelete(A, {});
  });

  test(`M:N with custom type PKs`, async () => {
    const a = new A('a1');
    a.fields.add(new B('b1'), new B('b2'), new B('b3'));
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(A, a.id, {
      populate: ['fields'],
      orderBy: { fields: { name: 'asc' } },
    });
    expect(a1.id).toBe(a.id);
    expect(a1.fields.length).toBe(3);
    expect(a1.fields[0].id).toBe(a.fields[0].id);
    expect(a1.fields[1].id).toBe(a.fields[1].id);
    expect(a1.fields[2].id).toBe(a.fields[2].id);
  });

});
