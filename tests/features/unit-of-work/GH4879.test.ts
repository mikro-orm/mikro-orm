import { BigIntType, EntitySchema, ref, Ref, wrap } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

type ProfileProps = {
  imageUrl: string;
  active?: boolean;
  id?: number;
  userOrId?: User | number;
};

class Profile {
  readonly id: number;
  readonly imageUrl: string;
  readonly active: boolean;
  readonly user?: Ref<User>;

  constructor(props: ProfileProps) {
    this.imageUrl = props.imageUrl;
    this.active = props.active ?? true;
    this.id = props.id ?? 1;
    this.user = ref(User, props.userOrId);
  }
}

type CreateUserProps = {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: Ref<Profile>;
};

class User {
  readonly id!: number;
  readonly firstName!: string;
  readonly lastName!: string;
  readonly email!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  profile?: Ref<Profile>;

  constructor(props: CreateUserProps) {
    wrap<User>(this).assign(props);
  }
}

const profileSchema = new EntitySchema({
  class: Profile,
  forceConstructor: true,
  properties: {
    id: {
      type: new BigIntType('number'),
      primary: true,
      autoincrement: true,
    },
    imageUrl: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    user: {
      entity: () => User,
      kind: '1:1',
      mappedBy: 'profile',
      ref: true,
      nullable: true,
    },
  },
});

const userSchema = new EntitySchema<User>({
  class: User,
  forceConstructor: true,
  properties: {
    id: {
      type: new BigIntType('number'),
      primary: true,
      autoincrement: true,
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    createdAt: {
      type: 'timestamp',
      onCreate: () => new Date(),
    },
    updatedAt: {
      type: 'timestamp',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
    profile: {
      entity: () => Profile,
      kind: '1:1',
      inversedBy: 'user',
      nullable: true,
      ref: true,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [userSchema, profileSchema],
  });
  await orm.schema.create();
});

afterEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close();
});

test('creates a user and assign a profile to it (using entity)', async () => {
  // Arrange
  const aUser = orm.em.create(User, {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@mail.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await orm.em.flush();
  orm.em.clear();

  const em = orm.em.fork();

  const aProfile = new Profile({
    imageUrl: 'https://example.com',
    userOrId: aUser,
  });

  // Act
  await em.persist(aProfile).flush();

  // Assert
  const userWithProfile = await em.findOneOrFail(
    User,
    { id: aUser.id },
    {
      populate: ['profile'],
      refresh: true,
    },
  );
  expect(userWithProfile.profile).toBeTruthy();
});

test('creates a user and assign a profile to it (using id)', async () => {
  // Arrange
  const aUser = orm.em.create(User, {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@mail.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await orm.em.flush();
  orm.em.clear();
  const em = orm.em.fork();

  const aProfile = new Profile({
    imageUrl: 'https://example.com',
    userOrId: aUser.id,
  });

  // Act
  await em.persist(aProfile).flush();

  // Assert
  const userWithProfile = await em.findOneOrFail(
    User,
    { id: aUser.id },
    {
      populate: ['profile'],
      refresh: true,
    },
  );
  expect(userWithProfile.profile).toBeTruthy();
});
