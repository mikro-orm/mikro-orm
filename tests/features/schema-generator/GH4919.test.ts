import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user' })
class User0 {

  @PrimaryKey()
  id!: number;

  @Property()
  deliveredAt!: Date;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey()
  id!: number;

  @Property()
  completedAt!: Date;

  @Property()
  canceledAt!: Date;

  @Property()
  arrivedAt!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User0],
    dbName: 'mikro_orm_test_gh_4919',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
});

afterAll(() => orm.close(true));

test('4782', async () => {
  const testMigration = async (e1: any, e2: any, snap: string) => {
    if (e2) {
      orm.getMetadata().reset(e1.name);
      await orm.discoverEntity(e2);
    }

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff).toMatchSnapshot(snap);
    await orm.schema.execute(diff.up);

    return diff.down;
  };

  const down: string[] = [];
  down.push(await testMigration(User0, undefined, '0. create schema'));
  down.push(await testMigration(User0, User1, '1. rename column'));

  for (const sql of down.reverse()) {
    await orm.schema.execute(sql);
  }
});
