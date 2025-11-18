import {
  Cascade,
  Collection,
  defineEntity,
  EntityData,
  EntityDTO,
  EntityMetadata,
  EntityName,
  EntitySchema,
  Hidden,
  InferEntity,
  InferEntityFromProperties,
  IType,
  Opt,
  Primary,
  PrimaryKeyProp,
  Ref,
  Reference,
  RequiredEntityData,
  ScalarReference,
  Type,
  types,
  p,
  ScalarRef,
} from '@mikro-orm/core';
import { IsExact, assert } from 'conditional-type-checks';
import { ObjectId } from 'bson';

describe('defineEntity', () => {
  it('should define entity', () => {
    const Foo = defineEntity({
      name: 'Foo',
      tableName: '233',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: Opt<number>; name: string; [PrimaryKeyProp]?: 'id' }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      tableName: '233',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));

    const p = defineEntity.properties;
    const Book = defineEntity({
      name: 'Book',
      properties: {
        _id: p.type(ObjectId).primary(),
        id: p.string().serializedPrimaryKey(),
        title: p.string(),
        tags: p.type('string[]').$type<string[]>(),
      },
    });

    type IBook = InferEntity<typeof Book>;
    assert<IsExact<IBook, { _id: ObjectId; id: string; title: string; tags: string[]; [PrimaryKeyProp]?: '_id' }>>(true);
  });

  it('should define entity with class', () => {
    const p = defineEntity.properties;
    const bookProperties = {
      id: p.string().serializedPrimaryKey(),
      title: p.string(),
      tags: p.array().$type<string[]>(),
    };
    class Book implements InferEntityFromProperties<typeof bookProperties> {

      id!: string;
      title!: string;
      tags!: string[];

    }
    const BookSchema = defineEntity({
      class: Book,
      className: 'Book',
      tableName: 'books',
      properties: bookProperties,
    });

    expectTypeOf(BookSchema.name).toEqualTypeOf<'Book'>();
    expectTypeOf(BookSchema.tableName).toEqualTypeOf<'books'>();

    expect(BookSchema.meta).toMatchObject(asSnapshot(new EntitySchema({
      class: Book,
      properties: {
        id: { type: types.string, serializedPrimaryKey: true },
        title: { type: types.string },
        tags: { type: new types.array() },
      },
    }).meta));
  });

  it('should define entity with primary keys', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        name: p.text().primary(),
      }),
    });
    expect(Foo.init().meta.primaryKeys).toEqual(['name']);
    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { name: string; [PrimaryKeyProp]?: 'name' }>>(true);

    const Car = defineEntity({
      name: 'Car',
      properties: p => ({
        name: p.string().primary(),
        year: p.integer().primary(),
      }),
    });
    expect(Car.init().meta.primaryKeys).toEqual(['name', 'year']);
    type ICar = InferEntity<typeof Car>;
    assert<IsExact<ICar, { name: string; year: number; [PrimaryKeyProp]?: ('name' | 'year')[] }>>(true);

    // @ts-expect-error
    const Car2 = defineEntity({
      name: 'Car2',
      properties: p => ({
        name: p.string().primary(),
        year: p.integer().primary(),
        description: p.text(),
      }),
      primaryKeys: ['description'],
    });

    const WithPrimaryKeys = defineEntity({
      name: 'Bar',
      properties: p => ({
        firstName: p.string().primary(),
        lastName: p.string().primary(),
        age: p.integer(),
      }),
      primaryKeys: ['firstName', 'lastName'],
    });

    expect(WithPrimaryKeys.init().meta.primaryKeys).toEqual(['firstName', 'lastName']);
    type IBar = InferEntity<typeof WithPrimaryKeys>;
    assert<IsExact<IBar, {
      firstName: string;
      lastName: string;
      age: number;
      [PrimaryKeyProp]?: ['firstName', 'lastName'];
    }>>(true);
  });

  it('should be able to custom types with $type', async () => {
    const myClassSymbol = Symbol('MyClass');

    interface MyClass {
      [myClassSymbol]: true;
    }

    const MyEntity = defineEntity({
      name: 'MyEntity',
      properties: p => ({
        myClass: p.json().$type<MyClass, string>(),
      }),
    });

    type IMyEntity = InferEntity<typeof MyEntity>;
    assert<IsExact<Primary<IMyEntity>, Primary<{ myClass: IType<MyClass, string> }>>>(true);
    assert<IsExact<IMyEntity, { myClass: IType<MyClass, string>; [PrimaryKeyProp]?: undefined }>>(true);

    function create<T>(type: EntityName<T>, data: EntityData<T> | RequiredEntityData<T>) {
      //
    }

    create(MyEntity, { myClass: {} as MyClass });
    // @ts-expect-error
    create(MyEntity, { myClass: '...' });
    // @ts-expect-error
    create(MyEntity, { myClass: 123 });
    // @ts-expect-error
    create(MyEntity, { myClass: true });

    const o = {} as EntityDTO<IMyEntity>;
    const myClass = o.myClass;
    assert<IsExact<typeof myClass, string>>(true);

    const dOk1 = { myClass: '' } as EntityData<IMyEntity, true>;
    // @ts-expect-error
    const dErr1 = { myClass: '' } as EntityData<IMyEntity, false>;
    const dOk2 = {} as EntityData<IMyEntity, true>;
    const dOk3 = {} as EntityData<IMyEntity, false>;
  });

  it('should define entity with base properties', () => {
    const p = defineEntity.properties;

    const CustomBaseProperties = {
      id: p.integer().primary(),
      createdAt: p.datetime()
        .onCreate(() => new Date()),
      updatedAt: p.datetime()
        .onCreate(() => new Date())
        .onUpdate(() => new Date()),
    };

    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        ...CustomBaseProperties,
        name: p.string(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, { id: number; name: string; createdAt: Opt<Date>; updatedAt: Opt<Date>; [PrimaryKeyProp]?: 'id' }>>(true);
  });

  it('should define entity with class constructor as extends', () => {
    class BaseEntity {

      id!: number;
      createdAt!: Date;

    }

    const BaseSchema = defineEntity({
      class: BaseEntity,
      abstract: true,
      properties: {
        id: p.integer().primary(),
        createdAt: p.datetime().onCreate(() => new Date()),
      },
    });

    class User {

      id!: number;
      createdAt!: Date;
      name!: string;

    }

    const UserSchema = defineEntity({
      class: User,
      extends: BaseEntity,
      properties: {
        name: p.string(),
      },
    });

    expect(UserSchema.meta.extends).toBe(BaseEntity);
    expect(UserSchema.meta.className).toBe('User');
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
    assert<IsExact<IFoo, { id: Opt<number>; name: string; settings: { theme: string }; [PrimaryKeyProp]?: 'id' }>>(true);

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

  it('should define entity with formula', () => {
    const Box = defineEntity({
      name: 'Box',
      properties: p => ({
        objectVolume: p.formula<number>('obj_length * obj_height * obj_width'),
      }),
    });

    type IBox = InferEntity<typeof Box>;
    assert<IsExact<IBox, { objectVolume: number; [PrimaryKeyProp]?: undefined }>>(true);
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
    assert<IsExact<IFoo, { id: Opt<number>; name: string | null | undefined; settings: { theme: string } | null | undefined; [PrimaryKeyProp]?: 'id' }>>(true);

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
    const p = defineEntity.properties;
    interface IProfile {
      email: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      phone: string;
      avatar: string;
      bio: string;
      social: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
      preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: string;
      };
    }
    const profile = p.json<IProfile>().lazy();
    const Foo = defineEntity({
      name: 'Foo',
      properties: ({
        id: p.integer().primary(),
        name: p.string().ref(),
        profileLazy: profile,
        profileNullable: profile.nullable(),
        profile: profile.ref(false),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: number;
      name: Ref<string>;
      profile: IProfile;
      profileLazy: ScalarRef<IProfile>;
      profileNullable: ScalarRef<IProfile | null | undefined>;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true },
        name: { type: types.string, ref: true },
        profile: { type: types.json, lazy: true, ref: false },
        profileLazy: { type: types.json, lazy: true, ref: true },
        profileNullable: { type: types.json, lazy: true, ref: true, nullable: true },
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
    assert<IsExact<IFoo, { id: Opt<number>; name: Hidden<string>; [PrimaryKeyProp]?: 'id' }>>(true);
    assert<IsExact<ToObject, { id: Opt<number> }>>(true);

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
    assert<IsExact<IFoo, { id: Opt<number>; bar: 'foo' | 'bar' | 1; baz: BaZ; [PrimaryKeyProp]?: 'id' }>>(true);

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
    assert<IsExact<IFoo, { id: Opt<number>; name: string; address: IAddress; [PrimaryKeyProp]?: 'id' }>>(true);

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
        friend: () => p.manyToOne(Foo).ref(),
        friendNullable: () => p.manyToOne(Foo).ref().nullable(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      friend: Ref<IFoo>;
      friendNullable: Ref<IFoo> | null | undefined;
      [PrimaryKeyProp]?: 'id';
    }>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IFoo['friend']>['friend']>['friend']>['name'], string>>(true);
    assert<IsExact<UnwrapRef<UnwrapRef<UnwrapRef<IFoo['friend']>['friend']>['friend']>['name'], number>>(false);

    const FooSchema = new EntitySchema<IFoo>({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        friend: { kind: 'm:1', entity: () => Foo, ref: true },
        friendNullable: { kind: 'm:1', entity: () => Foo, ref: true, nullable: true },
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
        folder: () => p.manyToOne(Folder).ref(),
      }),
    });

    type IFolder = InferEntity<typeof Folder>;
    type IFile = InferEntity<typeof File>;
    assert<IsExact<IFolder, { id: Opt<number>; name: string; files: Collection<IFile>; [PrimaryKeyProp]?: 'id' }>>(true);
    assert<IsExact<IFile, { id: Opt<number>; name: string; folder: Ref<IFolder>; [PrimaryKeyProp]?: 'id' }>>(true);

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
    assert<IsExact<IFoo, { id: Opt<number>; name: string; friends: Collection<IFoo>; [PrimaryKeyProp]?: 'id' }>>(true);

    const Student = defineEntity({
      name: 'Student',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        courses: () => p.manyToMany(Course)
          .owner()
          .inversedBy('students')
          .inverseJoinColumns('id')
          .orderBy({ name: 'ASC' })
          .where({ name: { $ilike: '%test%' } }),
      }),
    });

    const Course = defineEntity({
      name: 'Course',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        students: () => p.manyToMany(Student)
          .orderBy({ name: 'ASC' })
          .where({ name: { $ilike: '%test%' } }),
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

    const StudentSchema = new EntitySchema({
      name: 'Student',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        courses: {
          kind: 'm:n',
          entity: () => Course,
          owner: true,
          inversedBy: 'students',
          inverseJoinColumns: ['id'],
          orderBy: [{ name: 'ASC' }],
          where: [{ name: { $ilike: '%test%' } }],
        },
      },
    });

    const CourseSchema = new EntitySchema({
      name: 'Course',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        students: {
          kind: 'm:n',
          entity: () => Student,
          orderBy: [{ name: 'ASC' }],
          where: [{ name: { $ilike: '%test%' } }],
        },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
    expect(Student.meta).toEqual(asSnapshot(StudentSchema.meta));
    expect(Course.meta).toEqual(asSnapshot(CourseSchema.meta));
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
    assert<IsExact<IFoo, { id: Opt<number>; name: string; profile: IProfile; [PrimaryKeyProp]?: 'id' }>>(true);
    assert<IsExact<IProfile, { id: Opt<number>; bio: string; foo: IFoo; [PrimaryKeyProp]?: 'id' }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: { kind: '1:1', entity: () => Profile, inversedBy: 'foo' },
      },
    });

    const ProfileSchema = new EntitySchema({
      name: 'Profile',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bio: { type: types.string },
        foo: { kind: '1:1', entity: () => Foo },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
  });

  it('should define entity with bigint property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        bigintValue: p.bigint(),
        bigintAsNumber: p.bigint('number'),
        bigintAsString: p.bigint('string'),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      bigintValue: bigint;
      bigintAsNumber: number;
      bigintAsString: string;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        bigintValue: { type: new types.bigint() },
        bigintAsNumber: { type: new types.bigint('number') },
        bigintAsString: { type: new types.bigint('string') },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with array property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        tags: p.array(),
        numbers: p.array(Number),
        customArray: p.array<{ id: number; name: string }>(
          i => JSON.parse(i),
          o => JSON.stringify(o),
        ),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      tags: string[];
      numbers: number[];
      customArray: { id: number; name: string }[];
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        tags: { type: new types.array() },
        numbers: { type: new types.array(i => Number(i), n => String(n)) },
        customArray: { type: new types.array(i => JSON.parse(i), o => JSON.stringify(o)) },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define entity with decimal property', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        price: p.decimal(),
        amount: p.decimal('number'),
        balance: p.decimal('string'),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      price: string;
      amount: number;
      balance: string;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        price: { type: new types.decimal() },
        amount: { type: new types.decimal('number') },
        balance: { type: new types.decimal('string') },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });
});

describe('PropertyOptionsBuilder', () => {
  it('should define complex property options (1)', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().nullable().unique().index().comment('user name'),
        age: p.integer().unsigned().default(18).precision(3).scale(1),
        email: p.string().length(255).columnType('varchar').fieldName('user_email'),
        createdAt: p.datetime().defaultRaw('now()').onCreate(() => new Date()),
        updatedAt: p.datetime().onUpdate(() => new Date()),
        settings: p.json<{ theme: string }>().hidden(),
        bio: p.text().formula('concat(first_name, " ", last_name)'),
        status: p.enum(['active', 'inactive']).nativeEnumName('user_status'),
        tags: p.array().customOrder('tag1', 'tag2', 'tag3'),
        extra: p.string().extra('VIRTUAL'),
        ignoreChanges: p.string().ignoreSchemaChanges('type', 'extra', 'default'),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, nullable: true, unique: true, index: true, comment: 'user name' },
        age: { type: types.integer, unsigned: true, default: 18, precision: 3, scale: 1 },
        email: { type: types.string, length: 255, columnType: 'varchar', fieldName: 'user_email' },
        createdAt: { type: types.datetime, defaultRaw: 'now()', onCreate: () => new Date() },
        updatedAt: { type: types.datetime, onUpdate: () => new Date() },
        settings: { type: types.json, hidden: true },
        bio: { type: types.text, formula: 'concat(first_name, " ", last_name)' },
        status: { enum: true, items: ['active', 'inactive'], nativeEnumName: 'user_status' },
        tags: { type: new types.array(), customOrder: ['tag1', 'tag2', 'tag3'] },
        extra: { type: types.string, extra: 'VIRTUAL' },
        ignoreChanges: { type: types.string, ignoreSchemaChanges: ['type', 'extra', 'default'] },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define complex property options (2)', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().name('username').fieldNames('first_name', 'last_name'),
        age: p.integer().columnTypes('int', 'smallint'),
        email: p.string().type(types.text).runtimeType('string'),
        version: p.integer().version(),
        concurrency: p.integer().concurrencyCheck(),
        getter: p.string().getter().getterName('getName'),
        serializedPk: p.string().serializedPrimaryKey(),
        serializedName: p.string().serializedName('user_name'),
        groups: p.string().groups('admin', 'user'),
        persist: p.string().persist(),
        hydrate: p.string().hydrate(),
        persistFalse: p.string().persist(false),
        hydrateFalse: p.string().hydrate(false),
        returning: p.string().returning(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      age: number;
      email: string;
      version: Opt<number>;
      concurrency: number;
      getter: string;
      serializedPk: string;
      serializedName: string;
      groups: string;
      persist: string;
      hydrate: string;
      persistFalse: Opt<string>;
      hydrateFalse: string;
      returning: string;
      [PrimaryKeyProp]?: 'id';
  }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, name: 'username', fieldNames: ['first_name', 'last_name'] },
        age: { type: types.integer, columnTypes: ['int', 'smallint'] },
        email: { type: types.text, runtimeType: 'string' },
        version: { type: types.integer, version: true },
        concurrency: { type: types.integer, concurrencyCheck: true },
        getter: { type: types.string, getter: true, getterName: 'getName' },
        serializedPk: { type: types.string, serializedPrimaryKey: true },
        serializedName: { type: types.string, serializedName: 'user_name' },
        groups: { type: types.string, groups: ['admin', 'user'] },
        persist: { type: types.string, persist: true },
        hydrate: { type: types.string, hydrate: true },
        persistFalse: { type: types.string, persist: false },
        hydrateFalse: { type: types.string, hydrate: false },
        returning: { type: types.string, returning: true },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define complex property options (3)', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().check('length(name) > 3'),
        age: p.integer().setter(),
        email: p.string().serializer(value => value.toLowerCase()),
        createdAt: p.datetime().generated('(now())'),
        updatedAt: p.datetime().lazy(),
        settings: p.json<{ theme: string }>().ref().nullable(),
        bio: p.text().ref(false),
        status: p.enum(['active', 'inactive']).array().default(['active']),
        type: p.type(types.smallint),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: Opt<number>;
      name: string;
      age: number;
      email: string;
      createdAt: Date;
      updatedAt: ScalarReference<Date>;
      settings: ScalarReference<{
          theme: string;
      } | null | undefined>;
      bio: string;
      status: Opt<('active' | 'inactive')[]>;
      type: number;
      [PrimaryKeyProp]?: 'id';
  }>>(true);

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, check: 'length(name) > 3' },
        age: { type: types.integer, setter: true },
        email: { type: types.string, serializer: (value: string) => value.toLowerCase() },
        createdAt: { type: types.datetime, generated: '(now())' },
        updatedAt: { type: types.datetime, lazy: true, ref: true },
        settings: { type: types.json, ref: true, nullable: true },
        bio: { type: types.text, ref: false },
        status: { enum: true, items: ['active', 'inactive'], array: true, default: ['active'] },
        type: { type: types.smallint },
      },
    });

    expect(Foo.meta).toEqual(asSnapshot(FooSchema.meta));
  });

  it('should define complex property options (4)', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string().runtimeType('string'),
        score: p.float().scale(2),
        insertedId: p.integer().returning(),
        serializedId: p.string().serializedPrimaryKey(),
        email: p.string().serializer(value => value.toLowerCase()).serializedName('user_email'),
        role: p.string().groups('admin', 'user'),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, runtimeType: 'string' },
        score: { type: types.float, scale: 2 },
        insertedId: { type: types.integer, returning: true },
        serializedId: { type: types.string, serializedPrimaryKey: true },
        email: { type: types.string, serializer: (value: string) => value.toLowerCase(), serializedName: 'user_email' },
        role: { type: types.string, groups: ['admin', 'user'] },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });
});

describe('EmbeddedOptionsBuilder', () => {
  it('should define embedded entity with options', () => {
    const Address = defineEntity({
      name: 'Address',
      embeddable: true,
      properties: p => ({
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
        homeAddress: p.embedded(Address)
          .prefix('home_')
          .prefixMode('relative')
          .object(),
        workAddress: p.embedded(Address)
          .prefix('work_')
          .prefixMode('relative')
          .array(),
      }),
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        homeAddress: {
          kind: 'embedded',
          entity: () => Address,
          prefix: 'home_',
          prefixMode: 'relative',
          object: true,
        },
        workAddress: {
          kind: 'embedded',
          entity: () => Address,
          prefix: 'work_',
          prefixMode: 'relative',
          array: true,
        },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
    User.init();
  });
});

describe('ManyToManyRelationOptionsBuilder', () => {
  it('should define many to many relation with options', () => {
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
    User.init();
  });
});

describe('OneToManyRelationOptionsBuilder', () => {
  it('should define one to many relation with options', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    const Post = defineEntity({
      name: 'Post',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        author: () => p.manyToOne(User).joinColumns('author_id'),
      }),
    });

    const Blog = defineEntity({
      name: 'Blog',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        posts: () => p.oneToMany(Post)
          .mappedBy('author')
          .orphanRemoval()
          .orderBy({ title: 'ASC' })
          .where({ title: { $like: '%test%' } })
          .joinColumn('blog_id')
          .joinColumns('id')
          .inverseJoinColumns('post_id')
          .inverseJoinColumn('post_id')
          .referenceColumnName('id')
          .referencedColumnNames('id', 'post_id'),
      }),
    });

    const BlogSchema = new EntitySchema({
      name: 'Blog',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        posts: {
          kind: '1:m',
          entity: () => Post,
          mappedBy: 'author',
          orphanRemoval: true,
          orderBy: [{ title: 'ASC' }],
          where: [{ title: { $like: '%test%' } }],
          joinColumn: 'blog_id',
          joinColumns: ['id'],
          inverseJoinColumn: 'post_id',
          inverseJoinColumns: ['post_id'],
          referenceColumnName: 'id',
          referencedColumnNames: ['id', 'post_id'],
        },
      },
    });

    expect(Blog.meta).toEqual(asSnapshot(BlogSchema.meta));
  });
});

describe('OneToOneRelationOptionsBuilder', () => {
  it('should define one to one relation with options', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile)
          .owner()
          .inversedBy('user')
          .ref()
          .primary()
          .ownColumns('profile_id')
          .deleteRule('cascade')
          .updateRule('cascade')
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
          ref: true,
          primary: true,
          ownColumns: ['profile_id'],
          deleteRule: 'cascade',
          updateRule: 'cascade',
          deferMode: 'deferred',
        },
      },
    });

    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
    User.init();
  });

  it('should define one to one relation with mapToPk option', () => {
    const Profile = defineEntity({
      name: 'Profile',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        bio: p.string(),
        user: () => p.oneToOne(User),
      }),
    });

    type IProfile = InferEntity<typeof Profile>;
    assert<IsExact<IProfile, {
      id: Opt<number>;
      bio: string;
      user: IUser;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        profile: () => p.oneToOne(Profile).mapToPk(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, {
      id: Opt<number>;
      name: string;
      profile: number;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const ProfileSchema = new EntitySchema({
      name: 'Profile',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        bio: { type: types.string },
        user: { kind: '1:1', entity: () => User },
      },
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        profile: { kind: '1:1', entity: () => Profile, mapToPk: true },
      },
    });

    expect(Profile.meta).toEqual(asSnapshot(ProfileSchema.meta));
    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });
});

describe('ManyToOneRelationOptionsBuilder', () => {
  it('should define many to one relation with options', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: { type: types.integer, primary: true, autoincrement: true },
        name: p.string(),
        posts: () => p.oneToMany(Post).mappedBy('author'),
      }),
    });

    const Post = defineEntity({
      name: 'Post',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        author: () => p.manyToOne(User)
          .inversedBy('posts')
          .ref()
          .primary()
          .createForeignKeyConstraint(false)
          .foreignKeyName('author_id')
          .joinColumn('author_id')
          .referenceColumnName('id')
          .deleteRule('cascade')
          .updateRule('cascade')
          .deferMode('immediate'),
      }),
    });

    const PostSchema = new EntitySchema({
      name: 'Post',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        title: { type: types.string },
        author: {
          kind: 'm:1',
          entity: () => User,
          inversedBy: 'posts',
          ref: true,
          primary: true,
          createForeignKeyConstraint: false,
          foreignKeyName: 'author_id',
          joinColumn: 'author_id',
          referenceColumnName: 'id',
          deleteRule: 'cascade',
          updateRule: 'cascade',
          deferMode: 'immediate',
        },
      },
    });

    expect(Post.meta).toEqual(asSnapshot(PostSchema.meta));
    User.init();
    Post.init();
  });

  it('should define many to one relation with mapToPk option', () => {
    const Group = defineEntity({
      name: 'Group',
      properties: p => ({
        name: p.string().primary().unique().onCreate(() => ''),
        users: () => p.oneToMany(User).mappedBy('group'),
      }),
    });

    type IGroup = InferEntity<typeof Group>;
    assert<IsExact<IGroup, {
      name: Opt<string>;
      users: Collection<IUser>;
      [PrimaryKeyProp]?: 'name';
    }>>(true);

    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        group: () => p.manyToOne(Group).mapToPk(),
      }),
    });

    type IUser = InferEntity<typeof User>;
    assert<IsExact<IUser, {
      id: Opt<number>;
      name: string;
      group: string;
      [PrimaryKeyProp]?: 'id';
    }>>(true);

    const GroupSchema = new EntitySchema({
      name: 'Group',
      properties: {
        name: { type: types.string, primary: true, unique: true, onCreate: () => '' },
        users: { kind: '1:m', entity: () => User, mappedBy: 'group' },
      },
    });

    const UserSchema = new EntitySchema({
      name: 'User',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        group: { kind: 'm:1', entity: () => Group, mapToPk: true },
      },
    });

    expect(Group.meta).toEqual(asSnapshot(GroupSchema.meta));
    expect(User.meta).toEqual(asSnapshot(UserSchema.meta));
  });
});

describe('ReferenceOptionsBuilder', () => {
  it('should define reference options', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    const Post = defineEntity({
      name: 'Post',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        author: () => p.manyToOne(User)
          .cascade(Cascade.PERSIST, Cascade.MERGE)
          .eager()
          .strategy('joined'),
      }),
    });

    const PostSchema = new EntitySchema({
      name: 'Post',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        title: { type: types.string },
        author: {
          kind: 'm:1',
          entity: () => User,
          cascade: [Cascade.PERSIST, Cascade.MERGE],
          eager: true,
          strategy: 'joined',
        },
      },
    });

    expect(Post.meta).toEqual(asSnapshot(PostSchema.meta));
  });
});

describe('ManyToManyOptionsBuilder', () => {
  it('should define many to many relation with pivot entity', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    const Tag = defineEntity({
      name: 'Tag',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        users: () => p.manyToMany(User)
          .joinColumns('id')
          .pivotEntity('UserTag')
          .referencedColumnNames('user_id', 'tag_id'),
      }),
    });

    const TagSchema = new EntitySchema({
      name: 'Tag',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string },
        users: {
          kind: 'm:n',
          entity: () => User,
          joinColumns: ['id'],
          pivotEntity: 'UserTag',
          referencedColumnNames: ['user_id', 'tag_id'],
        },
      },
    });

    expect(Tag.meta).toEqual(asSnapshot(TagSchema.meta));
  });
});

describe('ManyToOneOptionsBuilder', () => {
  it('should define many to one relation with composite keys', () => {
    const User = defineEntity({
      name: 'User',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      }),
    });

    const Post = defineEntity({
      name: 'Post',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        author: () => p.manyToOne(User)
          .ownColumns('id')
          .joinColumns('author_id', 'author_version')
          .referencedColumnNames('id', 'version'),
      }),
    });

    const PostSchema = new EntitySchema({
      name: 'Post',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        title: { type: types.string },
        author: {
          kind: 'm:1',
          entity: () => User,
          joinColumns: ['author_id', 'author_version'],
          ownColumns: ['id'],
          referencedColumnNames: ['id', 'version'],
        },
      },
    });

    expect(Post.meta).toEqual(asSnapshot(PostSchema.meta));
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
      } else if (value && typeof value === 'object' && value instanceof Type) {
        Object.defineProperty(prop, key, { value: expect.any(value.constructor) });
      }
    }
  }
  return snap;
}
