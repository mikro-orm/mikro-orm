import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

test(`default value for relation property`, async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const a = orm.em.create(Book, { title: 'b', author: { name: 'a' } });
  await orm.em.persist(a).flush();
  await orm.close(true);
});
