import { Collection, defineEntity, p, EntityProperty, Platform, Type } from '@mikro-orm/core';
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

const profileSchema = defineEntity({
  class: Profile,
  properties: {
    id: p.bigint().primary().autoincrement(),
    user: () => p.manyToOne(User).mapToPk(),
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

}

const userSchema = defineEntity({
  class: User,
  properties: {
    id: p.type(Id).primary().autoincrement(),
    email: p.string(),
    profiles: () => p.oneToMany(Profile).mappedBy('user'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [userSchema, profileSchema],
  });

  await orm.schema.create();
});

afterAll(async () => {
  await orm.close();
});

test('A profile user id should be a custom type', async () => {
  const em = orm.em.fork();
  const aUser = orm.em.create(User, {
    email: 'user@mail.com',
  });
  await em.persist(aUser).flush();

  const aProfile = orm.em.create(Profile, {
    user: aUser.id,
  });
  await em.persist(aProfile).flush();

  const userProfile = await em.findOneOrFail(Profile, { id: aProfile.id }, {
    refresh: true,
  });

  expect(userProfile).toBeTruthy();
  expect(userProfile.user).toBeInstanceOf(Id);
});
