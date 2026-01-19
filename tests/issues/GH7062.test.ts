import { Hidden, HiddenProps, JsonType, MikroORM, Opt, serialize } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class User {

  // For object-type hidden props, use HiddenProps symbol
  [HiddenProps]?: 'secretData' | 'hiddenDate';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // JSON property should be present in EntityDTO
  @Property({ type: JsonType })
  data!: Record<string, string>;

  // Date property should be present in EntityDTO (not incorrectly detected as hidden)
  @Property()
  createdAt!: Opt<Date>;

  // Hidden scalar property should be excluded from EntityDTO
  @Property({ hidden: true })
  password!: Hidden<string>;

  // Hidden object property - uses HiddenProps symbol above
  @Property({ type: JsonType, hidden: true })
  secretData!: Record<string, unknown>;

  // Hidden Date property - uses HiddenProps symbol above
  @Property({ hidden: true })
  hiddenDate!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close();
});

test('GH7062 - JsonType properties should be present in EntityDTO', async () => {
  const now = new Date();
  const user = orm.em.create(User, {
    name: 'John',
    data: { foo: 'bar', baz: 'qux' },
    createdAt: now,
    password: 'secret123',
    secretData: { key: 'value' },
    hiddenDate: now,
  });
  await orm.em.persist(user).flush();

  // Type test: data property should be accessible on EntityDTO
  const dto = serialize(user);
  expect(dto.data).toEqual({ foo: 'bar', baz: 'qux' });
  expect(dto.name).toBe('John');
  expect(dto.id).toBe(1);

  // Date property should be present in EntityDTO (not incorrectly detected as hidden)
  expect(dto.createdAt).toBeDefined();

  // Hidden scalar property should not be in serialized output
  // @ts-expect-error - password is hidden
  expect(dto.password).toBeUndefined();

  // Hidden object property (via HiddenProps) should not be in serialized output
  // @ts-expect-error - secretData is hidden via HiddenProps
  expect(dto.secretData).toBeUndefined();

  // Hidden Date property (via HiddenProps) should not be in serialized output
  // @ts-expect-error - hiddenDate is hidden via HiddenProps
  expect(dto.hiddenDate).toBeUndefined();
});
