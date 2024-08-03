import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

export = async function globalSetup() {
  let instance;
  let error;

  for (let i = 0; i < 5; i++) {
    try {
      instance = await MongoMemoryReplSet.create({
        replSet: {
          name: 'rs',
          count: 3,
        },
      });
      break;
    } catch (err) {
      error = err;
    }
  }

  if (!instance) {
    throw new Error('Cannot start mongodb memory server', { cause: error });
  }

  await instance.waitUntilRunning();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf('/'));
};
