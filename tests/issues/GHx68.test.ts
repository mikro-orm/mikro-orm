import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Order, order => order.tags)
  orders = new Collection<Order>(this);
}

// discovered first, so the pivot gets the flat property named after the discriminator over this
// owner's single column
@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag, tag => tag.posts, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

// the first PK column maps onto the already existing `taggable_id`, so only the second column gets
// a per-column pivot prop of its own
@Entity()
class Order {
  [PrimaryKeyProp]?: ['id', 'tenant'];

  @PrimaryKey()
  id!: number;

  @PrimaryKey()
  tenant!: number;

  @ManyToMany(() => Tag, tag => tag.orders, { pivotTable: 'taggables', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag, Post, Order],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('owner side of a polymorphic M:N pivot where the owner FK columns only partially overlap', async () => {
  const em = orm.em.fork();
  await em.insertMany(Tag, [
    { id: 10, name: 't1' },
    { id: 11, name: 't2' },
  ]);
  await em.insert(Post, { id: 5, tags: [10, 11] });
  await em.insert(Order, { id: 1, tenant: 2, tags: [10] });

  const post = await em.fork().findOneOrFail(Post, 5, { populate: ['tags'] });
  expect(post.tags.getIdentifiers()).toEqual([10, 11]);

  const order = await em.fork().findOneOrFail(Order, { id: 1, tenant: 2 }, { populate: ['tags'] });
  expect(order.tags.getIdentifiers()).toEqual([10]);

  const tag = await em.fork().findOneOrFail(Tag, 10, { populate: ['posts', 'orders'] });
  expect(tag.posts.getIdentifiers()).toEqual([5]);
  expect(tag.orders.getIdentifiers()).toEqual([[1, 2]]);
});
