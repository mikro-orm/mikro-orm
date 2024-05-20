import type { EntityProperty, Platform } from '@mikro-orm/core';
import { DoubleType, Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

export class AlwaysConvertsToAbc extends Type<string, string> {

  override convertToDatabaseValue(value: string, platform: Platform): string {
    return 'abc';
  }

  override convertToJSValue(value: string, platform: Platform): string {
    return value;
  }

  override getColumnType(): string {
    return 'varchar';
  }

}

@Embeddable()
class Inner {

  @Property({ type: AlwaysConvertsToAbc })
  someValue: string;

  constructor(someValue: string) {
    this.someValue = someValue;
  }

}

@Embeddable()
class Nested {

  @Property({ type: AlwaysConvertsToAbc })
  someValue: string;

  @Embedded(() => Inner)
  deep: Inner;

  constructor(someValue: string) {
    this.someValue = someValue;
    this.deep = new Inner(someValue);
  }

}

@Entity()
class Parent {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Nested)
  nested!: Nested;

  @Embedded(() => Nested, { object: true })
  nested2!: Nested;

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

  @Property({ type: AlwaysConvertsToAbc, nullable: true })
  someValue?: string;

}

export class Numeric extends Type<number, string> {

  override convertToDatabaseValue(value: number): string {
    return value.toString();
  }

  override convertToJSValue(value: string): number {
    return Number(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return 'numeric(14,2)';
  }

}

@Embeddable()
class Savings {

  @Property({ type: Numeric })
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

}

@Embeddable()
class Statistic {

  @Property({ type: DoubleType })
  total: number;

  @Property({ type: DoubleType, persist: true })
  views!: number;

  constructor(total: number) {
    this.total = total;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Savings)
  savings!: Savings;

  @Embedded(() => Statistic, { prefix: false, nullable: true, persist: false })
  statistic?: Statistic;

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

}

describe('embedded entities with custom types', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Parent, User],
      dbName: 'mikro_orm_test_embeddables_custom_types',
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema', async () => {
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables custom types 1');
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables custom types 2');
    await expect(orm.schema.getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('embeddables custom types 3');
  });

  test('persist and load', async () => {
    const parent = new Parent();
    parent.nested = new Nested('shouldNeverBeSaved');
    parent.nested2 = new Nested('shouldNeverBeSaved');
    parent.someValue = '1231213';

    const mock = mockLogger(orm, ['query', 'query-params']);
    await orm.em.persistAndFlush(parent);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "parent" ("nested_some_value", "nested_deep_some_value", "nested2", "some_value") values ('abc', 'abc', '{"some_value":"abc","deep":{"some_value":"abc"}}', 'abc') returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);

    const p = await orm.em.findOneOrFail(Parent, parent.id);
    expect(mock.mock.calls[3][0]).toMatch('select "p0".* from "parent" as "p0" where "p0"."id" = 1 limit 1');
    expect(p.nested).toBeInstanceOf(Nested);
    expect(p.nested2).toBeInstanceOf(Nested);
    expect(p).toMatchObject({
      id: 1,
      nested: { someValue: 'abc', deep: { someValue: 'abc' } },
      nested2: { someValue: 'abc', deep: { someValue: 'abc' } },
      after: null,
      someValue: 'abc',
    });

    p.nested.someValue = '1231231';
    expect(mock.mock.calls).toHaveLength(4);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(4); // no new queries, as nothing really changed for the database
  });

  test('snapshot generator', async () => {
    const snapshotGenerator = orm.em.getComparator().getSnapshotGenerator('Parent');
    expect(snapshotGenerator.toString()).toMatchSnapshot();
  });

  test('persist and load 2', async () => {
    const user = new User();
    user.savings = new Savings(15200.23);

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."id" = $1 limit $2');
    expect(u.savings).toBeInstanceOf(Savings);
    expect(u.savings).toEqual({
      amount: 15200.23,
    });

    mock.mock.calls.length = 0;
    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(0);
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User, {
      savings: { amount: 15200.23 },
    });
    expect(mock.mock.calls[0][0]).toMatch('select "u0".* from "user" as "u0" where "u0"."savings_amount" = $1 limit $2');
    expect(u1.savings.amount).toBe(15200.23);
  });

});
