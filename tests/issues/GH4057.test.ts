import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Test {

  @PrimaryKey()
  id!: string;

  @Property({ nullable: true })
  date?: Date;

}

test('null dates stay null when fetched', async () => {
  const orm = await MikroORM.init({
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
