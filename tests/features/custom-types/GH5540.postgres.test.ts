import { MikroORM, Entity, PrimaryKey, Property, Type, OptionalProps } from '@mikro-orm/postgresql';

type JSType = Date | number | undefined;
type DBType = string | number | undefined;

class TimestampType extends Type<JSType, DBType> {

  compareAsType(): string {
    return 'string';
  }

  convertToDatabaseValue(value: JSType) {
    if (!value) {
      return value;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    throw new Error(`Cannot serialize "${value}" to a timestamp.`);
  }

  convertToJSValue(value: DBType): Date | undefined {
    if (value == null) {
      return value;
    }
    return new Date(Number(value));
  }

  getColumnType() {
    return 'bigint';
  }

}

@Entity()
class UserEntity {

  @PrimaryKey()
  id!: number;

  @Property({ type: TimestampType })
  createdAt: Date = new Date();

  [OptionalProps]?: 'createdAt';

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [UserEntity],
    dbName: '5540',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('empty result with findByCursor and orderBy with Date', async () => {
  orm.em.create(UserEntity, {});
  await orm.em.flush();

  orm.em.clear();

  const found = await orm.em.findOneOrFail(UserEntity, 1);
  expect(found).toMatchObject({
    createdAt: expect.any(Date),
  });
  expect(found.createdAt.toString()).not.toBe('Invalid Date');
});
