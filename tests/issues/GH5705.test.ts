import { MikroORM, Ref, Collection, DateTimeType, Opt, wrap } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  readonly id!: bigint;

  @OneToMany(() => Rating, a => a.user)
  ratings = new Collection<Rating>(this);

  @OneToOne({
    entity: () => Rating,
    ref: true,
    nullable: true,
    formula: (cols, tableAlias) => {
      return `(select rating.id
              from rating
              where rating.user_id = ${tableAlias}.id
              order by rating.created_at desc
              limit 1)`;

    },
  })
  currentRating?: Ref<Rating>;

  @Property({ type: DateTimeType })
  createdAt: Opt<Date> = new Date();

}

@Entity()
class Rating {

  @PrimaryKey()
  readonly id!: bigint;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @Property({ type: DateTimeType })
  createdAt: Opt<Date> = new Date();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Rating],
    dbName: 'gh-5705',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('escape table name in formula correctly', async () => {
  const user = orm.em.create(User, {});
  orm.em.create(Rating, { user: wrap(user).toReference() });
  orm.em.create(Rating, { user: wrap(user).toReference() });
  orm.em.create(Rating, { user: wrap(user).toReference() });
  orm.em.create(Rating, { user: wrap(user).toReference() });
  orm.em.create(Rating, { user: wrap(user).toReference() });

  await orm.em.flush();
  orm.em.clear();

  const query = orm.em.createQueryBuilder(User, 'someUser')
    .leftJoin('currentRating', 'someUserRating');

  await expect(query.getResult()).resolves.not.toThrow();
});
