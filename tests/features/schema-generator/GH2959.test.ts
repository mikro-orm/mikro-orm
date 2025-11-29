import { MikroORM } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Foo {

  @PrimaryKey()
  id!: number;

  @PrimaryKey()
  something?: number;

}

@Entity()
class Bar {

  @ManyToOne()
  foo!: Foo;

  @PrimaryKey()
  id!: number;

}

test('GH issue 2959', async () => {
  const orm = await MikroORM.init({
 metadataProvider: ReflectMetadataProvider,
 dbName: ':memory:', driver: SqliteDriver, entities: [Foo, Bar] });
  await orm.schema.updateSchema();
  await orm.schema.updateSchema();
  await orm.close();
});
