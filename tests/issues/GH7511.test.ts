import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { rm } from 'node:fs/promises';
import { TEMP_DIR } from '../helpers.js';

const ArticleSchema = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

describe('GH issue 7511', () => {
  const dbName = TEMP_DIR + '/gh_7511.db';

  afterAll(async () => {
    await rm(dbName, { force: true });
  });

  test('delete via second ORM works when row was inserted via first ORM', async () => {
    await rm(dbName, { force: true });

    const ormA = await MikroORM.init({
      entities: [ArticleSchema],
      dbName,
    });
    await ormA.schema.refresh();

    // a second ORM instance against the same database, sharing the EntitySchema
    const ormB = await MikroORM.init({
      entities: [ArticleSchema],
      dbName,
    });

    // create the article via ORM B (the second-initialized one — its `decorate`
    // ran last, so the entity prototype's `__meta` points to ORM B's metadata)
    const emB = ormB.em.fork();
    const article = emB.create(ArticleSchema, { title: 'foo' });
    await emB.persist(article).flush();

    // load and delete via ORM A — the entity's `__meta` is ORM B's instance,
    // but the EM's metadata storage has ORM A's instance. Same `_id`, different
    // references — the change-set group lookup in `commitDeleteChangeSets` would
    // miss without the fix in `getCommitOrder`.
    const emA = ormA.em.fork();
    const loaded = await emA.findOne(ArticleSchema, { id: article.id });
    expect(loaded).not.toBeNull();
    await emA.remove(loaded!).flush();

    // verify the row is actually gone — read with a fresh ORM B fork to bypass
    // ORM A's identity map (which would return null for the just-removed entity
    // even if the DELETE never reached the database)
    const stillThere = await ormB.em.fork().findOne(ArticleSchema, { id: article.id });
    expect(stillThere).toBeNull();

    await ormA.close(true);
    await ormB.close(true);
  });
});
