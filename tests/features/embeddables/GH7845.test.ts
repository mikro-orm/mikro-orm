import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

enum TagType {
  CATEGORY,
  KEYWORD,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class BaseTag {
  @Enum(() => TagType)
  type!: TagType;

  @Property({ type: 'string' })
  name!: string;
}

@Embeddable({ discriminatorValue: TagType.CATEGORY })
class CategoryTag extends BaseTag {
  @Property({ type: 'number' })
  category: number;

  constructor(name: string, category: number) {
    super();
    this.type = TagType.CATEGORY;
    this.name = name;
    this.category = category;
  }
}

@Embeddable({ discriminatorValue: TagType.KEYWORD })
class KeywordTag extends BaseTag {
  @Property({ type: 'string' })
  keyword: string;

  constructor(name: string, keyword: string) {
    super();
    this.type = TagType.KEYWORD;
    this.name = name;
    this.keyword = keyword;
  }
}

@Entity()
class Group {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name: string;

  @OneToMany(() => User, user => user.group)
  users = new Collection<User>(this);

  @Embedded(() => [KeywordTag, CategoryTag], { array: true })
  tags: (KeywordTag | CategoryTag)[] = [];

  constructor(name: string, tags: (KeywordTag | CategoryTag)[]) {
    this.name = name;
    this.tags = tags;
  }
}

@Entity()
class User {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name: string;

  @ManyToOne(() => Group, { nullable: true })
  group?: Group;

  constructor(name: string, group?: Group) {
    this.name = name;
    this.group = group;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Group, User, BaseTag, CategoryTag, KeywordTag],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close());

test('polymorphic embedded array is populated when loaded through a relation', async () => {
  const group = new Group('g1', [new CategoryTag('c1', 1), new KeywordTag('k1', 'kw')]);
  orm.em.create(User, new User('u1', group));
  await orm.em.flush();
  orm.em.clear();

  const users = await orm.em.findAll(User, { populate: ['group'] });
  expect(users[0].group!.tags).toHaveLength(2);
  expect(users[0].group!.tags[0]).toBeInstanceOf(CategoryTag);
  expect(users[0].group!.tags[0]).toMatchObject({ type: TagType.CATEGORY, name: 'c1', category: 1 });
  expect(users[0].group!.tags[1]).toBeInstanceOf(KeywordTag);
  expect(users[0].group!.tags[1]).toMatchObject({ type: TagType.KEYWORD, name: 'k1', keyword: 'kw' });
});
