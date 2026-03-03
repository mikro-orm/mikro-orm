import { MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Color {
  [PrimaryKeyProp]?: 'colorId';

  @PrimaryKey()
  colorId!: number;

  @Property()
  name!: string;
}

@Entity()
class BadgeNested {
  [PrimaryKeyProp]?: 'badgeId';

  @PrimaryKey()
  badgeId!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => Color,
  })
  color!: Color;
}

@Entity()
class Badge {
  [PrimaryKeyProp]?: 'badgeId';

  @PrimaryKey()
  badgeId!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => BadgeNested,
  })
  nested!: BadgeNested;
}

@Entity()
class Profile {
  [PrimaryKeyProp]?: 'user';

  @OneToOne({ entity: () => User, primary: true, ref: true })
  user!: Ref<User>;

  @ManyToOne({
    entity: () => Badge,
  })
  badge!: Badge;
}

@Entity()
class User {
  [PrimaryKeyProp]?: 'userId';

  @PrimaryKey()
  userId!: number;

  @Property()
  name!: string;

  @OneToOne({ entity: () => Profile, mappedBy: u => u.user })
  profile?: Profile;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Profile, Badge],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('returns user without profile', async () => {
  await orm.em.insert(User, {
    name: 'John',
  });

  const mock = mockLogger(orm);
  const user = await orm.em.findOneOrFail(
    User,
    { name: 'John' },
    {
      populate: ['profile.badge.nested.color'],
    },
  );

  expect(user).toMatchInlineSnapshot(`
    {
      "name": "John",
      "profile": null,
      "userId": 1,
    }
  `);

  expect(mock.mock.calls[0][0]).toMatch(
    'select `u0`.*, ' +
      '`p1`.`user_user_id` as `p1__user_user_id`, `p1`.`badge_badge_id` as `p1__badge_badge_id`, ' +
      '`b2`.`badge_id` as `b2__badge_id`, `b2`.`name` as `b2__name`, `b2`.`nested_badge_id` as `b2__nested_badge_id`, ' +
      '`n3`.`badge_id` as `n3__badge_id`, `n3`.`name` as `n3__name`, `n3`.`color_color_id` as `n3__color_color_id`, ' +
      '`c4`.`color_id` as `c4__color_id`, `c4`.`name` as `c4__name` ' +
      'from `user` as `u0` ' +
      'left join (`profile` as `p1` ' +
      'inner join `badge` as `b2` on `p1`.`badge_badge_id` = `b2`.`badge_id` ' +
      'inner join `badge_nested` as `n3` on `b2`.`nested_badge_id` = `n3`.`badge_id` ' +
      'inner join `color` as `c4` on `n3`.`color_color_id` = `c4`.`color_id`' +
      ') on `u0`.`user_id` = `p1`.`user_user_id` ' +
      "where `u0`.`name` = 'John'",
  );
});
