import { Cascade, Collection, defineEntity, EntityDTO, EntityMetadata, EntitySchema, Hidden, InferEntity, Ref, Reference, ScalarReference, types } from '@mikro-orm/core';
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
          .mappedBy('courses')
          .where({ name: { $ilike: '%test%' } }),
      }),
    });

    const Course = defineEntity({
      name: 'Course',
      properties: p => ({
        id: p.integer().primary().autoincrement(),
        name: p.string(),
        students: () => p.manyToMany(Student),
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
          mappedBy: 'courses',
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
        tags: { type: types.array, customOrder: ['tag1', 'tag2', 'tag3'] },
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
        trackChanges: p.string().trackChanges(),
        persistFalse: p.string().persist(false),
        hydrateFalse: p.string().hydrate(false),
        trackChangesFalse: p.string().trackChanges(false),
        returning: p.string().returning(),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, {
      id: number;
      name: string;
      age: number;
      email: string;
      version: number;
      concurrency: number;
      getter: string;
      serializedPk: string;
      serializedName: string;
      groups: string;
      persist: string;
      hydrate: string;
      trackChanges: string;
      persistFalse: string;
      hydrateFalse: string;
      trackChangesFalse: string;
      returning: string;
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
        trackChanges: { type: types.string, trackChanges: true },
        persistFalse: { type: types.string, persist: false },
        hydrateFalse: { type: types.string, hydrate: false },
        trackChangesFalse: { type: types.string, trackChanges: false },
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
        settings: p.json<{ theme: string }>().ref(),
        bio: p.text().ref(false),
        status: p.enum(['active', 'inactive']).array(),
        type: p.type(types.smallint),
      }),
    });

    const FooSchema = new EntitySchema({
      name: 'Foo',
      properties: {
        id: { type: types.integer, primary: true, autoincrement: true },
        name: { type: types.string, check: 'length(name) > 3' },
        age: { type: types.integer, setter: true },
        email: { type: types.string, serializer: (value: string) => value.toLowerCase() },
        createdAt: { type: types.datetime, generated: '(now())' },
        updatedAt: { type: types.datetime, lazy: true, ref: true },
        settings: { type: types.json, ref: true },
        bio: { type: types.text, ref: false },
        status: { enum: true, items: ['active', 'inactive'], array: true },
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
          orderBy: { title: 'ASC' },
          where: { title: { $like: '%test%' } },
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
          .mapToPk()
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
          mapToPk: true,
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
          .mapToPk()
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
          mapToPk: true,
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
          ref: true,
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
          ref: true,
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
      }
    }
  }
  return snap;
}
