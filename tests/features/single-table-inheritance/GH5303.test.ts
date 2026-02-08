import { Cascade, Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @OneToMany({
    entity: () => CoverPicture,
    mappedBy: 'cover_user',
    orphanRemoval: true,
    eager: true,
    cascade: [Cascade.ALL],
  })
  cover_pictures: Collection<CoverPicture> = new Collection<CoverPicture>(this);

  @OneToMany({
    entity: () => ProfilePicture,
    mappedBy: 'profile_user',
    orphanRemoval: true,
    eager: true,
    cascade: [Cascade.ALL],
  })
  profile_pictures: Collection<ProfilePicture> = new Collection<ProfilePicture>(this);
}

@Entity({ abstract: true, discriminatorColumn: 'type' })
abstract class BasePicture {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', nullable: false })
  path: string;

  constructor(path: string) {
    this.path = path;
  }
}

@Entity({ discriminatorValue: 'cover' })
class CoverPicture extends BasePicture {
  @ManyToOne({ entity: () => User })
  cover_user: User;

  constructor(path: string, user: User) {
    super(path);
    this.cover_user = user;
  }
}

@Entity({ discriminatorValue: 'profile' })
class ProfilePicture extends BasePicture {
  @ManyToOne({ entity: () => User })
  profile_user: User;

  constructor(path: string, user: User) {
    super(path);
    this.profile_user = user;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, BasePicture, CoverPicture, ProfilePicture],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('user should be able to create/update pictures', async () => {
  let user = new User();
  orm.em.create(User, user);
  await orm.em.persist(user).flush();
  orm.em.clear();

  user = await orm.em.findOneOrFail(User, { id: user.id });
  user.cover_pictures.add(new CoverPicture('/path/1', user));
  user.profile_pictures.add(new ProfilePicture('/path/2', user));
  await orm.em.persist(user).flush();
  orm.em.clear();

  user = await orm.em.findOneOrFail(User, { id: user.id });
  expect(user.cover_pictures.length).toBe(1);
  expect(user.profile_pictures.length).toBe(1);

  // update pictures
  user.cover_pictures.removeAll();
  user.profile_pictures.removeAll();

  user.cover_pictures.add(new CoverPicture('/path/3', user));
  user.profile_pictures.add(new ProfilePicture('/path/4', user));

  await orm.em.persist(user).flush();
  orm.em.clear();

  user = await orm.em.findOneOrFail(User, { id: user.id });
  expect(user.cover_pictures.length).toBe(1);
  expect(user.profile_pictures.length).toBe(1);
  expect(user.cover_pictures[0].path).toBe('/path/3');
  expect(user.profile_pictures[0].path).toBe('/path/4');
});
