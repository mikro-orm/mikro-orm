const { defineConfig } = require('@mikro-orm/better-sqlite');

module.exports = defineConfig({
  dbName: ':memory:',
});
