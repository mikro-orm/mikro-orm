import 'reflect-metadata';
import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Profile],
      type: 'sqlite',
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema: adding 1:1 relation', async () => {
    await orm.discoverEntity(User2);
    orm.getMetadata().reset('User');
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL();
    expect(diff1).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff1);

    // sqlite does not support automatic down migrations
    const diff2 = await orm.getSchemaGenerator().getUpdateSchemaMigrationSQL();
    expect(diff2.down).toBe('');
  });

});
