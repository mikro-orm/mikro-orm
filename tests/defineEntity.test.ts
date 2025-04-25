import { Collection, defineEntity, EntityDTO, EntityMetadata, EntitySchema, Hidden, InferEntity, Ref, Reference, ScalarReference, types } from '@mikro-orm/core';
import { IsExact, assert } from 'conditional-type-checks';

describe('defineEntity', () => {
  it('should define entity', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with json', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        settings: p.json<{ theme: string }>(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; settings: { theme: string } }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        settings: { type: types.json },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with nullable property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().nullable(),
        settings: p.json<{ theme: string }>().nullable(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string | null | undefined; settings: { theme: string } | null | undefined }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, nullable: true },
        settings: { type: types.json, nullable: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with reference scalar property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().ref(),
        email: p.string().ref().ref(false),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: Ref<string>; email: string }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, ref: true },
        email: { type: types.string, ref: false },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with hidden property', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().hidden(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    type ToObject = EntityDTO<IUser>;
    assert<IsExact<IUser, { id: number; name: Hidden<string> }>>(true);
    assert<IsExact<ToObject, { id: number }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, hidden: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with enum', () => {
    enum BaZ {
      FOO = 'foo',
      BAR = 'bar',
      BAZ = 1,
    }

    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bar: p.enum(['foo', 'bar', 1]),
        baz: p.enum(() => BaZ),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; bar: 'foo' | 'bar' | 1; baz: BaZ }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bar: { enum: true, items: ['foo', 'bar', 1] },
        baz: { enum: true, items: () => BaZ },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with embedded', () => {
    const Address = defineEntity({
      name: 'Address',
      embeddable: true,
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        street: p.string(),
        city: p.string(),
        state: p.string(),
        zip: p.string(),
      }),
    });

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        address: p.embedded(Address),
      }),
    });

    type IUser = InferEntity<typeof User>;
    type IAddress = InferEntity<typeof Address>;
    assert<IsExact<IUser, { id: number; name: string; address: IAddress }>>(true);

    const AddressSchema = new EntitySchema({
      name: 'Address',
      embeddable: true,
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        street: { type: types.string },
        city: { type: types.string },
        state: { type: types.string },
        zip: { type: types.string },
      },
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        address: { kind: 'embedded', entity: () => Address },
      },
    });

    expect(Address.meta).toEqual(asSnapshot(AddressSchema.meta));
    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with many to one relation', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friend: () => p.manyToOne(User),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; friend: Ref<IUser> }>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IUser['friend']>['friend']>['friend']>['name'], string>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IUser['friend']>['friend']>['friend']>['name'], number>>(false);

    const UserSchema = new EntitySchema<IUser>({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friend: { kind: 'm:1', entity: () => User, ref: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with one to many relation', () => {
    const Folder = defineEntity({
      name: 'Folder',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        files: () => p.oneToMany(File).mappedBy('folder'),
      }),
    });

    const File = defineEntity({
      name: 'File',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        folder: () => p.manyToOne(Folder),
      }),
    });

    type IFolder = InferEntity<typeof Folder>;
    type IFile = InferEntity<typeof File>;
    assert<IsExact<IFolder, { id: number; name: string; files: Collection<IFile> }>>(true);
    assert<IsExact<IFile, { id: number; name: string; folder: Ref<IFolder> }>>(true);

    const FolderSchema = new EntitySchema({
      name: 'Folder',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        files: { kind: '1:m', entity: () => File, mappedBy: 'folder' },
      },
    });

    const FileSchema = new EntitySchema({
      name: 'File',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        folder: { kind: 'm:1', entity: () => Folder, ref: true },
      },
    });

    expect(Folder.meta).toEqual(asSnapshot(FolderSchema.meta));
    expect(File.meta).toEqual(asSnapshot(FileSchema.meta));
  });

  it('should define entity with many to many relation', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friends: () => p.manyToMany(User)
          .owner()
          .inversedBy('friends')
          .fixedOrder()
          .fixedOrderColumn('order')
          .pivotTable('user_friends')
          .joinColumn('user_id')
          .inverseJoinColumn('friend_id')
          .referenceColumnName('id')
          .deleteRule('cascade')
          .updateRule('cascade'),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; friends: Collection<IUser> }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friends: {
          kind: 'm:n',
          entity: () => User,
          owner: true,
          inversedBy: 'friends',
          fixedOrder: true,
          fixedOrderColumn: 'order',
          pivotTable: 'user_friends',
          joinColumn: 'user_id',
          inverseJoinColumn: 'friend_id',
          referenceColumnName: 'id',
          deleteRule: 'cascade',
          updateRule: 'cascade',
        },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with one to one relation', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile).inversedBy('user'),
      }),
    });

    const Profile = defineEntity({
      name: 'Profile',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bio: p.string(),
        user: () => p.oneToOne(User),
      }),
    });

    type IUser = InferEntity<typeof User>;
    type IProfile = InferEntity<typeof Profile>;
    assert<IsExact<IUser, { id: number; name: string; profile: Ref<IProfile> }>>(true);
    assert<IsExact<IProfile, { id: number; bio: string; user: Ref<IUser> }>>(true);

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: { kind: '1:1', entity: () => Profile, inversedBy: 'user', ref: true },
      },
    });

    const ProfileSchema = new EntitySchema({
      name: 'Profile',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bio: { type: types.string },
        user: { kind: '1:1', entity: () => User, ref: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
  });

  it('should define entity with column type and length', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().columnType('varchar').length(255),
        age: p.integer().columnType('int').unsigned(),
        balance: p.decimal().precision(10).scale(2),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, columnType: 'varchar', length: 255 },
        age: { type: types.integer, columnType: 'int', unsigned: true },
        balance: { type: types.decimal, precision: 10, scale: 2 },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with default values', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().default('John Doe'),
        age: p.integer().default(18),
        isActive: p.boolean().default(true),
        createdAt: p.datetime().defaultRaw('CURRENT_TIMESTAMP'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, default: 'John Doe' },
        age: { type: types.integer, default: 18 },
        isActive: { type: types.boolean, default: true },
        createdAt: { type: types.datetime, defaultRaw: 'CURRENT_TIMESTAMP' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with formula and generated columns', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        firstName: p.string(),
        lastName: p.string(),
        fullName: p.string().formula(alias => `CONCAT(${alias}.firstName, ' ', ${alias}.lastName)`),
        age: p.integer().generated('EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date)'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        firstName: { type: types.string },
        lastName: { type: types.string },
        fullName: { type: types.string, formula: alias => `CONCAT(${alias}.firstName, ' ', ${alias}.lastName)` },
        age: { type: types.integer, generated: 'EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date)' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with indexes and unique constraints', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        email: p.string().unique(),
        username: p.string().unique('username_idx'),
        age: p.integer().index(),
        name: p.string().index('name_idx'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        email: { type: types.string, unique: true },
        username: { type: types.string, unique: 'username_idx' },
        age: { type: types.integer, index: true },
        name: { type: types.string, index: 'name_idx' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with check constraints', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        age: p.integer().check('age > 0'),
        email: p.string().check('email LIKE \'%@%\''),
        status: p.string().check('status IN (\'active\', \'inactive\', \'pending\')'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        age: { type: types.integer, check: 'age > 0' },
        email: { type: types.string, check: 'email LIKE \'%@%\'' },
        status: { type: types.string, check: 'status IN (\'active\', \'inactive\', \'pending\')' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with custom order and groups', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        age: p.integer(),
        status: p.string().customOrder('active', 'pending', 'inactive'),
        role: p.string().groups('admin', 'user'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        age: { type: types.integer },
        status: { type: types.string, customOrder: ['active', 'pending', 'inactive'] },
        role: { type: types.string, groups: ['admin', 'user'] },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with runtime type', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().runtimeType('string'),
        age: p.integer().runtimeType('number'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, runtimeType: 'string' },
        age: { type: types.integer, runtimeType: 'number' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with field names', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().fieldName('user_name'),
        age: p.integer().fieldNames('age_year', 'age_month'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, fieldName: 'user_name' },
        age: { type: types.integer, fieldNames: ['age_year', 'age_month'] },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with column types', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().columnType('varchar'),
        age: p.integer().columnTypes('int', 'bigint'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, columnType: 'varchar' },
        age: { type: types.integer, columnTypes: ['int', 'bigint'] },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with precision and scale', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        balance: p.decimal().precision(10).scale(2),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        balance: { type: types.decimal, precision: 10, scale: 2 },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with onCreate and onUpdate', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        createdAt: p.datetime().onCreate(() => new Date()),
        updatedAt: p.datetime().onUpdate(() => new Date()),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        createdAt: { type: types.datetime, onCreate: () => new Date() },
        updatedAt: { type: types.datetime, onUpdate: () => new Date() },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with returning', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().returning(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, returning: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with persist and hydrate', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().persist(false),
        age: p.integer().hydrate(false),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, persist: false },
        age: { type: types.integer, hydrate: false },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with trackChanges', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().trackChanges(false),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, trackChanges: false },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with version and concurrencyCheck', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        version: p.integer().version(),
        name: p.string().concurrencyCheck(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        version: { type: types.integer, version: true },
        name: { type: types.string, concurrencyCheck: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with setter and getter', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().setter(),
        fullName: p.string().getter(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, setter: true },
        fullName: { type: types.string, getter: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with serializedPrimaryKey', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        _id: p.string().serializedPrimaryKey(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        _id: { type: types.string, serializedPrimaryKey: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with serializer and serializedName', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().serializer((value: string) => value.toUpperCase()),
        age: p.integer().serializedName('userAge'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, serializer: (value: string) => value.toUpperCase() },
        age: { type: types.integer, serializedName: 'userAge' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with comment and extra', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().comment('User name'),
        age: p.integer().extra('AUTO_INCREMENT'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, comment: 'User name' },
        age: { type: types.integer, extra: 'AUTO_INCREMENT' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with ignoreSchemaChanges', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().ignoreSchemaChanges('type', 'extra'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, ignoreSchemaChanges: ['type', 'extra'] },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with embedded options', () => {
    const Address = defineEntity({
      name: 'Address',
      embeddable: true,
      properties: p => ({
        street: p.string(),
        city: p.string(),
        country: p.string(),
      }),
    });

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        address: p.embedded(Address)
          .prefix('addr_')
          .prefixMode('absolute')
          .object()
          .array(),
      }),
    });

    const AddressSchema = new EntitySchema({
      name: 'Address',
      embeddable: true,
      properties: {
        street: { type: types.string },
        city: { type: types.string },
        country: { type: types.string },
      },
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        address: {
          kind: 'embedded',
          entity: () => Address,
          prefix: 'addr_',
          prefixMode: 'absolute',
          object: true,
          array: true,
        },
      },
    });

    expect(Address.meta).toEqual(asSnapshot(AddressSchema.meta));
    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with enum options', () => {
    enum UserRole {
      ADMIN = 'admin',
      USER = 'user',
    }

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        roles: p.enum(() => UserRole)
          .array()
          .nativeEnumName('user_role'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        roles: {
          enum: true,
          items: () => UserRole,
          array: true,
          nativeEnumName: 'user_role',
        },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with custom type', () => {
    class Point {

      constructor(public x: number, public y: number) {}

}

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        location: p.type(types.json),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        location: { type: types.json },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with array type', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        tags: p.array(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        tags: { type: types.array },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with getterName', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        fullName: p.string().getter().getterName('getFullName'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        fullName: { type: types.string, getter: true, getterName: 'getFullName' },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });

  it('should define entity with deferMode', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile)
          .owner()
          .inversedBy('user')
          .deferMode('deferred'),
      }),
    });

    const Profile = defineEntity({
      name: 'Profile',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bio: p.string(),
        user: () => p.oneToOne(User),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: {
          kind: '1:1',
          entity: () => Profile,
          owner: true,
          inversedBy: 'user',
          deferMode: 'deferred',
          ref: true,
        },
      },
    });

    const ProfileSchema = new EntitySchema({
      name: 'Profile',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bio: { type: types.string },
        user: { kind: '1:1', entity: () => User, ref: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
  });

  it('should define entity with orphanRemoval', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        posts: () => p.oneToMany(Post).mappedBy('author').orphanRemoval(),
      }),
    });

    const Post = defineEntity({
      name: 'Post',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        author: () => p.manyToOne(User),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        posts: {
          kind: '1:m',
          entity: () => Post,
          mappedBy: 'author',
          orphanRemoval: true,
        },
      },
    });

    const PostSchema = new EntitySchema({
      name: 'Post',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        title: { type: types.string },
        author: { kind: 'm:1', entity: () => User, ref: true },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
    expect(Post.meta).toEqual(asSnapshot(PostSchema.meta));
  });

  it('should define entity with pivotEntity', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friends: () => p.manyToMany(User)
          .owner()
          .inversedBy('friends')
          .pivotEntity('UserFriends'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friends: {
          kind: 'm:n',
          entity: () => User,
          owner: true,
          inversedBy: 'friends',
          pivotEntity: 'UserFriends',
        },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });
});

type UnwrapRef<T> = T extends ScalarReference<any> ? UnwrapScalarReference<T> :
  T extends Reference<any> ? UnwrapReference<T> :
  T;

type UnwrapScalarReference<T extends ScalarReference<any>> = T extends ScalarReference<infer Value> ? Value : T;

type UnwrapReference<T extends Reference<any>> = T extends Reference<infer Value> ? Value : T;

function asSnapshot(value: EntityMetadata): EntityMetadata {
  const snap = new EntityMetadata({ ...value });
  Object.defineProperty(snap, '_id', { writable: false, value: expect.any(Number) });
  snap.root = expect.any(Object);
  for (const prop of Object.values(snap.properties)) {
    for (const [key, value] of Object.entries(prop)) {
      if (typeof value === 'function') {
        Object.defineProperty(prop, key, { value: expect.any(Function) });
      }
    }
  }
  return snap;
}
