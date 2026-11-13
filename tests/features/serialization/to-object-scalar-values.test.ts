import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { type EntityMetadata, MikroORM, ReferenceKind, Type, wrap } from '@mikro-orm/sqlite';

class UpperType extends Type<string, string> {
  override toJSON(value: string) {
    return value?.toUpperCase();
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
  em.create(Person, { id: 1, name: 'Ann', code: 'a1', born: new Date('2000-01-02T00:00:00.000Z') });
  em.create(Person, { id: 2, name: 'Bob' });
  await em.flush();
});

afterAll(() => orm.close(true));

test('scalar properties holding entities or functions are serialized by their runtime value', async () => {
  const em = orm.em.fork();
  const [ann, bob] = await em.find(Person, {}, { orderBy: { id: 1 } });
  ann.bestFriend = bob;
  ann.greeting = () => `hi ${ann.name}`;

  expect(wrap(ann).toObject()).toEqual({
    id: 1,
    name: 'Ann',
    code: 'A1',
    born: new Date('2000-01-02T00:00:00.000Z'),
    bestFriend: 2,
    greeting: 'hi Ann',
  });
  expect(JSON.stringify(bob)).toBe('{"id":2,"name":"Bob","born":null}');
});

test('serialization picks up metadata changes applied via `meta.sync()`', async () => {
  const em = orm.em.fork();
  const ann = await em.findOneOrFail(Person, 1);
  const meta = orm.getMetadata(Person) as EntityMetadata<any>;
  expect(Object.keys(wrap(ann).toObject())).toEqual(['id', 'name', 'code', 'born']);

  meta.properties.code.hidden = true;
  meta.addProperty({ name: 'nick', kind: ReferenceKind.SCALAR, type: 'string', persist: false });
  (ann as any).nick = 'annie';

  try {
    expect(wrap(ann).toObject()).toEqual({
      id: 1,
      name: 'Ann',
      born: new Date('2000-01-02T00:00:00.000Z'),
      nick: 'annie',
    });
  } finally {
    meta.properties.code.hidden = false;
    meta.removeProperty('nick');
  }
});
