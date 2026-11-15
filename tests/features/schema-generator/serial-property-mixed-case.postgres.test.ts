import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'SomeThing' })
class SomeThing0 {
  @PrimaryKey()
  id!: number;

  @Property()
  _id!: number;
}

@Entity({ tableName: 'SomeThing' })
class SomeThing1 {
  @PrimaryKey()
  id!: number;

  @Property({ autoincrement: true })
  _id!: number;
}

test('making a column autoincrement works with a mixed case table name', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [SomeThing0],
    dbName: `mikro_orm_test_serial_mixed_case`,
  });

  await orm.schema.refresh();
  await orm.em.insert(SomeThing0, { id: 1, _id: 5 });

  orm.discoverEntity(SomeThing1, SomeThing0);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain(`select setval('"SomeThing__id_seq"', (select max("_id") from "SomeThing"));`);
  expect(diff).toContain(`alter table "SomeThing" alter column "_id" set default nextval('"SomeThing__id_seq"');`);
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');

  // the sequence continues after the existing values
  await orm.em.getConnection().execute(`insert into "SomeThing" ("id") values (2)`);
  const rows = await orm.em.getConnection().execute(`select "_id" from "SomeThing" where "id" = 2`);
  expect(rows).toEqual([{ _id: 6 }]);

  await orm.close(true);
});
