import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Series {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => SeriesPost, seriesPost => seriesPost.series)
  seriesPosts = new Collection<SeriesPost>(this);
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @OneToOne({
    ref: true,
    mappedBy: 'post',
    orphanRemoval: true,
    entity: () => SeriesPost,
  })
  seriesPost?: Ref<SeriesPost>;

  @Property({
    nullable: true,
  })
  publishedAt?: Date;
}

@Entity()
class SeriesPost {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Post, {
    nullable: true,
    deleteRule: 'set null',
  })
  previousPart?: Post;

  @OneToOne(() => Post, {
    nullable: true,
    deleteRule: 'set null',
  })
  nextPart?: Post;

  @ManyToOne(() => Series, { deleteRule: 'cascade' })
  series!: Series;

  @OneToOne({
    ref: true,
    entity: () => Post,
    deleteRule: 'cascade',
    inversedBy: 'seriesPost',
  })
  post!: Ref<Post>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Post],
  });
  await orm.schema.refresh();

  orm.em.create(SeriesPost, {
    post: {},
    series: {},
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6635', async () => {
  const [posts, total] = await orm.em.findAndCount(
    Post,
    {},
    {
      strategy: 'select-in',
      populate: ['seriesPost', 'seriesPost.series', 'seriesPost.nextPart', 'seriesPost.previousPart'],
      populateWhere: {
        seriesPost: {
          $or: [
            {
              nextPart: {
                publishedAt: {
                  $ne: null,
                },
              },
            },
            {
              previousPart: {
                publishedAt: {
                  $ne: null,
                },
              },
            },
          ],
        },
      },
    },
  );
  expect(posts.length).toBe(1);
  expect(total).toBe(1);
});
