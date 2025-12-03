import crypto from 'node:crypto';

import { MikroORM, Type, ValidationError } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class Tid {

  toString() {
    return this._id;
  }

  constructor(value?: string) {
    this._id = value ?? crypto.randomUUID().toString();
  }

  private readonly _id;

}

class TidType extends Type<Tid | undefined, string | undefined> {

  override convertToDatabaseValue(value: Tid | undefined): string | undefined {
    if (!value) {
      return;
    }

    if (value instanceof Tid) {
      return value.toString();
    }

    throw ValidationError.invalidType(TidType, value, 'JS');
  }

  override convertToJSValue(value: string | undefined): Tid | undefined {
    if (!value) {
      return;
    }

    try {
      return new Tid(value);
    } catch {
      throw ValidationError.invalidType(TidType, value, 'database');
    }
  }

  override getColumnType() {
    return 'char(200)';
  }

  override compareAsType(): string {
    return 'string';
  }

}

@Entity()
class User {

  @PrimaryKey({
    type: TidType,
  })
  id = new Tid();

  @Property({ unique: true })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: '6434',
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('joined strategy with custom types in collection items', async () => {
  const user = new User();
  user.name = 'userName';
  await orm.em.persist(user).flush();
  expect(orm.em.getUnitOfWork().getIdentityMap().values().includes(user)).toBe(true);

  const user2 = new User();
  user2.name = 'userName';
  await orm.em.upsert(User, user2, {
    onConflictFields: ['name'],
    onConflictExcludeFields: ['id'],
  });
  expect(orm.em.getUnitOfWork().getIdentityMap().values().includes(user)).toBe(false);
  expect(orm.em.getUnitOfWork().getIdentityMap().values().includes(user2)).toBe(true);
});
