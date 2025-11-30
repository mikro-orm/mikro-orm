import { MikroORM, Collection } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Comment, comment => comment.user)
  comments = new Collection<Comment>(this);

  toForceHandleCommentsProp: Comment[] = [];

  constructor(props?: { comments: Comment[] }) {
    this.toForceHandleCommentsProp = props?.comments ? props.comments : [];
  }

}

@Entity()
export class Comment {

  @PrimaryKey()
  id!: bigint;

  @ManyToOne()
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Comment],
    forceEntityConstructor: true,
    loadStrategy: 'joined',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('GH6092', async () => {
  const user = new User();
  user.comments.add(new Comment(), new Comment());
  await orm.em.persistAndFlush(user);
  orm.em.clear();

  const users = await orm.em.findAll(User, { populate: ['comments'] });
  expect(users[0].comments.count()).toBe(2);
  expect(users[0].toForceHandleCommentsProp.length).toBe(2);
});
