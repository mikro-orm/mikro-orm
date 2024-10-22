import { MikroORM, serialize } from '@mikro-orm/better-sqlite';

import {
  Entity,
  EntityProperty,
  ManyToOne,
  Platform,
  PrimaryKey,
  Property, Ref,
  Type,
  ValidationError,
} from '@mikro-orm/core';

function isNil<TValue>(value: TValue | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/** String in TS, Integer in DB **/
export class IDStoredAsInteger extends Type<string, number> {

  convertToDatabaseValue(value: string, platform: Platform): number {
    if (isNil(value)) {
      return null as any;
    }
    try {
      return parseInt(value);
    } catch {
      throw ValidationError.invalidType(IDStoredAsInteger, value, 'JS');
    }
  }

  convertToJSValue(value: number, platform: Platform): string {
    if (!value && value !== 0) {
      return null as any;
    }
    return `${value}`;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return `integer`;
  }

  compareAsType(): string {
    return 'number';
  }

}


@Entity()
class User {

  @PrimaryKey({ type: IDStoredAsInteger })
  id!: string;

  @Property({ unique: true })
  email!: string;

  @ManyToOne(() => User, { nullable: true })
  bestFriend!: Ref<User> | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'XXXX',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('should apply custom type when serializing primary key of non-populated relation with forceObject: true', async () => {
  const totoUser = orm.em.create(User, {
    email: 'toto@test.com',
  });
  orm.em.create(User, {
    email: 'yolo@test.com',
    bestFriend: totoUser,
  });
  await orm.em.flush();
  orm.em.clear();

  const userWithoutPopulatedBestFriend = await orm.em.findOneOrFail(User, { email: 'yolo@test.com' });
  const serializedUserWithoutPopulatedBestFriend = serialize(userWithoutPopulatedBestFriend, { forceObject: true });
  expect(typeof serializedUserWithoutPopulatedBestFriend.id).toBe('string');
  expect(serializedUserWithoutPopulatedBestFriend.bestFriend).toBeDefined();
  expect(typeof serializedUserWithoutPopulatedBestFriend.bestFriend!.id).toBe('string'); // fails, == number

  const userWithPopulatedBestFriend = await orm.em.findOneOrFail(User, { email: 'yolo@test.com' }, { populate: ['bestFriend'] });
  const serializedUserWithPopulatedBestFriend = serialize(userWithPopulatedBestFriend, { forceObject: true });
  expect(typeof serializedUserWithPopulatedBestFriend.id).toBe('string');
  expect(serializedUserWithPopulatedBestFriend.bestFriend).toBeDefined();
  expect(typeof serializedUserWithPopulatedBestFriend.bestFriend!.id).toBe('string');
});

