import { Collection, Cascade, Ref, MikroORM, LoadStrategy } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id?: number;

  @OneToOne(() => UserProfile, { nullable: true, ref: true })
  profile?: Ref<UserProfile>;
}

@Entity()
class UserProfile {
  @PrimaryKey()
  id?: number;

  @OneToMany(() => UserAddress, address => address.profile)
  addresses = new Collection<UserAddress>(this);

  @OneToOne(() => User, user => user.profile, { ref: true })
  user?: Ref<User>;
}

@Entity()
class UserAddress {
  @PrimaryKey()
  id?: number;

  @ManyToOne(() => UserProfile, {
    cascade: [Cascade.ALL],
    lazy: true,
    ref: true,
  })
  profile?: Ref<UserProfile>;

  @Property()
  street: string = '';
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, UserProfile, UserAddress],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const entity = orm.em.create(User, {
    id: 1,
    profile: {
      id: 1,
      addresses: [{ street: 'test' }],
    },
  });

  await orm.em.persist(entity).flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test.each(Object.values(LoadStrategy))('populating 1:M with lazy M:1 owning side (%s strategy)', async strategy => {
  const user = await orm.em.fork().findOneOrFail(User, 1, {
    populate: ['profile.addresses'],
    strategy,
  });
  expect(user.profile?.getEntity().addresses).toHaveLength(1);
});
