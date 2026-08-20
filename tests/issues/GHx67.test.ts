import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Param, param => param.tags)
  params = new Collection<Param>(this);

  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);
}

@Entity()
class Param {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @PrimaryKey()
  bar!: number;

  @PrimaryKey()
  baz!: number;

  @ManyToMany(() => Tag, tag => tag.params, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

// shares the pivot with `Param` but has a single PK, so the two owners are keyed by different columns
@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag, tag => tag.posts, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  // the composite owner has to be discovered first, otherwise the pivot puts the single PK owner's
  // column in its primary key as not null and the composite owner can never write a row
  orm = await MikroORM.init({
    entities: [Tag, Param, Post],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

// only the first owner of a shared pivot gets the flat property named after the discriminator, so
// the columns of every later owner have to be selected through their own per-column pivot props
test('owner side of a polymorphic M:N pivot shared by owners of different PK arity', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 10, name: 't1' },
    { id: 11, name: 't2' },
  ]);
  await em.insert(Param, { bar: 1, baz: 2, tags: [10] });
  await em.insert(Post, { id: 5, tags: [10, 11] });

  const param = await em.fork().findOneOrFail(Param, { bar: 1, baz: 2 }, { populate: ['tags'] });
  expect(param.tags.getIdentifiers()).toEqual([10]);

  const post = await em.fork().findOneOrFail(Post, 5, { populate: ['tags'] });
  expect(post.tags.getIdentifiers()).toEqual([10, 11]);

  const tag = await em.fork().findOneOrFail(Tag, 10, { populate: ['params', 'posts'] });
  expect(tag.params.getIdentifiers()).toEqual([[1, 2]]);
  expect(tag.posts.getIdentifiers()).toEqual([5]);
});
