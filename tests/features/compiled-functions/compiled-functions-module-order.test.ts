import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sqlite';
import { CompileCommand } from '../../../packages/cli/src/commands/CompileCommand.js';

// every call creates fresh metadata with new process-global ids, `reverse` mimics evaluating the entity modules in another order
function createEntities(reverse = false) {
  const createAuthor = () =>
    defineEntity({
      name: 'Author',
      properties: {
        id: p.integer().primary(),
        name: p.string(),
      },
    });
  // same class name, e.g. from another module
  const createAuthor2 = () =>
    defineEntity({
      name: 'Author',
      tableName: 'author2',
      properties: {
        id: p.integer().primary(),
        age: p.integer(),
      },
    });

  if (reverse) {
    const Author2 = createAuthor2();
    return [createAuthor(), Author2] as const;
  }

  const Author = createAuthor();
  return [Author, createAuthor2()] as const;
}

test('compiled functions do not depend on the order entity modules were evaluated in', async () => {
  const orm1 = await MikroORM.init({ entities: [...createEntities()], dbName: ':memory:' });
  const compiledFunctions: Record<string, (...args: any[]) => any> = {};

  for (const { key, contextKeys, code } of CompileCommand.capture(orm1.getMetadata(), orm1.config)) {
    // eslint-disable-next-line no-new-func
    compiledFunctions[key] = new Function(...contextKeys, `'use strict';\n` + code) as (...args: any[]) => any;
  }

  await orm1.close(true);

  const missed: string[] = [];
  const original = Utils.createFunction;
  Utils.createFunction = (context, code, cf, key) => {
    if (!key || !cf?.[key]) {
      missed.push(key ?? code);
    }

    return original.call(Utils, context, code, cf, key);
  };

  const [Author, Author2] = createEntities(true);
  let orm2: MikroORM | undefined;

  try {
    orm2 = await MikroORM.init({ entities: [Author, Author2], dbName: ':memory:', compiledFunctions });
    await orm2.schema.create();
    const author = orm2.em.create(Author, { name: 'a' });
    const author2 = orm2.em.create(Author2, { age: 42 });
    await orm2.em.flush();
    orm2.em.clear();

    expect((await orm2.em.findOneOrFail(Author, author.id)).name).toBe('a');
    expect((await orm2.em.findOneOrFail(Author2, author2.id)).age).toBe(42);
  } finally {
    Utils.createFunction = original;
    await orm2?.close(true);
  }

  expect(missed).toEqual([]);
});
