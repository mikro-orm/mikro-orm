import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToOne, Property } from '@mikro-orm/decorators/es';

// Abstract base class with decorators
abstract class BaseEntity {

  @Property({ type: 'timestamptz', defaultRaw: 'now()' })
  updated_at!: Date & Opt;

  @Property({ type: 'timestamptz', defaultRaw: 'now()' })
  created_at!: Date & Opt;

}

// Target entity for relationships
@Entity({ tableName: 'users' })
class User extends BaseEntity {

  @Property({ type: 'bigint', primary: true })
  id!: number & Opt;

  @Property({ type: 'text', nullable: true })
  name?: string & Opt;

}

// Entity A: Uses @ManyToOne for user
@Entity({ tableName: 'posts' })
class Post extends BaseEntity {

  @Property({ type: 'uuid', primary: true })
  id!: string;

  @ManyToOne({
    entity: () => User,
    nullable: true,
  })
  user?: Rel<User> & Opt; // ManyToOne relationship

}

// Entity B: Uses @OneToOne for user (same property name, different kind)
@Entity({ tableName: 'user_profiles' })
class UserProfile extends BaseEntity {

  @OneToOne({
    entity: () => User,
    primary: true,
  })
  user!: Rel<User>; // OneToOne relationship - FAILS HERE

  @Property({ type: 'json', nullable: true })
  settings?: object & Opt;

}

test('GH #7093', async () => {
  expect([User, Post, UserProfile].map(e => e.name)).toEqual(['User', 'Post', 'UserProfile']);
});
