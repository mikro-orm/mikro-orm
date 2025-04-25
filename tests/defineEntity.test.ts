import { Collection, defineEntity, EntityDTO, EntityMetadata, EntitySchema, Hidden, InferEntity, Ref, Reference, ScalarReference, types } from '@mikro-orm/core';
import { IsExact, assert } from 'conditional-type-checks';

describe('defineEntity', () => {
  it('should define entity', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with json', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        settings: p.json<{ theme: string }>(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string; settings: { theme: string } }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        settings: { type: types.json },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with nullable property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().nullable(),
        settings: p.json<{ theme: string }>().nullable(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string | null | undefined; settings: { theme: string } | null | undefined }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, nullable: true },
        settings: { type: types.json, nullable: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with reference scalar property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().ref(),
        email: p.string().ref().ref(false),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: Ref<string>; email: string }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, ref: true },
        email: { type: types.string, ref: false },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with hidden property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().hidden(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    type ToObject = EntityDTO<IFoo>;
    assert<IsExact<IFoo, { id: number; name: Hidden<string> }>>(true);
    assert<IsExact<ToObject, { id: number }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, hidden: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
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

    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        address: p.embedded(Address),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    type IAddress = InferEntity<typeof Address>;
    assert<IsExact<IFoo, { id: number; name: string; address: IAddress }>>(true);

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

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        address: { kind: 'embedded', entity: () => Address },
      },
    });

    expect(Address.meta).toEqual(asSnapshot(AddressSchema.meta));
    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with many to one relation', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friend: () => p.manyToOne(Foo),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string; friend: Ref<IFoo> }>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IFoo['friend']>['friend']>['friend']>['name'], string>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IFoo['friend']>['friend']>['friend']>['name'], number>>(false);

    const FooSchema = new EntitySchema<IFoo>({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friend: { kind: 'm:1', entity: () => Foo, ref: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
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
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friends: () => p.manyToMany(Foo)
          .owner()
          .inversedBy('friends')
          .fixedOrder()
          .fixedOrderColumn('order')
          .pivotTable('foo_friends')
          .joinColumn('foo_id')
          .inverseJoinColumn('friend_id')
          .referenceColumnName('id')
          .deleteRule('cascade')
          .updateRule('cascade'),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string; friends: Collection<IFoo> }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friends: {
          kind: 'm:n',
          entity: () => Foo,
          owner: true,
          inversedBy: 'friends',
          fixedOrder: true,
          fixedOrderColumn: 'order',
          pivotTable: 'foo_friends',
          joinColumn: 'foo_id',
          inverseJoinColumn: 'friend_id',
          referenceColumnName: 'id',
          deleteRule: 'cascade',
          updateRule: 'cascade',
        },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with one to one relation', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile).inversedBy('foo'),
      }),
    });

    const Profile = defineEntity({
      name: 'Profile',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bio: p.string(),
        foo: () => p.oneToOne(Foo),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    type IProfile = InferEntity<typeof Profile>;
    assert<IsExact<IFoo, { id: number; name: string; profile: Ref<IProfile> }>>(true);
    assert<IsExact<IProfile, { id: number; bio: string; foo: Ref<IFoo> }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: { kind: '1:1', entity: () => Profile, inversedBy: 'foo', ref: true },
      },
    });

    const ProfileSchema = new EntitySchema({
      name: 'Profile',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bio: { type: types.string },
        foo: { kind: '1:1', entity: () => Foo, ref: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
  });

  it('should define entity with column type and length', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().columnType('varchar').length(255),
        age: p.integer().columnType('int').unsigned(),
        balance: p.decimal().precision(10).scale(2),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, columnType: 'varchar', length: 255 },
        age: { type: types.integer, columnType: 'int', unsigned: true },
        balance: { type: types.decimal, precision: 10, scale: 2 },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with default values', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().default('John Doe'),
        age: p.integer().default(18),
        isActive: p.boolean().default(true),
        createdAt: p.datetime().defaultRaw('CURRENT_TIMESTAMP'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, default: 'John Doe' },
        age: { type: types.integer, default: 18 },
        isActive: { type: types.boolean, default: true },
        createdAt: { type: types.datetime, defaultRaw: 'CURRENT_TIMESTAMP' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with formula and generated columns', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        firstName: p.string(),
        lastName: p.string(),
        fullName: p.string().formula(alias => `CONCAT(${alias}.firstName, ' ', ${alias}.lastName)`),
        age: p.integer().generated('EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date)'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        firstName: { type: types.string },
        lastName: { type: types.string },
        fullName: { type: types.string, formula: alias => `CONCAT(${alias}.firstName, ' ', ${alias}.lastName)` },
        age: { type: types.integer, generated: 'EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date)' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with indexes and unique constraints', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        email: p.string().unique(),
        username: p.string().unique('username_idx'),
        age: p.integer().index(),
        name: p.string().index('name_idx'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        email: { type: types.string, unique: true },
        username: { type: types.string, unique: 'username_idx' },
        age: { type: types.integer, index: true },
        name: { type: types.string, index: 'name_idx' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with check constraints', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        age: p.integer().check('age > 0'),
        email: p.string().check('email LIKE \'%@%\''),
        status: p.string().check('status IN (\'active\', \'inactive\', \'pending\')'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        age: { type: types.integer, check: 'age > 0' },
        email: { type: types.string, check: 'email LIKE \'%@%\'' },
        status: { type: types.string, check: 'status IN (\'active\', \'inactive\', \'pending\')' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with custom order and groups', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        age: p.integer(),
        status: p.string().customOrder('active', 'pending', 'inactive'),
        role: p.string().groups('admin', 'user'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        age: { type: types.integer },
        status: { type: types.string, customOrder: ['active', 'pending', 'inactive'] },
        role: { type: types.string, groups: ['admin', 'user'] },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with runtime type', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().runtimeType('string'),
        age: p.integer().runtimeType('number'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, runtimeType: 'string' },
        age: { type: types.integer, runtimeType: 'number' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with field names', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().fieldName('foo_name'),
        age: p.integer().fieldNames('age_year', 'age_month'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, fieldName: 'foo_name' },
        age: { type: types.integer, fieldNames: ['age_year', 'age_month'] },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with column types', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().columnType('varchar'),
        age: p.integer().columnTypes('int', 'bigint'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, columnType: 'varchar' },
        age: { type: types.integer, columnTypes: ['int', 'bigint'] },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with precision and scale', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        balance: p.decimal().precision(10).scale(2),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        balance: { type: types.decimal, precision: 10, scale: 2 },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with onCreate and onUpdate', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        createdAt: p.datetime().onCreate(() => new Date()),
        updatedAt: p.datetime().onUpdate(() => new Date()),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        createdAt: { type: types.datetime, onCreate: () => new Date() },
        updatedAt: { type: types.datetime, onUpdate: () => new Date() },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with returning', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().returning(),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, returning: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with persist and hydrate', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().persist(false),
        age: p.integer().hydrate(false),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, persist: false },
        age: { type: types.integer, hydrate: false },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with trackChanges', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().trackChanges(false),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, trackChanges: false },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with version and concurrencyCheck', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        version: p.integer().version(),
        name: p.string().concurrencyCheck(),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        version: { type: types.integer, version: true },
        name: { type: types.string, concurrencyCheck: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with setter and getter', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().setter(),
        fullName: p.string().getter(),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, setter: true },
        fullName: { type: types.string, getter: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with serializedPrimaryKey', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        _id: p.string().serializedPrimaryKey(),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        _id: { type: types.string, serializedPrimaryKey: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with serializer and serializedName', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().serializer((value: string) => value.toUpperCase()),
        age: p.integer().serializedName('fooAge'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, serializer: (value: string) => value.toUpperCase() },
        age: { type: types.integer, serializedName: 'fooAge' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with comment and extra', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().comment('Foo name'),
        age: p.integer().extra('AUTO_INCREMENT'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, comment: 'Foo name' },
        age: { type: types.integer, extra: 'AUTO_INCREMENT' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with ignoreSchemaChanges', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().ignoreSchemaChanges('type', 'extra'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, ignoreSchemaChanges: ['type', 'extra'] },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
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

    const Foo = defineEntity({
      name: 'Foo',
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

    const FooSchema = new EntitySchema({
      name: 'Foo',
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
    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with enum options', () => {
    enum FooRole {
      ADMIN = 'admin',
      USER = 'user',
    }

    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        roles: p.enum(() => FooRole)
          .array()
          .nativeEnumName('foo_role'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        roles: {
          enum: true,
          items: () => FooRole,
          array: true,
          nativeEnumName: 'foo_role',
        },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with custom type', () => {
    class Point {

      constructor(public x: number, public y: number) {}

}

    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        location: p.type(types.json),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        location: { type: types.json },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with array type', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        tags: p.array(),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        tags: { type: types.array },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with getterName', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        fullName: p.string().getter().getterName('getFullName'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        fullName: { type: types.string, getter: true, getterName: 'getFullName' },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with deferMode', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile)
          .owner()
          .inversedBy('foo')
          .deferMode('deferred'),
      }),
    });

    const Profile = defineEntity({
      name: 'Profile',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bio: p.string(),
        foo: () => p.oneToOne(Foo),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: {
          kind: '1:1',
          entity: () => Profile,
          owner: true,
          inversedBy: 'foo',
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
        foo: { kind: '1:1', entity: () => Foo, ref: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
  });

  it('should define entity with orphanRemoval', () => {
    const Foo = defineEntity({
      name: 'Foo',
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
        author: () => p.manyToOne(Foo),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
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
        author: { kind: 'm:1', entity: () => Foo, ref: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
    expect(Post.meta).toEqual(asSnapshot(PostSchema.meta));
  });

  it('should define entity with pivotEntity', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        friends: () => p.manyToMany(Foo)
          .owner()
          .inversedBy('friends')
          .pivotEntity('FooFriends'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friends: {
          kind: 'm:n',
          entity: () => Foo,
          owner: true,
          inversedBy: 'friends',
          pivotEntity: 'FooFriends',
        },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
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
