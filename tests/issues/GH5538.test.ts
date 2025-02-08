import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, sql } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @ManyToMany({ entity: () => Tag, inversedBy: tag => tag.users })
  tags = new Collection<Tag, this>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany({
    entity: () => User,
    mappedBy: user => user.tags,
  })
  users = new Collection<User, this>(this);

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5538',
    entities: [User],
  });
  await orm.schema.refreshDatabase();

  const tag = orm.em.create(Tag, { name: 'Tag' });
  const u1 = orm.em.create(User, { name: 'Foo', email: 'foo' });
  const u2 = orm.em.create(User, { name: 'Foo', email: 'foo2' });
  u2.tags.add(tag);
  const u3 = orm.em.create(User, { name: 'Foo', email: 'foo3' });
  u3.tags.add(tag);
  const u4 = orm.em.create(User, { name: 'Bar', email: 'bar' });
  u4.tags.add(tag);
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('join query builder without limit', async () => {
  const result = await orm.em
    .createQueryBuilder(User, 'user1')
    .leftJoin(orm.em.createQueryBuilder(User), 'user2', {
      'user1.id': sql.ref('user2.id'),
    })
    .where({ tags: { name: 'Tag' } })
    .getResult();
  expect(result.length).toEqual(3);
});

test('join query builder with limit', async () => {
  const result = await orm.em
    .createQueryBuilder(User, 'user1')
    .leftJoin(orm.em.createQueryBuilder(User), 'user2', {
      'user1.id': sql.ref('user2.id'),
    })
    .where({ tags: { name: 'Tag' } })
    .limit(1)
    .getResult();
  expect(result.length).toEqual(1);
});
