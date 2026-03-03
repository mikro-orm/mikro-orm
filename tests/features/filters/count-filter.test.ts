import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
@Filter({ name: 'soft-delete', default: true, cond: { deletedAt: null } })
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  deletedAt?: Date;
}

@Entity()
class Submission {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Submission],
  });
  await orm.schema.refresh();

  const userA = orm.em.create(User, { name: 'User A', email: 'foo' });
  const userB = orm.em.create(User, { name: 'User B', email: 'bar' });
  const userC = orm.em.create(User, { name: 'User C', email: 'baz', deletedAt: new Date() });

  orm.em.create(Submission, { title: 'Submission A', user: userA });
  orm.em.create(Submission, { title: 'Submission B', user: userB });
  orm.em.create(Submission, { title: 'Submission C', user: userC });

  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('soft delete, user not populated', async () => {
  const [subs, count] = await orm.em.fork().findAndCount(Submission, {});
  expect(subs).toHaveLength(2);
  expect(count).toBe(2);
});

test('soft delete, user populated', async () => {
  const [subs, count] = await orm.em.fork().findAndCount(Submission, {}, { populate: ['user'] });
  expect(subs).toHaveLength(2);
  expect(count).toBe(2);
});
