import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
    entities: [User0],
    dbName: ':memory:',
  });
});

afterAll(() => orm.close(true));

test('GH #4919', async () => {
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
  down.push(await testMigration(User0, User1, '1. rename column'));

  for (const sql of down.reverse()) {
    await orm.schema.execute(sql);
  }
});
