import 'reflect-metadata';
import { Constructor, Entity, MikroORM, PrimaryKey, t } from '@mikro-orm/core';
import { PostgreSqlDriver, SchemaGenerator } from '@mikro-orm/postgresql';

@Entity({ tableName: 'user' })
class User0 {

  @PrimaryKey({ type: t.text })
  id!: string;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey({ type: t.integer, autoincrement: false })
  id!: number;

}

@Entity({ tableName: 'user' })
class User2 {

  @PrimaryKey({ type: t.integer })
  id!: number;

  @PrimaryKey({ type: t.integer })
  id2!: number;

}

@Entity({ tableName: 'user' })
class User3 {

  @PrimaryKey({ type: t.integer, autoincrement: false })
  id!: number;

}

@Entity({ tableName: 'user' })
class User4 {

  @PrimaryKey({ type: t.integer })
  id!: number;

}

@Entity({ tableName: 'user' })
class User5 {

  @PrimaryKey({ type: t.text })
  id!: string;

}

describe('changing PK column type [postgres] (GH 1480)', () => {

  let orm: MikroORM<PostgreSqlDriver>;
  let generator: SchemaGenerator;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User0],
      dbName: 'mikro_orm_test_gh_1480',
      type: 'postgresql',
    });
    generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.dropSchema();
  });

  afterAll(() => orm.close(true));

  test('change PK type from json to serial', async () => {
    const generator = orm.getSchemaGenerator();
    const testMigration = async (e1: Constructor, e2: Constructor | undefined, snap: string) => {
      if (e2) {
        await orm.discoverEntity(e2);
        orm.getMetadata().reset(e1.name);
      }

      const diff = await generator.getUpdateSchemaSQL({ wrap: false });
      expect(diff).toMatchSnapshot(snap);
      await generator.execute(diff);
    };

    await testMigration(User0, undefined, '0. create schema with text PK');
    await testMigration(User0, User1, '1. change PK type from text to int');
    await testMigration(User1, User2, '2. add new PK (make it composite PK)');
    await testMigration(User2, User3, '3. remove old PK (make it single PK again)');
    await testMigration(User3, User4, '4. change PK type from int to serial');
    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await testMigration(User4, User5, '5. change PK type from serial to text');
    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

});
