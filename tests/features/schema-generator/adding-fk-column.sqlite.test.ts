import 'reflect-metadata';
import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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

describe('adding FK column (GH 942)', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Profile],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema: adding 1:1 relation', async () => {
    orm.getMetadata().reset('User');
    await orm.discoverEntity(User2);
    const diff1 = await orm.schema.getUpdateSchemaSQL();
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    // sqlite does not support automatic down migrations
    const diff2 = await orm.schema.getUpdateSchemaMigrationSQL();
    expect(diff2.down).toBe('');
  });

});
