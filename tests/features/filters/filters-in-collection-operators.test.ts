import {
  Collection,
  Entity,
  Filter,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
@Filter({ name: 'tenant', cond: ({ tenant }) => ({ tenant }), default: true })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  tenant!: number;

}

@Entity()
class Shelf {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.shelf)
  books = new Collection<Book>(this);

}

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}

@Entity()
@Filter({ name: 'tenant', cond: ({ tenant }) => ({ tenant }), default: true })
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  tenant!: number;

  @ManyToOne(() => User)
  author!: User;

  @ManyToOne(() => Shelf)
  shelf!: Shelf;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

}

@Entity()
@Filter({ name: 'active', cond: { members: { $some: { active: true } } }, default: true })
class Team {

  @PrimaryKey()
  id!: number;

  @Property()
  active!: boolean;

  @ManyToMany(() => Member, member => member.teams)
  members = new Collection<Member>(this);

}

@Entity()
@Filter({ name: 'active', cond: { teams: { $some: { active: true } } }, default: true })
class Member {

  @PrimaryKey()
  id!: number;

  @Property()
  active!: boolean;

  @ManyToMany(() => Team)
  teams = new Collection<Team>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Shelf, Tag, Book, Team, Member],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
  orm.em.setFilterParams('tenant', { tenant: 1 });

  const alice = orm.em.create(User, { name: 'alice', tenant: 1 });
  const carol = orm.em.create(User, { name: 'carol', tenant: 2 });
  const [s1, s2, s3] = ['s1', 's2', 's3'].map(name => orm.em.create(Shelf, { name }));
  const [x, y, z] = ['x', 'y', 'z'].map(name => orm.em.create(Tag, { name }));
  orm.em.create(Book, { title: 'b1', tenant: 1, author: alice, shelf: s1, tags: [x] });
  orm.em.create(Book, { title: 'b2', tenant: 2, author: carol, shelf: s1, tags: [] });
  orm.em.create(Book, { title: 'b3', tenant: 2, author: carol, shelf: s2, tags: [y] });
  // visible book with an author hidden by the filter
  orm.em.create(Book, { title: 'b4', tenant: 1, author: carol, shelf: s3, tags: [z] });
  const team = orm.em.create(Team, { active: true });
  orm.em.create(Member, { active: true, teams: [team, orm.em.create(Team, { active: false })] });
  orm.em.create(Member, { active: false, teams: [orm.em.create(Team, { active: true })] });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

const names = (items: { name: string }[]) => items.map(i => i.name).sort();

describe.each([
  ['m:n', Tag, ['x', 'y', 'z'], { hidden: 'y', visible: 'x', other: 'z' }],
  ['1:m', Shelf, ['s1', 's2', 's3'], { hidden: 's2', visible: 's1', other: 's3' }],
] as const)('filters in collection operators (%s)', (_, entity, all, { hidden, visible, other }) => {
  test('$some ignores rows hidden by filters', async () => {
    const em = orm.em.fork();
    expect(await em.find(entity, { books: { $some: { tenant: 2 } } })).toHaveLength(0);
    expect(await em.count(entity, { books: { $some: { tenant: 2 } } })).toBe(0);
    expect(names(await em.find(entity, { books: { $some: { title: { $like: 'b%' } } } }))).toEqual([visible, other]);
  });

  test('$none ignores rows hidden by filters', async () => {
    const em = orm.em.fork();
    expect(names(await em.find(entity, { books: { $none: { tenant: 2 } } }))).toEqual(all);
    expect(await em.count(entity, { books: { $none: { tenant: 2 } } })).toBe(3);
  });

  test('$every ignores rows hidden by filters', async () => {
    const em = orm.em.fork();
    expect(names(await em.find(entity, { books: { $every: { title: 'b1' } } }))).toEqual([visible, hidden].sort());
  });

  test('filters apply to relations nested in the operator payload', async () => {
    const em = orm.em.fork();
    const where = { books: { $some: { author: { name: 'carol' } } } };
    expect(await em.find(entity, where)).toHaveLength(0);
    expect(await em.find(entity, { books: { author: { name: 'carol' } } })).toHaveLength(0);
    expect(names(await em.find(entity, { books: { $none: { author: { name: 'carol' } } } }))).toEqual(all);
    expect(names(await em.find(entity, where, { filters: false }))).toEqual(entity === Shelf ? all : ['y', 'z']);
  });

  test.each(['joined', 'select-in'] as const)('filters apply with populate (%s strategy)', async strategy => {
    const em = orm.em.fork();
    const res = await em.find(entity, { books: { $some: { tenant: 2 } } }, { populate: ['books'], strategy });
    expect(res).toHaveLength(0);
  });

  test('respects the `filters` option', async () => {
    const em = orm.em.fork();
    const where = { books: { $some: { title: 'b3' } } };
    expect(await em.find(entity, where)).toHaveLength(0);
    expect(names(await em.find(entity, where, { filters: false }))).toEqual([hidden]);
    expect(names(await em.find(entity, where, { filters: { tenant: false } }))).toEqual([hidden]);
    expect(names(await em.find(entity, where, { filters: { tenant: { tenant: 2 } } }))).toEqual([hidden]);
  });
});

test('filters referencing each other via collection operators', async () => {
  const em = orm.em.fork();
  // the third team is hidden by its own filter, as its only member is not active
  expect(await em.find(Team, { members: { $some: { active: true } } })).toHaveLength(2);
  expect(await em.find(Team, { members: { $some: { active: true } } }, { filters: false })).toHaveLength(2);
  expect(await em.find(Team, {}, { filters: false })).toHaveLength(3);
});
