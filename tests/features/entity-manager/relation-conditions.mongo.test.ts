import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/decorators/legacy';
import { type FilterQuery, MikroORM, ObjectId } from '@mikro-orm/mongodb';

@Entity()
class Tag {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

describe('relation conditions in MongoDB', () => {
  let orm: MikroORM;
  let author: Author;
  let tag: Tag;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tag, Author, Book],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-relation-conditions',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.clear();

    const em = orm.em.fork();
    author = em.create(Author, { name: 'Jon' });
    tag = em.create(Tag, { name: 't' });
    em.create(Book, { title: 'b1', author, tags: [tag] });
    em.create(Book, { title: 'b2', author: em.create(Author, { name: 'Bob' }) });
    await em.flush();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  const count = (where: FilterQuery<Book>) => orm.em.fork().count(Book, where);

  test('primary key conditions', async () => {
    await expect(count({ author: { _id: author._id } })).resolves.toBe(1);
    await expect(count({ author: { id: author.id } })).resolves.toBe(1);
    await expect(count({ author: { id: { $in: [author.id] } } })).resolves.toBe(1);
    await expect(count({ author: { $ne: author._id } })).resolves.toBe(1);
    await expect(count({ tags: { _id: tag._id } })).resolves.toBe(1);
    await expect(count({ tags: { $in: [tag._id] } })).resolves.toBe(1);
  });

  test('conditions on related properties throw instead of matching nothing', async () => {
    const error = 'Unsupported condition on relation Book.author, MongoDB can query relations only by primary key';
    await expect(count({ author: { name: 'Jon' } })).rejects.toThrow(error);
    await expect(count({ $or: [{ title: 'b1' }, { author: { name: 'Jon' } }] })).rejects.toThrow(error);
    await expect(count({ author: { $not: { name: 'Jon' } } })).rejects.toThrow(error);
    await expect(count({ tags: { name: 't' } })).rejects.toThrow('Unsupported condition on relation Book.tags');
  });

  test('conditions on inverse sides throw', async () => {
    const error = 'Unsupported condition on inverse side Author.books, query the owning side Book.author instead.';
    await expect(orm.em.fork().count(Author, { books: { title: 'b1' } })).rejects.toThrow(error);
    await expect(orm.em.fork().count(Author, { books: { $some: { title: 'b1' } } })).rejects.toThrow(error);
  });
});
