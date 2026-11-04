import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
abstract class Party {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
abstract class Principal extends Party {
  @ManyToMany(() => Party)
  associates = new Collection<Party>(this);
}

@Entity()
class User extends Principal {
  @Property({ nullable: true })
  email?: string;
}

@Entity()
class Employee extends Principal {
  @Property({ nullable: true })
  title?: string;
}

@Entity()
class Contact extends Party {
  @Property({ nullable: true })
  phone?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Party, Principal, User, Employee, Contact],
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('M:N declared on an intermediate TPT entity uses one pivot table with separate columns', async () => {
  const meta = orm.getMetadata();
  const principal = meta.get(Principal).properties.associates;
  const user = meta.get(User).properties.associates;
  const employee = meta.get(Employee).properties.associates;

  expect(principal.pivotTable).toBe('principal_associates');
  expect(principal.joinColumns).toEqual(['principal_id']);
  expect(principal.inverseJoinColumns).toEqual(['party_id']);
  expect(user.pivotTable).toBe(principal.pivotTable);
  expect(employee.pivotTable).toBe(principal.pivotTable);
  expect(user.joinColumns).toEqual(principal.joinColumns);
  expect(employee.inverseJoinColumns).toEqual(principal.inverseJoinColumns);

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).not.toMatch('user_associates');
  expect(sql).not.toMatch('employee_associates');
});

test('pivot table mapping does not depend on discovery order', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Employee, Contact, Principal, Party],
  });
  const meta = orm2.getMetadata();

  for (const entity of [Principal, User, Employee]) {
    const prop = meta.get(entity).properties.associates;
    expect(prop.pivotTable).toBe('principal_associates');
    expect(prop.joinColumns).toEqual(['principal_id']);
    expect(prop.inverseJoinColumns).toEqual(['party_id']);
  }

  await orm2.close(true);
});

test('M:N declared on an intermediate TPT entity loads the associated entity', async () => {
  const contact = orm.em.create(Contact, { name: 'contact' });
  const user = orm.em.create(User, { name: 'user' });
  const employee = orm.em.create(Employee, { name: 'employee' });
  user.associates.add(contact, employee);
  employee.associates.add(user);
  await orm.em.flush();
  orm.em.clear();

  const u = await orm.em.findOneOrFail(User, user.id, { populate: ['associates'] });
  expect(u.associates.getIdentifiers().sort()).toEqual([contact.id, employee.id].sort());

  const e = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['associates'] });
  expect(e.associates.getIdentifiers()).toEqual([user.id]);

  const p = await orm.em.findOneOrFail(Principal, user.id, { populate: ['associates'] });
  expect(p.associates.getIdentifiers().sort()).toEqual([contact.id, employee.id].sort());
});

@Entity({ inheritance: 'tpt', tableName: 'party2' })
abstract class Party2 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Principal2, p => p.associates)
  associatedBy = new Collection<Principal2>(this);
}

@Entity({ tableName: 'principal2' })
abstract class Principal2 extends Party2 {
  @ManyToMany(() => Party2, p => p.associatedBy, { owner: true })
  associates = new Collection<Party2>(this);
}

@Entity({ tableName: 'user2' })
class User2 extends Principal2 {}

@Entity({ tableName: 'contact2' })
class Contact2 extends Party2 {}

test.each([
  [Party2, Principal2, User2, Contact2],
  [Contact2, User2, Principal2, Party2],
])('inverse side inherited by TPT children loads the owners regardless of discovery order', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Party2, Principal2, User2, Contact2]) {
    expect(orm2.getMetadata().get(entity).properties.associatedBy.inverseJoinColumns).toEqual(['principal2_id']);
  }

  const em = orm2.em.fork();
  const contact = em.create(Contact2, { name: 'contact' });
  const user = em.create(User2, { name: 'user' });
  user.associates.add(contact);
  await em.flush();
  em.clear();

  const c = await em.findOneOrFail(Contact2, contact.id, { populate: ['associatedBy'] });
  expect(c.associatedBy.getIdentifiers()).toEqual([user.id]);

  await orm2.close(true);
});

@Entity({ tableName: 'label3' })
class Label3 {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'special_label3' })
class SpecialLabel3 {
  @PrimaryKey()
  id!: number;
}

@Entity({ inheritance: 'tpt', tableName: 'item3' })
abstract class Item3 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Label3)
  labels = new Collection<Label3 | SpecialLabel3>(this);
}

@Entity({ tableName: 'book3' })
class Book3 extends Item3 {
  @ManyToMany(() => SpecialLabel3)
  declare labels: Collection<SpecialLabel3>;
}

@Entity({ tableName: 'magazine3' })
class Magazine3 extends Item3 {
  @ManyToMany(() => Label3, undefined, { pivotTable: 'magazine3_custom_labels' })
  declare labels: Collection<Label3>;
}

@Entity({ tableName: 'journal3' })
class Journal3 extends Item3 {
  @ManyToMany(() => Label3, undefined, { joinColumn: 'journal3_id' })
  declare labels: Collection<Label3>;
}

test.each([
  [Label3, SpecialLabel3, Item3, Book3, Magazine3, Journal3],
  [Journal3, Magazine3, Book3, Item3, SpecialLabel3, Label3],
])(
  'TPT subclass redeclaring an M:N with another target, pivot table or join column keeps its own pivot table',
  async (...entities) => {
    const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
    const meta = orm2.getMetadata();

    expect(meta.get(Item3).properties.labels.pivotTable).toBe('item3_labels');
    expect(meta.get(Book3).properties.labels.pivotTable).toBe('book3_labels');
    expect(meta.get(Magazine3).properties.labels.pivotTable).toBe('magazine3_custom_labels');
    expect(meta.get(Journal3).properties.labels.pivotTable).toBe('journal3_labels');
    expect(meta.get(Journal3).properties.labels.joinColumns).toEqual(['journal3_id']);

    const sql = await orm2.schema.getCreateSchemaSQL();
    expect(sql).toMatch(/`magazine3_custom_labels_item3_id_foreign` foreign key \(`item3_id`\) references `magazine3`/);
    expect(sql).toMatch(/`journal3_labels_journal3_id_foreign` foreign key \(`journal3_id`\) references `journal3`/);

    await orm2.close(true);
  },
);

@Entity({ inheritance: 'tpt', tableName: 'animal4' })
abstract class Animal4 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Cat4, c => c.fans, { owner: true })
  favoriteCats = new Collection<Cat4>(this);
}

@Entity({ tableName: 'dog4' })
class Dog4 extends Animal4 {}

@Entity({ tableName: 'cat4' })
class Cat4 extends Animal4 {
  @ManyToMany(() => Animal4, a => a.favoriteCats)
  fans = new Collection<Animal4>(this);
}

test.each([
  [Animal4, Dog4, Cat4],
  [Cat4, Dog4, Animal4],
])('M:N declared on the TPT root targeting a subclass uses separate columns', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Animal4, Dog4, Cat4]) {
    const prop = orm2.getMetadata().get(entity).properties.favoriteCats;
    expect(prop.pivotTable).toBe('animal4_favorite_cats');
    expect(prop.joinColumns).toEqual(['animal4_id']);
    expect(prop.inverseJoinColumns).toEqual(['cat4_id']);
  }

  const em = orm2.em.fork();
  const dog = em.create(Dog4, {});
  const cat = em.create(Cat4, {});
  dog.favoriteCats.add(cat);
  await em.flush();
  em.clear();

  const a = await em.findOneOrFail(Animal4, dog.id, { populate: ['favoriteCats'] });
  expect(a.favoriteCats.getIdentifiers()).toEqual([cat.id]);
  const c = await em.findOneOrFail(Cat4, cat.id, { populate: ['fans'] });
  expect(c.fans.getIdentifiers()).toEqual([dog.id]);

  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'party5' })
abstract class Party5 {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'principal5' })
class Principal5 extends Party5 {
  @ManyToMany(() => Contact5)
  contacts = new Collection<Contact5>(this);
}

@Entity({ tableName: 'contact5' })
class Contact5 extends Party5 {}

test('M:N between two TPT subclasses names both join columns after the subclasses', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Party5, Principal5, Contact5],
  });
  const prop = orm2.getMetadata().get(Principal5).properties.contacts;
  expect(prop.pivotTable).toBe('principal5_contacts');
  expect(prop.joinColumns).toEqual(['principal5_id']);
  expect(prop.inverseJoinColumns).toEqual(['contact5_id']);

  const sql = await orm2.schema.getCreateSchemaSQL();
  expect(sql).toMatch(/foreign key \(`contact5_id`\) references `contact5`/);

  await orm2.close(true);
});

@Entity({ tableName: 'label6' })
class Label6 {
  @PrimaryKey()
  id!: number;
}

@Entity({ inheritance: 'tpt', tableName: 'item6' })
abstract class Item6 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Label6, undefined, { joinColumn: 'item_ref_id' })
  labels = new Collection<Label6>(this);
}

@Entity({ tableName: 'book6' })
class Book6 extends Item6 {}

@Entity({ tableName: 'journal6' })
class Journal6 extends Item6 {
  @ManyToMany(() => Label6, undefined, { inverseJoinColumn: 'lbl_id' })
  declare labels: Collection<Label6>;
}

@Entity({ tableName: 'weekly6' })
class Weekly6 extends Journal6 {}

@Entity({ tableName: 'magazine6' })
class Magazine6 extends Item6 {
  @ManyToMany(() => Label6, undefined, { pivotTable: 'item6_labels' })
  declare labels: Collection<Label6>;
}

@Entity({ tableName: 'comic6' })
class Comic6 extends Item6 {
  @ManyToMany(() => Label6)
  declare labels: Collection<Label6>;
}

test.each([
  [Label6, Item6, Book6, Journal6, Weekly6, Magazine6, Comic6],
  [Comic6, Magazine6, Weekly6, Journal6, Book6, Item6, Label6],
])('explicit join columns on the declaring TPT entity are inherited, not redeclared', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  const meta = orm2.getMetadata();

  for (const entity of [Item6, Book6, Magazine6, Comic6]) {
    expect(meta.get(entity).properties.labels.pivotTable).toBe('item6_labels');
    expect(meta.get(entity).properties.labels.joinColumns).toEqual(['item_ref_id']);
  }

  expect(meta.get(Journal6).properties.labels.pivotTable).toBe('journal6_labels');
  expect(meta.get(Weekly6).properties.labels.pivotTable).toBe('journal6_labels');
  expect(meta.get(Weekly6).properties.labels.inverseJoinColumns).toEqual(['lbl_id']);

  const sql = await orm2.schema.getCreateSchemaSQL();
  expect(sql).toMatch(/create table `item6_labels` \(`item_ref_id` integer not null/);
  expect(sql).not.toMatch('book6_labels');
  expect(sql).not.toMatch('weekly6_labels');
  expect(sql).not.toMatch('comic6_labels');

  await orm2.close(true);
});

@Entity({ tableName: 'label7' })
class Label7 {
  @PrimaryKey()
  id!: number;
}

@Entity({ inheritance: 'tpt', tableName: 'item7' })
abstract class Item7 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Label7, undefined, { pivotTable: 'item7_custom_labels' })
  labels = new Collection<Label7>(this);
}

@Entity({ tableName: 'book7' })
class Book7 extends Item7 {}

@Entity({ tableName: 'comic7' })
class Comic7 extends Item7 {
  @ManyToMany(() => Label7)
  declare labels: Collection<Label7>;
}

test.each([
  [Label7, Item7, Book7, Comic7],
  [Comic7, Book7, Item7, Label7],
])(
  'redeclared M:N without options shares the explicit pivot table of the declaring TPT entity',
  async (...entities) => {
    const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
    const meta = orm2.getMetadata();

    for (const entity of [Item7, Book7, Comic7]) {
      expect(meta.get(entity).properties.labels.pivotTable).toBe('item7_custom_labels');
    }

    const sql = await orm2.schema.getCreateSchemaSQL();
    expect(sql).not.toMatch('item7_labels');

    await orm2.close(true);
  },
);

@Entity({ inheritance: 'tpt', tableName: 'party8' })
abstract class Party8 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Party8)
  friends = new Collection<Party8>(this);
}

@Entity({ tableName: 'user8' })
class User8 extends Party8 {}

@Entity({ tableName: 'contact8' })
class Contact8 extends Party8 {}

test.each([
  [Party8, User8, Contact8],
  [Contact8, User8, Party8],
])('self-referencing M:N on the TPT root shares one pivot table regardless of discovery order', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Party8, User8, Contact8]) {
    const prop = orm2.getMetadata().get(entity).properties.friends;
    expect(prop.pivotTable).toBe('party8_friends');
    expect(prop.joinColumns).toEqual(['party8_1_id']);
    expect(prop.inverseJoinColumns).toEqual(['party8_2_id']);
  }

  const em = orm2.em.fork();
  const user = em.create(User8, {});
  const contact = em.create(Contact8, {});
  user.friends.add(contact);
  await em.flush();
  em.clear();

  const u = await em.findOneOrFail(User8, user.id, { populate: ['friends'] });
  expect(u.friends.getIdentifiers()).toEqual([contact.id]);
  const p = await em.findOneOrFail(Party8, user.id, { populate: ['friends'] });
  expect(p.friends.getIdentifiers()).toEqual([contact.id]);

  await orm2.close(true);
});

@Entity({ tableName: 'tag9' })
class Tag9 {
  @PrimaryKey()
  id!: number;
}

@Entity({ inheritance: 'tpt', tableName: 'item9' })
abstract class Item9 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag9, undefined, { fixedOrder: true })
  orderedTags = new Collection<Tag9>(this);
}

@Entity({ tableName: 'book9' })
class Book9 extends Item9 {}

test.each([
  [Tag9, Item9, Book9],
  [Book9, Item9, Tag9],
])('fixed order column of an inherited M:N is shared regardless of discovery order', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();
  const meta = orm2.getMetadata();
  expect(meta.get(Book9).properties.orderedTags.fixedOrderColumn).toBe(
    meta.get(Item9).properties.orderedTags.fixedOrderColumn,
  );

  const em = orm2.em.fork();
  const book = em.create(Book9, {});
  book.orderedTags.add(em.create(Tag9, {}), em.create(Tag9, {}));
  await em.flush();
  em.clear();

  const b = await em.findOneOrFail(Book9, book.id, { populate: ['orderedTags'] });
  expect(b.orderedTags.getIdentifiers()).toEqual([1, 2]);

  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'party10' })
abstract class Party10 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Party10)
  friends = new Collection<Party10>(this);
}

@Entity({ tableName: 'user10' })
class User10 extends Party10 {
  @ManyToMany(() => Party10, undefined, { pivotTable: 'user10_friends' })
  declare friends: Collection<Party10>;
}

@Entity({ tableName: 'contact10' })
class Contact10 extends Party10 {}

test.each([
  [Party10, User10, Contact10],
  [User10, Party10, Contact10],
])('self-referencing M:N redeclared with its own pivot table keeps its columns', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  const meta = orm2.getMetadata();
  const root = meta.get(Party10).properties.friends;
  const user = meta.get(User10).properties.friends;
  expect(root.joinColumns).toEqual(['party10_1_id']);
  expect(meta.get(Contact10).properties.friends.joinColumns).toEqual(['party10_1_id']);
  expect(user.pivotTable).toBe('user10_friends');
  expect(user.joinColumns).toEqual(['user10_id']);
  expect(user.inverseJoinColumns).toEqual(['party10_id']);

  const sql = await orm2.schema.getCreateSchemaSQL();
  expect(sql).toMatch(/create table `user10_friends` \(`user10_id` integer not null, `party10_id` integer not null/);

  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'party11' })
abstract class Party11 {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'principal11' })
class Principal11 extends Party11 {
  @ManyToMany(() => Principal11)
  peers = new Collection<Principal11>(this);
}

@Entity({ tableName: 'user11' })
class User11 extends Principal11 {}

test.each([
  [Party11, Principal11, User11],
  [User11, Principal11, Party11],
])('self-referencing M:N on an intermediate TPT entity is shared by its subclasses', async (...entities) => {
  const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
  await orm2.schema.create();

  for (const entity of [Principal11, User11]) {
    const prop = orm2.getMetadata().get(entity).properties.peers;
    expect(prop.pivotTable).toBe('principal11_peers');
    expect(prop.joinColumns).toEqual(['principal11_1_id']);
    expect(prop.inverseJoinColumns).toEqual(['principal11_2_id']);
  }

  const em = orm2.em.fork();
  const user = em.create(User11, {});
  const other = em.create(Principal11, {});
  user.peers.add(other);
  await em.flush();
  em.clear();

  const u = await em.findOneOrFail(User11, user.id, { populate: ['peers'] });
  expect(u.peers.getIdentifiers()).toEqual([other.id]);

  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'tag12' })
class Tag12 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Post12, post => post.tags)
  posts = new Collection<Post12>(this);

  @ManyToMany(() => Video12, video => video.tags)
  videos = new Collection<Video12>(this);
}

@Entity({ tableName: 'special_tag12' })
class SpecialTag12 extends Tag12 {}

@Entity({ tableName: 'post12' })
class Post12 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag12, tag => tag.posts, { pivotTable: 'taggables12', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag12>(this);
}

@Entity({ tableName: 'video12' })
class Video12 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag12, tag => tag.videos, { pivotTable: 'taggables12', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag12>(this);
}

test('polymorphic inverse M:N inherited by a TPT subclass keeps its discriminator', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Tag12, SpecialTag12, Post12, Video12],
  });
  await orm2.schema.create();

  const em = orm2.em.fork();
  const tag = em.create(SpecialTag12, {});
  const post = em.create(Post12, { id: 1 });
  const video = em.create(Video12, { id: 1 });
  post.tags.add(tag);
  video.tags.add(tag);
  await em.flush();
  em.clear();

  const t = await em.findOneOrFail(SpecialTag12, tag.id, { populate: ['posts', 'videos'] });
  expect(t.posts.getIdentifiers()).toEqual([1]);
  expect(t.videos.getIdentifiers()).toEqual([1]);

  await orm2.close(true);
});

test('inherited M:N keeps the inverse side declared against the TPT subclass', async () => {
  @Entity()
  class Label {
    @PrimaryKey()
    id!: number;

    @ManyToMany(() => Member, m => m.labels)
    members = new Collection<Member>(this);
  }

  @Entity({ inheritance: 'tpt' })
  abstract class Account {
    @PrimaryKey()
    id!: number;

    @ManyToMany(() => Label)
    labels = new Collection<Label>(this);
  }

  @Entity()
  class Member extends Account {
    @Property({ nullable: true })
    email?: string;
  }

  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Label, Account, Member],
  });
  await orm2.schema.create();
  expect(orm2.getMetadata().get(Member).properties.labels.inversedBy).toBe('members');

  const member = orm2.em.create(Member, {});
  const label = orm2.em.create(Label, {});
  member.labels.add(label);
  expect(label.members.contains(member, false)).toBe(true);
  await orm2.em.flush();
  orm2.em.clear();

  const loaded = await orm2.em.findOneOrFail(Label, label, { populate: ['members'] });
  expect(loaded.members.getIdentifiers()).toEqual([member.id]);
  await orm2.close(true);
});

@Entity({ inheritance: 'tpt', tableName: 'party13' })
abstract class Party13 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Party13, p => p.friendOf, { owner: true })
  friends = new Collection<Party13>(this);

  @ManyToMany(() => Party13, p => p.friends)
  friendOf = new Collection<Party13>(this);
}

@Entity({ tableName: 'user13' })
class User13 extends Party13 {}

test.each([
  [Party13, User13],
  [User13, Party13],
])(
  'inverse side of a bidirectional self-referencing M:N on the TPT root is inherited with its columns',
  async (...entities) => {
    const orm2 = await MikroORM.init({ metadataProvider: ReflectMetadataProvider, dbName: ':memory:', entities });
    await orm2.schema.create();
    expect(orm2.getMetadata().get(User13).properties.friendOf.joinColumns).toEqual(['party13_2_id']);

    const em = orm2.em.fork();
    const user = em.create(User13, {});
    const friend = em.create(User13, {});
    user.friends.add(friend);
    await em.flush();
    em.clear();

    const f = await em.findOneOrFail(User13, friend.id, { populate: ['friendOf'], strategy: 'joined' });
    expect(f.friendOf.getIdentifiers()).toEqual([user.id]);

    await orm2.close(true);
  },
);

@Entity({ tableName: 'tag14' })
class Tag14 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Post14, post => post.tags)
  posts = new Collection<Post14>(this);

  @ManyToMany(() => Video14, video => video.tags)
  videos = new Collection<Video14>(this);
}

@Entity({ inheritance: 'tpt', tableName: 'post14' })
class Post14 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag14, tag => tag.posts, { pivotTable: 'taggables14', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag14>(this);
}

@Entity({ tableName: 'article14' })
class Article14 extends Post14 {}

@Entity({ tableName: 'video14' })
class Video14 {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag14, tag => tag.videos, { pivotTable: 'taggables14', discriminator: 'taggable', owner: true })
  tags = new Collection<Tag14>(this);
}

test('polymorphic owner M:N inherited by a TPT subclass keeps its own discriminator value', async () => {
  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Tag14, Post14, Article14, Video14],
  });
  await orm2.schema.create();

  const em = orm2.em.fork();
  const tag = em.create(Tag14, {});
  const article = em.create(Article14, {});
  article.tags.add(tag);
  await em.flush();
  em.clear();

  const a = await em.findOneOrFail(Article14, article.id, { populate: ['tags'] });
  expect(a.tags.getIdentifiers()).toEqual([tag.id]);

  await orm2.close(true);
});
