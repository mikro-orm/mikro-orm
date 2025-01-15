import { defineConfig } from '@mikro-orm/better-sqlite';

export default defineConfig({
  dbName: ':memory:',
  discovery: {
    warnWhenNoEntities: false,
  },
});
