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

    const UserSchema = new EntitySchema<IUser>({
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

    const UserSchema = new EntitySchema<IUser>({
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

    const UserSchema = new EntitySchema<IUser>({
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

    const UserSchema = new EntitySchema<IUser>({
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

    const UserSchema = new EntitySchema<IUser>({
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

    const FooSchema = new EntitySchema<IFoo>({
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

    const AddressSchema = new EntitySchema<IAddress>({
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

    const UserSchema = new EntitySchema<IUser>({
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

    const FolderSchema = new EntitySchema<IFolder>({
      name: 'Folder',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        files: { kind: '1:m', entity: () => File, mappedBy: 'folder' },
      },
    });

    const FileSchema = new EntitySchema<IFile>({
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
        friends: () => p.manyToMany(User).mappedBy('id').inversedBy('friends'),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, { id: number; name: string; friends: Collection<IUser> }>>(true);

    const UserSchema = new EntitySchema<IUser>({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friends: { kind: 'm:n', entity: () => User, mappedBy: 'id', inversedBy: 'friends', ref: true },
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

    const UserSchema = new EntitySchema<IUser>({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: { kind: '1:1', entity: () => Profile, inversedBy: 'user', ref: true },
      },
    });

    const ProfileSchema = new EntitySchema<IProfile>({
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
    if (typeof prop.type === 'function') {
      Object.defineProperty(prop, 'type', { writable: false, value: expect.any(Function) });
    }
    if (typeof prop.items === 'function') {
      Object.defineProperty(prop, 'items', { writable: false, value: expect.any(Function) });
    }
    if (typeof prop.entity === 'function') {
      Object.defineProperty(prop, 'entity', { writable: false, value: expect.any(Function) });
    }
  }
  return snap;
}
