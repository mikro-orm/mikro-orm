import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/sqlite';

class MyType extends Type<string, number> {

  override convertToDatabaseValue(jsValue: string): number {
    return Number.parseInt(jsValue);
  }

  override convertToJSValue(dbValue: number): string {
    return dbValue.toString();
  }

  override getColumnType() {
    return 'integer';
  }

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: MyType })
  prop!: string;

}

describe('GH issue 435', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: ':memory:',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`custom type methods are called with correct values`, async () => {
    const convertToDatabaseValueSpy = vi.spyOn(MyType.prototype, 'convertToDatabaseValue');
    const convertToJSValueSpy = vi.spyOn(MyType.prototype, 'convertToJSValue');

    const a1 = new A();
    a1.prop = '123';

    expect(convertToDatabaseValueSpy).toHaveBeenCalledTimes(0);
    expect(convertToJSValueSpy).toHaveBeenCalledTimes(0);

    await orm.em.persistAndFlush(a1);
    orm.em.clear();

    expect(convertToDatabaseValueSpy.mock.calls[0][0]).toBe('123');
    expect(convertToJSValueSpy).toHaveBeenCalledTimes(0); // so far nothing fetched from db

    const a2 = await orm.em.findOneOrFail(A, a1.id);
    expect(a2.prop).toBe('123');

    expect(convertToDatabaseValueSpy.mock.calls[0][0]).toBe('123');
    expect(convertToJSValueSpy.mock.calls[0][0]).toBe(123);
  });

});
