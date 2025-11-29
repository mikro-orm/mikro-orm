import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { rm } from 'node:fs/promises';
import { TEMP_DIR } from '../helpers.js';

@Entity({ tableName: 'user' })
class UserBefore {

  @PrimaryKey()
  id!: string;

  @Property()
  created: Date = new Date();

  @Property()
  updated: Date = new Date();

  @Property()
  deleted: Date = new Date();

}

@Entity({ tableName: 'user' })
class UserAfter {

  @PrimaryKey()
  id!: string;

  @Property()
  createdAt: Date = new Date();

  @Property()
  updatedAt: Date = new Date();

  @Property()
  deletedAt: Date = new Date();

}

describe('GH issue 1262', () => {

  beforeAll(async () => {
    await rm(TEMP_DIR + '/gh_1262.db', { force: true });
  });

  afterAll(async () => {
    await rm(TEMP_DIR + '/gh_1262.db', { force: true });
  });

  async function createAndRunMigration(entities: any[]) {
    const db = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities,
      dbName: TEMP_DIR + '/gh_1262.db',
    });

    await db.getSchemaGenerator().updateSchema();
    await db.close();
  }

  test('renaming multiple columns at once', async () => {
    await createAndRunMigration([UserBefore]);

    // Simulates adding `profile` to the User entity
    await createAndRunMigration([UserAfter]);
  });

});
