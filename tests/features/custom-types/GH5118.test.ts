import { MikroORM, Type } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class Value {

  protected readonly value: string;

  toString() {
    return this.value;
  }

  constructor(id: string) {
    this.value = id;
  }

}

class SimpleType extends Type<
  Value | undefined,
  string | undefined
> {

  constructor(private classRef: new (value: any) => Value) {
    super();
  }

  convertToDatabaseValue(
    value: Value | string | null | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.toString();
  }

  convertToJSValue(
    value: Value | string | undefined,
  ): Value | undefined {
    if (!value) {
      return undefined;
    }
    return new this.classRef(
      typeof value === 'object' ? value.toString() : value,
    );
  }

}

@Entity()
class File {

  @PrimaryKey({ type: new SimpleType(Value) })
  readonly id: Value;

  @Property({ type: new SimpleType(Value) })
  readonly uri: Value;

  constructor({ id, uri }: { id: Value; uri: Value }) {
    this.id = id;
    this.uri = uri;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    forceEntityConstructor: true,
    entities: [File],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`custom types and forceEntityConstructor`, async () => {
  await orm.em.fork().persistAndFlush(
    new File({
      id: new Value('foo'),
      uri: new Value('bar'),
    }),
  );

  const retrieved = await orm.em.findOneOrFail(File, {
    id: new Value('foo'),
  });
  expect(retrieved.id).toBeInstanceOf(Value);
  expect(retrieved.uri).toBeInstanceOf(Value);
});
