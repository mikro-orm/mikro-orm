import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

export async function setup() {
  const instance = await MongoMemoryReplSet.create({
    replSet: {
      name: 'rs',
      count: 3,
    },
  });

  await instance.waitUntilRunning();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf('/'));
}

export async function teardown() {
  const instance: MongoMemoryReplSet = (global as any).__MONGOINSTANCE;
  await instance?.stop({ force: true, doCleanup: true });
}
