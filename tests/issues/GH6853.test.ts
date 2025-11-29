import { MikroORM, Ref, ref } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name = 'name';

  @ManyToOne(() => User, { nullable: true })
  test?: Ref<User> = ref(User, 1);

}

test('GH #6853', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
  });
  expect(orm.getMetadata(User).properties.name.default).toBe('name');
  expect(orm.getMetadata(User).properties.test.default).toBe(1);
  await orm.close(true);
});
