import 'reflect-metadata';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { remove } from 'fs-extra';
import { TEMP_DIR } from '../bootstrap';

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

  async function createAndRunMigration(entities: any[]) {
    const db = await MikroORM.init({
      type: 'sqlite',
      entities,
      dbName: TEMP_DIR + '/gh_1262.db',
    });

    await db.getSchemaGenerator().updateSchema();
    await db.close();
  }

  test('renaming multiple columns at once', async () => {
    await remove(TEMP_DIR + '/gh_1262.db');
    await createAndRunMigration([UserBefore]);

    // Simulates adding `profile` to the User entity
    await createAndRunMigration([UserAfter]);
    await remove(TEMP_DIR + '/gh_1262.db');
  });

});
