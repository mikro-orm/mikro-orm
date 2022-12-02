import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export class IntegerArrayType extends Type<number[], string> {

  constructor(private readonly length?: number) {
    super();
  }

  convertToDatabaseValue(value: number[]): string {
    if (this.length && value.length !== this.length) {
      throw new Error('...');
    }

    return `{${value.join(',')}}`;
  }

  convertToJSValue(value: number[]): number[] {
    if (!Array.isArray(value)) {
      throw new Error('...');
    }

    if (this.length && value.length !== this.length) {
      throw new Error('...');
    }

    return value;
  }

  compareAsType(): string {
    return 'array';
  }

  getColumnType(): string {
    return 'int4[]';
  }

}

@Entity()
export class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: new IntegerArrayType() })
  numArray = [1, 2, 3];

}

describe('GH issue 2489', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Test],
      dbName: 'mikro_orm_test_2489',
      driver: PostgreSqlDriver,
      cache: { enabled: true },
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('custom types are property rehydrated when using metadata cache', async () => {
    expect(orm.getMetadata().get(Test.name).properties.numArray.customType).toBeInstanceOf(IntegerArrayType);

    const e = new Test();
    expect(e.numArray).toEqual([1, 2, 3]);
    await orm.em.fork().persistAndFlush(e);
    expect(e.numArray).toEqual([1, 2, 3]);

    const e1 = await orm.em.findOneOrFail(Test, e);
    expect(e1.numArray).toEqual([1, 2, 3]);
  });

});
