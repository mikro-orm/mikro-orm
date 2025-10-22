import { defineEntity, p } from '@mikro-orm/core';
import { InferKyselyDB } from '@mikro-orm/knex';

describe('InferKyselyDB', () => {
  test('infer table and column', () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        fullName: p.string().primary(),
        email: p.string().nullable(),
        firstName: p.string(),
        lastName: p.string().fieldName('the_last_name'),
        profile: () => p.oneToOne(UserProfile),
      },
    });

    const UserProfile = defineEntity({
      name: 'UserProfile',
      properties: {
        user: () => p.oneToOne(User).owner(true),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
      },
    });

    type KyselyDB = InferKyselyDB<[typeof User, typeof UserProfile, typeof Post]>;
    type UserTable = KyselyDB['user'];

    expectTypeOf<UserTable>().toEqualTypeOf<{
      full_name: string;
      email: string | null;
      first_name: string;
      the_last_name: string;
    }>();
    type UserProfileTable = KyselyDB['user_profile'];
    expectTypeOf<UserProfileTable>().toEqualTypeOf<{
      user_full_name: string;
      bio: string | null;
      avatar: string | null;
      location: string | null;
  }>();
    type PostTable = KyselyDB['post'];
    expectTypeOf<PostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      description: string;
      author_full_name: string;
  }>();
  });
});

interface Generated<T> {
  readonly __select__: T;
  readonly __insert__: T | undefined;
  readonly __update__: T;
}
