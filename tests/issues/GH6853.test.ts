import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, Ref, ref } from '@mikro-orm/sqlite';

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
    entities: [User],
    dbName: ':memory:',
  });
  expect(orm.getMetadata(User).properties.name.default).toBe('name');
  expect(orm.getMetadata(User).properties.test.default).toBe(1);
  await orm.close(true);
});
