import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

export async function setup() {
  if ((global as any).__MONGOINSTANCE) {
    return;
  }

  try {
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to start MongoDB memory server');
  }
}

export async function teardown() {
  const instance: MongoMemoryReplSet = (global as any).__MONGOINSTANCE;

  if (!instance) {
    return;
  }

  await instance.stop({ force: true, doCleanup: true });
}
