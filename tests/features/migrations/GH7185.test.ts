import { rm } from 'node:fs/promises';
import { type IDatabaseDriver, MikroORM, Utils, defineEntity, p } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { PLATFORMS } from '../../bootstrap';

const multilineComment = 'line1;\nline2;\nline3';

const TestEntity = defineEntity({
  name: 'TestEntity',
  comment: multilineComment,
  properties: {
    id: p.integer().primary().comment(multilineComment),
    name: p.string().comment(multilineComment),
  },
});

const options = {
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { port: 1433, password: 'Root.Root' },
  postgresql: {},
};

describe.each(Utils.keys(options))('GH7185 [%s]', type => {
  let orm: MikroORM;
  const migrationPath = process.cwd() + `/temp/migrations-7185-${type}`;

  beforeAll(async () => {
    await rm(migrationPath, { recursive: true, force: true });
    orm = await MikroORM.init<IDatabaseDriver>({
      dbName: '7185',
      entities: [TestEntity],
      driver: PLATFORMS[type],
      extensions: [Migrator],
      migrations: { path: migrationPath, snapshot: false },
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('multiline comments are not split in migration SQL', async () => {
    await orm.schema.dropSchema();
    const dateMock = jest.spyOn(Date.prototype, 'toISOString');
    dateMock.mockReturnValue('2025-01-01T00:00:00.000Z');
    const migration = await orm.migrator.createMigration();
    expect(migration.code).toMatchSnapshot();
    dateMock.mockRestore();
  });
});
