import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Test {

  @PrimaryKey()
  id!: string;

  @Property({ nullable: true })
  date?: Date;

}

test('null dates stay null when fetched', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Test],
  });

  await orm.getSchemaGenerator().refreshDatabase();

  orm.em.create(Test, {
    id: '123',
    date: undefined,
  });
  await orm.em.flush();

  const entity = await orm.em.fork().findOne(Test, '123');

  expect(entity?.date).toBeNull();

  await orm.close(true);
});
