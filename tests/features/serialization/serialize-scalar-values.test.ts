import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM, serialize, Type } from '@mikro-orm/sqlite';

class UpperType extends Type<string, string> {
  override convertToDatabaseValue(value: string) {
    return value == null ? value : `db:${value}`;
  }

  override convertToJSValue(value: string) {
    return value?.replace(/^db:/, '');
  }

  override toJSON(value: string) {
    return value == null ? value : value.toUpperCase();
  }

  override getColumnType() {
    return 'text';
  }
}

@Entity()
class Person {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: UpperType, nullable: true })
  code?: string;

  @Property({ type: 'Date', nullable: true })
  born?: Date;

  @Property({ type: 'integer', nullable: true, groups: ['stats'] })
  score?: number;

  @Property({ type: 'string', hidden: true, nullable: true })
  secret?: string;

  @Property({ type: 'string', nullable: true, serializedName: 'nick_name' })
  nick?: string;

  @Property({ type: 'string', persist: false })
  bestFriend?: Person;

  @Property({ type: 'string', persist: false })
  greeting?: () => string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Person],
  });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(Person, {
    id: 1,
    name: 'Ann',
    code: 'a1',
    born: new Date('2000-01-02T00:00:00.000Z'),
    score: 5,
    secret: 's',
    nick: 'annie',
  });
  em.create(Person, { id: 2, name: 'Bob' });
  await em.flush();
});

afterAll(() => orm.close(true));

async function load() {
  return orm.em.fork().find(Person, {}, { orderBy: { id: 1 } });
}

test('scalar values with custom types follow `convertCustomTypes`', async () => {
  const [ann] = await load();

  expect(serialize(ann)).toEqual({
    id: 1,
    name: 'Ann',
    code: 'A1',
    born: new Date('2000-01-02T00:00:00.000Z'),
    score: 5,
    nick_name: 'annie',
  });
  expect(serialize(ann, { convertCustomTypes: true }).code).toBe('db:a1');
});

test('null scalars are kept or skipped based on `skipNull`', async () => {
  const [, bob] = await load();

  expect(serialize(bob)).toEqual({ id: 2, name: 'Bob', code: null, born: null, score: null, nick_name: null });
  expect(serialize(bob, { skipNull: true })).toEqual({ id: 2, name: 'Bob' });
});

test('scalar visibility respects `fields`, `exclude`, `groups` and `includeHidden`', async () => {
  const [ann, bob] = await load();

  expect(serialize([ann, bob], { fields: ['name', 'code'] })).toEqual([
    { name: 'Ann', code: 'A1' },
    { name: 'Bob', code: null },
  ]);
  expect(serialize(ann, { exclude: ['id', 'born', 'nick'] })).toEqual({ name: 'Ann', code: 'A1', score: 5 });
  expect(serialize(ann, { groups: ['other'] })).not.toHaveProperty('score');
  expect(serialize(ann, { groups: ['stats'] })).toHaveProperty('score', 5);
  expect(serialize(ann, { includeHidden: true })).toHaveProperty('secret', 's');
});

test('scalar properties holding entities or functions, and non-property keys, are serialized by their runtime value', async () => {
  const [ann, bob] = await load();
  ann.bestFriend = bob;
  ann.greeting = () => `hi ${ann.name}`;
  (ann as any).extra = 'x';

  const dto = serialize(ann, { populate: ['extra'] as any[] });
  expect(dto).toMatchObject({ bestFriend: 2, greeting: 'hi Ann', extra: 'x' });
  expect(Object.keys(dto)).toEqual([
    'id',
    'name',
    'code',
    'born',
    'score',
    'nick_name',
    'bestFriend',
    'greeting',
    'extra',
  ]);
  expect(serialize(ann)).not.toHaveProperty('extra');
});
