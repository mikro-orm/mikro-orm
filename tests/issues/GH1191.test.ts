import {
  Embeddable,
  Embedded,
  Entity,
  Logger,
  MikroORM,
  Platform,
  PrimaryKey,
  Property,
  Type,
} from '@mikro-orm/core';
import { PostgreSqlDriver, PostgreSqlPlatform } from '@mikro-orm/postgresql';

export class Numeric extends Type<number, string> {

  public convertToDatabaseValue(value: number, platform: Platform): string {
    this.validatePlatformSupport(platform);
    return value.toString();
  }

  public convertToJSValue(value: string, platform: Platform): number {
    this.validatePlatformSupport(platform);
    return Number(value);
  }

  public getColumnType(): string {
    return 'numeric(14,2)';
  }

  private validatePlatformSupport(platform: Platform): void {
    if (!(platform instanceof PostgreSqlPlatform)) {
      throw new Error('Numeric custom type implemented only for PG.');
    }
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

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded()
  savings!: Savings;

  @Property({ nullable: true })
  after?: number; // property after embeddables to verify order props in resulting schema

}

describe('embedded entities in postgresql', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Savings, User],
      dbName: 'mikro_orm_test_embeddables_custom_types',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema', async () => {
    await expect(
      orm.getSchemaGenerator().getCreateSchemaSQL(false)
    ).resolves.toMatchSnapshot('embeddables custom types 1');
    await expect(
      orm.getSchemaGenerator().getUpdateSchemaSQL(false)
    ).resolves.toMatchSnapshot('embeddables custom types 2');
    await expect(
      orm.getSchemaGenerator().getDropSchemaSQL(false)
    ).resolves.toMatchSnapshot('embeddables custom types 3');
  });

  test('persist and load', async () => {
    const user = new User();
    user.savings = new Savings(15200.23);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    await orm.em.persistAndFlush(user);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    const u = await orm.em.findOneOrFail(User, user.id);
    expect(mock.mock.calls[3][0]).toMatch(
      'select "e0".* from "user" as "e0" where "e0"."id" = $1 limit $2'
    );
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
    expect(mock.mock.calls[0][0]).toMatch(
      'select "e0".* from "user" as "e0" where "e0"."savings_amount" = $1 limit $2'
    );
    expect(u1.savings.amount).toBe(15200.23);
  });
});
