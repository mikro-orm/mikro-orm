import { Collection, LoadStrategy, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Post, Comment],
  });
  await orm.schema.refresh();
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
