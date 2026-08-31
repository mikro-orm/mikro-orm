import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

interface IFoo {
  id: number;
  name: string;
}

// Property names are embedded into the JIT-compiled hydrator/comparator source. Names that are not
// plain identifiers (quotes, brackets, dots, whitespace) must be emitted as data, not as raw code,
// otherwise they break the generated function or change its behaviour.
const weirdNames = [`weird'quote`, '[bracket]', 'has.dot', 'has space', 'back`tick', 'dollar${x}'];

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
