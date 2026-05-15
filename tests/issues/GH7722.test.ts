import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  deletedAt?: Date;
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // ManyToOne to a soft-deletable entity — Comment does NOT have this
  @ManyToOne(() => Author)
  author!: Author;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);
}

@Entity()
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => UserLike, like => like.user)
  likes = new Collection<UserLike>(this);
}

@Entity()
class UserLike {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => [Post, Comment], {
    strategy: 'select-in',
    discriminatorMap: {
      UserPost: 'Post',
      UserComment: 'Comment',
    },
  })
  likeable!: Post | Comment;
}

describe('GH issue 7722', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Post, Comment, UserLike, User, Author],
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populating polymorphic relation does not crash when only one target has an actively-filtered relation', async () => {
    const author = orm.em.create(Author, { name: 'John Doe' });
    const post = orm.em.create(Post, { title: 'Hello World', author });
    const comment = orm.em.create(Comment, { text: 'Great post!' });
    const user = orm.em.create(User, { name: 'Alice' });
    orm.em.create(UserLike, { user, likeable: post });
    orm.em.create(UserLike, { user, likeable: comment });
    await orm.em.flush();
    orm.em.clear();

    const userLoaded = await orm.em.findOneOrFail(User, user.id, { populate: ['likes', 'likes.likeable'] });

    expect(userLoaded.likes.length).toBe(2);
    expect(userLoaded.likes[0].likeable).toBeInstanceOf(Post);
    expect(userLoaded.likes[1].likeable).toBeInstanceOf(Comment);
  });
});
