import { Entity, MikroORM, PrimaryKey, ManyToMany, Collection } from '@mikro-orm/core';
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

  @ManyToMany(() => Profile)
  profile = new Collection<Profile>(this);

}

describe('adding FK column', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Profile],
      driver: PostgreSqlDriver,
      dbName: 'fk-column-postgres-schema',
      schema: 'test',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
  });

  afterAll(() => orm.close(true));

  test('schema: adding 1:1 relation', async () => {
    const diff1 = await orm.schema.getCreateSchemaSQL();
    expect(diff1).toMatchSnapshot();
    const diff2 = await orm.schema.getUpdateSchemaSQL();
    expect(diff2).toMatchSnapshot();
    const diff3 = await orm.schema.getDropSchemaSQL();
    expect(diff3).toMatchSnapshot();

    await orm.schema.execute(diff1); // create
    await orm.schema.execute(diff3); // drop
    await orm.schema.execute(diff2); // update from scratch

    const diff4 = await orm.schema.getUpdateSchemaSQL();
    expect(diff4).toBe('');

    await orm.schema.execute(diff3); // drop
  });

});
