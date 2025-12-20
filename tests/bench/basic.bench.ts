import { defineEntity, EntityManager, MikroORM, p, wrap } from '@mikro-orm/sqlite';
import { createBenchmark } from './util.js';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
    password: p.string(),
    age: p.integer().nullable(),
    termsAccepted: p.boolean().default(false),
  },
});

const orm = new MikroORM({
  dbName: ':memory:',
  entities: [User],
});
await orm.schema.create();

const { bench, result } = createBenchmark(orm);

async function createEntities(em: EntityManager) {
  for (let i = 0; i < 10_000; i++) {
    em.create(User, {
      name: `User ${i}`,
      email: `user${i}@example.com`,
      password: Math.random().toString(36).slice(-8),
    });
  }

  await em.flush();
}

await bench('create', async () => {
  const em = orm.em.fork();
  await createEntities(em);
});

await bench('find', async () => {
  const em = orm.em.fork();
  const res = await em.findAll(User);

  for (const user of res) {
    wrap(user).toObject();
  }
}, createEntities);

await bench('serialize', async ({ res }) => {
  for (const user of res) {
    wrap(user).toObject();
  }
}, async () => {
  await createEntities(orm.em.fork());
  const em = orm.em.fork();
  return { res: await em.findAll(User) };
});

await bench('update', async ({ em, res }) => {
  for (const user of res) {
    user.password = Math.random().toString(36).slice(-8);
  }

  await em.flush();
}, async () => {
  await createEntities(orm.em.fork());
  const em = orm.em.fork();
  return { em, res: await em.findAll(User) };
});

await bench('delete', async ({ em, res }) => {
  for (const user of res) {
    em.remove(user);
  }

  await em.flush();
}, async () => {
  await createEntities(orm.em.fork());
  const em = orm.em.fork();
  return { em, res: await em.findAll(User) };
});

await orm.close();

// eslint-disable-next-line no-console
console.table(result);
