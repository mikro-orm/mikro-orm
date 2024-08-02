import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';

@Embeddable()
class Metadata {

  @Property({ nullable: true })
  author?: string;

}

@Entity()
class UserEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  private!: boolean;

}

@Entity()
class PostEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Metadata, { nullable: true, object: true })
  meta?: Metadata;

  @ManyToOne(() => UserEntity, { ref: true })
  author!: Ref<UserEntity>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [UserEntity, PostEntity],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('Embeddables erroring with duplicate property names', async () => {
  const user = orm.em.create(UserEntity, { private: false });
  orm.em.create(PostEntity, {
    author: user,
    meta: { author: 'opengraph_author' },
  });

  await orm.em.flush();
  orm.em.clear();

  await orm.em
    .getRepository(PostEntity)
    .createQueryBuilder()
    .select('*')
    .where({
      author: { private: false },
    })
    .getSingleResult();
});
