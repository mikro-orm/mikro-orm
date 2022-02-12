import 'reflect-metadata';
import { Entity, MikroORM, PrimaryKey, ManyToMany, Collection } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';


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
      type: 'postgresql',
      dbName: 'fk-column-postgres-schema',
      schema: 'test',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
  });

  afterAll(() => orm.close(true));

  test('schema: adding 1:1 relation', async () => {
    const diff1 = await orm.getSchemaGenerator().getCreateSchemaSQL();
    expect(diff1).toMatchSnapshot();
    const diff2 = await orm.getSchemaGenerator().getUpdateSchemaSQL();
    expect(diff2).toMatchSnapshot();
    const diff3 = await orm.getSchemaGenerator().getDropSchemaSQL();
    expect(diff3).toMatchSnapshot();

    await orm.getSchemaGenerator().execute(diff1); // create
    await orm.getSchemaGenerator().execute(diff3); // drop
    await orm.getSchemaGenerator().execute(diff2); // update from scratch

    const diff4 = await orm.getSchemaGenerator().getUpdateSchemaSQL();
    expect(diff4).toBe('');

    await orm.getSchemaGenerator().execute(diff3); // drop
  });

});
