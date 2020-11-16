import 'reflect-metadata';
import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { remove } from 'fs-extra';
import { TEMP_DIR } from '../bootstrap';

@Entity({ tableName: 'profile' })
class Profile {

  @PrimaryKey()
  id!: string;

}

@Entity({ tableName: 'user' })
class User {

  @PrimaryKey()
  id!: string;

}

@Entity({ tableName: 'user' })
class User2 {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => Profile)
  profile!: Profile;

}

describe('GH issue 942', () => {

  async function createAndRunMigration(entities: any[]) {
    const db = await MikroORM.init({
      type: 'sqlite',
      entities,
      dbName: TEMP_DIR + '/gh_942.db',
    });

    await db.getSchemaGenerator().updateSchema();
    await db.close();
  }

  test('schema: adding 1:1 relation', async () => {
    await remove(TEMP_DIR + '/gh_942.db');
    await createAndRunMigration([User, Profile]);

    // Simulates adding `profile` to the User entity
    await createAndRunMigration([User2, Profile]);
    await remove(TEMP_DIR + '/gh_942.db');
  });

});
