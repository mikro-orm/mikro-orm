import { EntityProperty, Platform, Type, EntitySchema, Collection, BigIntType } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

class User {

  readonly id!: Id;
  readonly email!: string;
  readonly profiles = new Collection<Profile>(this);

}

class Profile {

  readonly id!: string;
  readonly user!: Id;

}

const profileSchema = new EntitySchema<Profile>({
  class: Profile,
  properties: {
    id: {
      type: BigIntType,
      primary: true,
      autoincrement: true,
    },
    user: {
      entity: () => User,
      kind: 'm:1',
      inversedBy: 'profiles' as any,
      mapToPk: true,
    },
  },
});

class Id extends Type<Id | undefined, string> {

  readonly value?: bigint;

  constructor(value: bigint | number) {
    super();
    if (value) {
      this.value = BigInt(value);
    }
  }

  convertToDatabaseValue(value: Id): string {
    return value?.value as unknown as string;
  }

  convertToJSValue(value: string): Id | undefined {
    return value ? new Id(+value) : undefined;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

  toString() {
    return this.value?.toString();
  }

}

const userSchema = new EntitySchema<User>({
  class: User,
  properties: {
    id: {
      type: Id,
      primary: true,
      autoincrement: true,
    },
    email: {
      type: 'string',
    },
    profiles: {
      entity: () => Profile,
      kind: '1:m',
      mappedBy: 'user',
      nullable: true,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [userSchema, profileSchema],
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('A profile user id should be a custom type', async () => {
  const em = orm.em.fork();
  const aUser = orm.em.create(User, {
    email: 'user@mail.com',
  });
  await em.persistAndFlush(aUser);

  const aProfile = orm.em.create(Profile, {
    user: aUser.id,
  });
  await em.persistAndFlush(aProfile);

  const userProfile = await em.findOneOrFail(Profile, { id: aProfile.id }, {
    refresh: true,
  });

  expect(userProfile).toBeTruthy();
  expect(userProfile.user).toBeInstanceOf(Id);
});
