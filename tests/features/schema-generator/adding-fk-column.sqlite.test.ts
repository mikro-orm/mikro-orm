import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { LibSqlDriver } from '@mikro-orm/libsql';

@Entity()
class Profile {

  @PrimaryKey()
  id!: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: string;

}

@Entity({ tableName: 'user' })
class User2 {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => Profile, undefined, { nullable: true })
  profile!: Profile;

}

const drivers = {
  sqlite: SqliteDriver,
  libsql: LibSqlDriver,
};

describe.each(['sqlite', 'libsql'] as const)('adding FK column (GH 942, %s)', driver => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<any>({
      entities: [User, Profile],
      driver: drivers[driver],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema: adding 1:1 relation', async () => {
    orm.discoverEntity(User2, 'User');
    const diff1 = await orm.schema.getUpdateSchemaSQL();
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // sqlite does not support automatic down migrations
    const diff2 = await orm.schema.getUpdateSchemaMigrationSQL();
    expect(diff2.down).toBe('');
  });

});
