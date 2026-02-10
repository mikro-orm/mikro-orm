import { BooleanType, Cascade, MikroORM, Opt, Ref } from '@mikro-orm/mariadb';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class UserProfile {
  @PrimaryKey()
  id!: number;

  @Property({ default: true, nullable: true, type: new BooleanType() })
  enabled?: boolean & Opt = true;

  @OneToOne(() => User, user => user.profile, {
    cascade: [Cascade.ALL],
    lazy: true,
    orphanRemoval: true,
    ref: true,
  })
  user?: Ref<User>;
}

@Entity()
class User {
  @Property({ default: true, nullable: true, type: new BooleanType() })
  enabled?: boolean & Opt = true;

  @OneToOne(() => UserProfile, profile => profile.user, {
    cascade: [Cascade.ALL],
    lazy: true,
    nullable: true,
    orphanRemoval: true,
    owner: true,
    ref: true,
  })
  profile?: Ref<UserProfile>;

  @PrimaryKey()
  id!: number;

  @Property({
    nullable: true,
    type: new BooleanType(),
  })
  verified?: boolean & Opt = false;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'boolean-prop-mapping',
    port: 3309,
    entities: [User, UserProfile],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('boolean property mapping', async () => {
  const u = orm.em.create(User, { enabled: true, profile: { enabled: true } });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, u, { populate: ['profile'] });

  expect(user?.enabled).toBe(true);
  expect(user?.profile?.$?.enabled).toBe(true);
});
