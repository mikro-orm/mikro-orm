import { MikroORM, sql } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user' })
class User0 {

  @PrimaryKey()
  id!: number;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey()
  id!: number;

  @Property({ default: sql.now(3), columnType: 'timestamp(3)' })
  bar!: Date;

}

@Entity({ tableName: 'user' })
class User2 {

  @PrimaryKey()
  id!: number;

  @Property({ default: sql.now(3), columnType: 'timestamp(3)' })
  bar!: Date;

}

@Entity({ tableName: 'user' })
class User3 {

  @PrimaryKey()
  id!: number;

  @Property({ default: sql.now(6), columnType: 'timestamp(6)' })
  bar!: Date;

}

@Entity({ tableName: 'user' })
class User4 {

  @PrimaryKey()
  id!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User0],
    dbName: 'mikro_orm_test_gh_4782',
    port: 3308,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
});

afterAll(() => orm.close(true));

test('4782', async () => {
  const testMigration = async (e1: any, e2: any, snap: string) => {
    if (e2) {
      orm.discoverEntity(e2, e1.name);
    }

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff).toMatchSnapshot(snap);
    await orm.schema.execute(diff.up);

    return diff.down;
  };

  const down: string[] = [];
  down.push(await testMigration(User0, undefined, '0. create schema'));
  down.push(await testMigration(User0, User1, '1. add timestamp(3) column'));
  down.push(await testMigration(User1, User2, '2. no changes'));
  down.push(await testMigration(User2, User3, '3. change to timestamp(6)'));
  down.push(await testMigration(User3, User4, '4. remove timestamp column'));

  for (const sql of down.reverse()) {
    await orm.schema.execute(sql);
  }
});
