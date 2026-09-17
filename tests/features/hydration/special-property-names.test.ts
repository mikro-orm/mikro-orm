import { Collection, type Dictionary, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

interface IFoo {
  id: number;
  name: string;
}

// Property names are embedded into the JIT-compiled hydrator/comparator source. Names that are not
// plain identifiers (quotes, brackets, dots, whitespace) must be emitted as data, not as raw code,
// otherwise they break the generated function or change its behaviour.
const weirdNames = [`weird'quote`, '[bracket]', 'has.dot', 'has space', 'back`tick', 'dollar${x}', 'back\\slash'];

function buildSchema() {
  const schema = new EntitySchema<IFoo>({
    name: 'Foo',
    properties: {
      id: { primary: true, type: 'number' },
      name: { type: 'string' },
    },
  });

  // non-persisted so the odd name never needs to map to a real column
  for (const n of weirdNames) {
    (schema as EntitySchema<any>).addProperty(n, 'string', { persist: false, nullable: true });
  }

  return schema;
}

test('property names with special characters do not corrupt generated hydrator code', async () => {
  const schema = buildSchema();
  const orm = await MikroORM.init({ dbName: ':memory:', entities: [schema] });
  await orm.schema.create();

  const em = orm.em.fork();
  await em.insert(schema, { name: 'bar' } as IFoo);

  // first hydration compiles the hydrator; a badly escaped name would throw a SyntaxError here
  const found = await em.find(schema, {});
  expect(found).toHaveLength(1);
  expect(found[0].name).toBe('bar');

  // changes are computed via the comparator (also JIT-compiled from the same names)
  found[0].name = 'baz';
  await em.flush();

  const reloaded = await orm.em.fork().findOneOrFail(schema, { id: found[0].id });
  expect(reloaded.name).toBe('baz');

  await orm.close(true);
});

// The remaining interpolation sites in the generated hydrator and comparator: an inline embeddable's
// child names become object literal keys, `targetKey` becomes a string literal and a member access,
// composite primary keys become object literal keys, and the 1:1 back-reference is written by name.

class Address {
  ["street'quote"]?: string;
}

class Place {
  id!: number;
  name!: string;
  address!: Address;
}

test('a quote in an inline embeddable child name does not corrupt the generated hydrator', async () => {
  const address = new EntitySchema({
    class: Address,
    embeddable: true,
    properties: {
      ["street'quote"]: { type: 'string', fieldName: 'street_quote', nullable: true },
    },
  });
  const place = new EntitySchema({
    class: Place,
    properties: {
      id: { primary: true, type: 'number' },
      name: { type: 'string' },
      address: { kind: 'embedded', entity: () => Address, prefix: false, nullable: true },
    },
  });

  const orm = await MikroORM.init({ dbName: ':memory:', entities: [place, address] });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Place, { name: 'foo', address: { ["street'quote"]: 'bar' } });
  await em.flush();

  const found = await orm.em.fork().findOneOrFail(Place, { name: 'foo' });
  expect(found.address["street'quote"]).toBe('bar');

  await orm.close(true);
});

class Author {
  id!: number;
  ["uuid'quote"]!: string;
}

class Book {
  id!: number;
  author!: Author;
}

test('a quote in a `targetKey` property name does not corrupt the generated code', async () => {
  const author = new EntitySchema({
    class: Author,
    properties: {
      id: { primary: true, type: 'number' },
      ["uuid'quote"]: { type: 'string', unique: true, fieldName: 'uuid_quote' },
    },
  });
  const book = new EntitySchema({
    class: Book,
    properties: {
      id: { primary: true, type: 'number' },
      author: { kind: 'm:1', entity: () => Author, targetKey: "uuid'quote", fieldName: 'author_uuid' },
    },
  });

  const orm = await MikroORM.init({ dbName: ':memory:', entities: [author, book] });
  await orm.schema.create();

  const em = orm.em.fork();
  const a = em.create(Author, { id: 1, ["uuid'quote"]: 'u1' });
  em.create(Book, { id: 1, author: a });
  await em.flush();

  const found = await orm.em.fork().findOneOrFail(Book, { id: 1 }, { populate: ['author'] });
  expect(found.author["uuid'quote"]).toBe('u1');

  await orm.close(true);
});

class Parent {
  id!: number;
  children = new Collection<Child>(this);
}

class Child {
  ["par'ent"]!: Parent;
  seq!: number;
}

test('a quote in a composite primary key does not corrupt the generated pk getter', async () => {
  const parent = new EntitySchema({
    class: Parent,
    properties: {
      id: { primary: true, type: 'number' },
      children: { kind: '1:m', entity: () => Child, mappedBy: "par'ent" },
    },
  });
  const child = new EntitySchema({
    class: Child,
    properties: {
      ["par'ent"]: { kind: 'm:1', entity: () => Parent, primary: true, fieldName: 'parent_id' },
      seq: { primary: true, type: 'number' },
    },
  });

  const orm = await MikroORM.init({ dbName: ':memory:', entities: [parent, child] });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Parent, { id: 1, children: [{ seq: 1 }] });
  await em.flush();

  const found = await orm.em.fork().findOneOrFail(Parent, { id: 1 }, { populate: ['children'] });
  expect(found.children).toHaveLength(1);

  await orm.close(true);
});

class Owner {
  id!: number;
  target!: Target;
}

class Target {
  id!: number;
  ["owner'quote"]?: Owner;
}

test('a quote in the inverse side of a 1:1 does not mangle the back-reference', async () => {
  const owner = new EntitySchema({
    class: Owner,
    properties: {
      id: { primary: true, type: 'number' },
      target: { kind: '1:1', entity: () => Target, inversedBy: "owner'quote", owner: true },
    },
  });
  const target = new EntitySchema({
    class: Target,
    properties: {
      id: { primary: true, type: 'number' },
      ["owner'quote"]: { kind: '1:1', entity: () => Owner, mappedBy: 'target', nullable: true },
    },
  });

  const orm = await MikroORM.init({ dbName: ':memory:', entities: [owner, target] });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Owner, { id: 1, target: { id: 1 } });
  await em.flush();

  const found = await orm.em.fork().findOneOrFail(Owner, { id: 1 }, { populate: ['target'] });
  expect(found.target["owner'quote"]).toBe(found);
  expect((found.target as Dictionary).owner_quote).toBeUndefined();

  await orm.close(true);
});
