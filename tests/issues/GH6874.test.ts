import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @OneToMany(() => Comment, comment => comment.post)
  comments = new Collection<Comment>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class Comment {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Post)
  post!: Post;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Post, Comment],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('stack overflow when getting entities with nested relationships', async () => {
  const posts = [];

  for (let i = 0; i < 125000; i++) {
    posts.push({ title: `Post ${i}` });
  }

  await orm.em.insertMany(Post, posts);

  // This will cause a max call stack error in EntityLoader.getChildReferences
  await orm.em.findAll(Post, {
    populate: ['comments'],
    strategy: LoadStrategy.SELECT_IN, // Also fails for LoadStrategy.BALANCED
  });
});
