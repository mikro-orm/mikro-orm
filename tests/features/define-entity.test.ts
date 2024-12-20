import {
  EntitySchema,
  InferEntity,
  Reference,
  Collection,
  InferEntityFromProperties,
  RequiredEntityData,
  Opt,
  Ref,
  TextType,
  types,
  ReferenceKind,
  defineEntity,
  defineEntityProperties,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { IsExact, assert } from 'conditional-type-checks';

const p = defineEntity.properties;

describe('define-entity', () => {
  const Bar = defineEntity({
    name: 'bar',
    properties: {
      foo: p.string(),
    },
  });

  interface IBar extends InferEntity<typeof Bar> {}

  it('should define entity with properties', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        string: p.string(),
        number: p.float(),
        date: p.datetime(),
        array: p.array(),
        enum: p.enum(['a', 'b'] as const),
        json: p.json<{ bar: string }>(),
        text: p.property(TextType),
        text1: p.property('text'),
        float: p.property('float', { onCreate: () => 0 }),
        uuid: p.uuid(),
      },
    });

    interface IFooExpected {
      string: string;
      number: number;
      date: Date;
      array: string[];
      enum: 'a' | 'b';
      json: { bar: string };
      text: string;
      text1: string;
      float: Opt<number>;
      uuid: string;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema({
      name: 'foo',
      properties: {
        string: { type: types.string },
        number: { type: types.float },
        date: { type: types.datetime },
        array: { type: types.array },
        enum: { enum: true, items: ['a', 'b'] },
        json: { type: types.json },
        text: { type: TextType },
        text1: { type: 'text' },
        float: { type: 'float', onCreate: expect.any(Function) },
        uuid: { type: types.uuid },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with properties from combination', () => {
    const WithTimes = defineEntity({
      name: 'WithTimes',
      properties: {
        createdAt: p.datetime(),
        updatedAt: p.datetime(),
      },
    });

    const Foo = defineEntity({
      name: 'foo',
      properties: {
        ...WithTimes.properties,
        bar: p.string(),
      },
    });

    interface IFooExpected {
      createdAt: Date;
      updatedAt: Date;
      bar: string;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        createdAt: { type: types.datetime },
        updatedAt: { type: types.datetime },
        bar: { type: types.string },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with nullable properties', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.text(),
        required: p.text({ nullable: false }),
        nullable: p.text({ nullable: true }),
        json: p.json<{ bar: string }>(),
        jsonRequired: p.json<{ bar: string }>({ nullable: false }),
        jsonOptional: p.json<{ bar: string }>({
          onCreate: () => ({ bar: '' }),
        }),
        jsonNullable: p.json<{ bar: string }>({ nullable: true }),
      },
    });

    interface IFooExpected {
      directly: string;
      required: string;
      nullable: string | undefined | null;
      json: { bar: string };
      jsonRequired: { bar: string };
      jsonOptional: Opt<{ bar: string }>;
      jsonNullable: { bar: string } | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: { type: types.text },
        required: { type: types.text, nullable: false },
        nullable: { type: types.text, nullable: true },
        json: { type: types.json },
        jsonRequired: { type: types.json, nullable: false },
        jsonOptional: { type: types.json, onCreate: expect.any(Function) },
        jsonNullable: { type: types.json, nullable: true },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with manyToOne relations', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.manyToOne(() => Bar),
        ref: p.manyToOne(() => Bar, { ref: true }),
        nullableDirectly: p.manyToOne(() => Bar, { nullable: true }),
        nullableRef: p.manyToOne(() => Bar, { ref: true, nullable: true }),
      },
    });

    interface IFooExpected {
      directly: IBar;
      ref: Reference<IBar>;
      nullableDirectly: IBar | undefined | null;
      nullableRef: Reference<IBar> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: {
          kind: ReferenceKind.MANY_TO_ONE,
          entity: expect.any(Function),
        },
        ref: {
          kind: ReferenceKind.MANY_TO_ONE,
          entity: expect.any(Function),
          ref: true,
        },
        nullableDirectly: {
          kind: ReferenceKind.MANY_TO_ONE,
          entity: expect.any(Function),
          nullable: true,
        },
        nullableRef: {
          kind: ReferenceKind.MANY_TO_ONE,
          entity: expect.any(Function),
          ref: true,
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with oneToOne relations', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.oneToOne(() => Bar),
        ref: p.oneToOne(() => Bar, { ref: true }),
        nullableDirectly: p.oneToOne(() => Bar, { nullable: true }),
        nullableRef: p.oneToOne(() => Bar, { ref: true, nullable: true }),
      },
    });

    interface IFooExpected {
      directly: IBar;
      ref: Reference<IBar>;
      nullableDirectly: IBar | undefined | null;
      nullableRef: Reference<IBar> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: {
          kind: ReferenceKind.ONE_TO_ONE,
          entity: expect.any(Function),
        },
        ref: {
          kind: ReferenceKind.ONE_TO_ONE,
          entity: expect.any(Function),
          ref: true,
        },
        nullableDirectly: {
          kind: ReferenceKind.ONE_TO_ONE,
          entity: expect.any(Function),
          nullable: true,
        },
        nullableRef: {
          kind: ReferenceKind.ONE_TO_ONE,
          entity: expect.any(Function),
          ref: true,
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with oneToMany relations', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.oneToMany(() => Bar, { mappedBy: 'foo' }),
        nullableDirectly: p.oneToMany(() => Bar, {
          mappedBy: 'foo',
          nullable: true,
        }),
      },
    });

    interface IFooExpected {
      directly: Collection<IBar>;
      nullableDirectly: Collection<IBar> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: {
          kind: ReferenceKind.ONE_TO_MANY,
          entity: expect.any(Function),
          mappedBy: 'foo',
        },
        nullableDirectly: {
          kind: ReferenceKind.ONE_TO_MANY,
          entity: expect.any(Function),
          mappedBy: 'foo',
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with manyToMany relations', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.manyToMany(() => Bar, { mappedBy: 'foo' }),
        nullableDirectly: p.manyToMany(() => Bar, {
          mappedBy: 'foo',
          nullable: true,
        }),
      },
    });

    interface IFooExpected {
      directly: Collection<IBar>;
      nullableDirectly: Collection<IBar> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: {
          kind: ReferenceKind.MANY_TO_MANY,
          entity: expect.any(Function),
          mappedBy: 'foo',
        },
        nullableDirectly: {
          kind: ReferenceKind.MANY_TO_MANY,
          entity: expect.any(Function),
          mappedBy: 'foo',
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with embedded properties', () => {
    const Foo = defineEntity({
      name: 'foo',
      properties: {
        directly: p.embedded(() => Bar),
        ref: p.embedded(() => Bar, { ref: true }),
        nullableDirectly: p.embedded(() => Bar, { nullable: true }),
        nullableRef: p.embedded(() => Bar, { ref: true, nullable: true }),
      },
    });

    interface IFooExpected {
      directly: IBar;
      ref: Reference<IBar>;
      nullableDirectly: IBar | undefined | null;
      nullableRef: Reference<IBar> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        directly: {
          kind: ReferenceKind.EMBEDDED,
          entity: expect.any(Function),
        },
        ref: {
          kind: ReferenceKind.EMBEDDED,
          entity: expect.any(Function),
          ref: true,
        },
        nullableDirectly: {
          kind: ReferenceKind.EMBEDDED,
          entity: expect.any(Function),
          nullable: true,
        },
        nullableRef: {
          kind: ReferenceKind.EMBEDDED,
          entity: expect.any(Function),
          ref: true,
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should define entity with enum properties', () => {
    enum Baz {
      A,
      B,
    }

    const ab: ('a' | 'b')[] = ['a', 'b'];

    const Foo = defineEntity({
      name: 'foo',
      properties: {
        items: p.enum(ab),
        arrayItems: p.enum(ab, { array: true }),
        refItems: p.enum(ab, { ref: true }),
        nullableItems: p.enum(ab, { nullable: true }),
        nullableRefItems: p.enum(ab, { ref: true, nullable: true }),
        enum: p.enum(() => Baz),
        enumArray: p.enum(() => Baz, { array: true }),
        enumRef: p.enum(() => Baz, { ref: true }),
        nullableEnum: p.enum(() => Baz, { nullable: true }),
        nullableEnumRef: p.enum(() => Baz, { ref: true, nullable: true }),
      },
    });

    interface IFooExpected {
      items: 'a' | 'b';
      arrayItems: ('a' | 'b')[];
      refItems: Ref<'a'> | Ref<'b'>;
      nullableItems: 'a' | 'b' | undefined | null;
      nullableRefItems: Ref<'a'> | Ref<'b'> | undefined | null;

      enum: Baz | string;
      enumArray: (Baz | string)[];
      enumRef: Ref<Baz> | Ref<string>;
      nullableEnum: Baz | string | undefined | null;
      nullableEnumRef: Ref<Baz> | Ref<string> | undefined | null;
    }

    type IFoo = InferEntity<typeof Foo>;
    assert<IsExact<IFoo, IFooExpected>>(true);

    const FooExpected = new EntitySchema<IFooExpected>({
      name: 'foo',
      properties: {
        items: { enum: true, items: ab },
        arrayItems: { enum: true, items: ab, array: true },
        refItems: { enum: true, items: ab, ref: true },
        nullableItems: { enum: true, items: ab, nullable: true },
        nullableRefItems: { enum: true, items: ab, ref: true, nullable: true },

        enum: { enum: true, items: expect.any(Function) },
        enumArray: { enum: true, items: expect.any(Function), array: true },
        enumRef: { enum: true, items: expect.any(Function), ref: true },
        nullableEnum: {
          enum: true,
          items: expect.any(Function),
          nullable: true,
        },
        nullableEnumRef: {
          enum: true,
          items: expect.any(Function),
          ref: true,
          nullable: true,
        },
      },
    });

    expect(Foo.meta.properties).toEqual(FooExpected.meta.properties);
  });

  it('should infer properties for circular reference entity', () => {
    const FooProperties = defineEntityProperties({
      bar: p.manyToOne(() => Bar, { ref: true }),
      text: p.text(),
    });

    interface IFoo extends InferEntityFromProperties<typeof FooProperties> {
      parent: Reference<IFoo>;
    }

    const Foo: EntitySchema<IFoo> = defineEntity({
      name: 'foo',
      properties: {
        ...FooProperties,
        parent: p.manyToOne(() => Foo, { ref: true }),
      },
    });

    interface IFooExpected {
      bar: Reference<IBar>;
      text: string;
      parent: Reference<IFoo>;
    }

    assert<IsExact<IFooExpected, InferEntity<typeof Foo>>>(true);
  });

  it('should infer Required properties', () => {
    const Foo = defineEntity({
      name: 'Foo',
      properties: t => ({
        id: p.integer({ primary: true }),
        normal: p.string(),
        withNullable: p.string({ nullable: true }),
        withDefault: p.string({ default: 'foo' }),
        withOnCreate: p.string({ onCreate: () => 'foo' }),
      }),
    });

    type IFoo = InferEntity<typeof Foo>;

    type RequiredFoo = RequiredEntityData<IFoo>;

    interface RequiredFooExpected {
      normal: string;
      id?: number | undefined | null;
      withNullable?: string | undefined | null;
      withDefault?: Opt<string> | undefined | null;
      withOnCreate?: Opt<string> | undefined | null;
    }

    assert<IsExact<RequiredFoo, RequiredFooExpected>>(true);
  });

  const withId = defineEntityProperties({
    id: p.integer({ primary: true }),
  });
  const WithCreatedAt = defineEntity({
    name: 'WithCreatedAt',
    properties: {
      createdAt: p.datetime({ onCreate: () => new Date() }),
    },
    abstract: true,
  });
  const withUpdatedAt = {
    updatedAt: p.datetime({
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    }),
  };
  const withDeletedAt = {
    deletedAt: p.datetime({ nullable: true }),
  };

  const Composed = defineEntity({
    name: 'Composed',
    properties: {
      ...withId,
      ...WithCreatedAt.properties,
      ...withUpdatedAt,
      ...withDeletedAt,
    },
    indexes: [{ properties: ['createdAt'] }],
  });

  const Foo = defineEntity({
    name: 'Foo',
    properties: {
      ...WithCreatedAt.properties,
      id: p.integer({ primary: true }),
      byDefault: p.text({ default: 'foo' }),
    },
  });
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [WithCreatedAt, Foo, Composed],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(() => orm.close(true));

  it('should create entity with default values', async () => {
    const foo = orm.em.create(Foo, {});
    expect(foo.createdAt).toBeInstanceOf(Date);
    expect(foo.byDefault).toBeUndefined();
    await orm.em.flush();
    expect(foo.createdAt).toBeInstanceOf(Date);
    expect(foo.byDefault).toEqual('foo');
  });

  it('should be able to compose properties', async () => {
    const composed = orm.em.create(Composed, {});
    await orm.em.flush();
    expect(composed.id).toBeDefined();
    expect(composed.createdAt).toBeInstanceOf(Date);
    expect(composed.updatedAt).toBeInstanceOf(Date);
    expect(composed.deletedAt).toBeUndefined();
  });
});
