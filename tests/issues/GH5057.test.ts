import { BaseEntity, Collection, MikroORM, Cascade } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

@Entity()
class LocalizedString extends BaseEntity {

  @PrimaryKey()
  id!: string;

  @Property()
  de_DE: string;

  @Property()
  en_US: string;

  constructor(de: string, en: string) {
    super();
    this.de_DE = de;
    this.en_US = en;
  }

}

enum BookGenre {
  crime = 'crime',
  fantasy = 'fantasy',
  horror = 'horror',
  romance = 'romance',
}

@Entity()
class Genre {

  @PrimaryKey()
  id!: string;

  @Property()
  type: BookGenre;

  @ManyToOne({ cascade: [Cascade.ALL], eager: true, nullable: false })
  title: LocalizedString;

  constructor(type: BookGenre, title: LocalizedString) {
    this.type = type;
    this.title = title;
  }

}

@Entity()
class Author {

  @PrimaryKey()
  id!: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: string;

  @Property()
  name: string;

  @ManyToOne()
  author: Author;

  @ManyToOne()
  genre: Genre;

  constructor(name: string, author: Author, genre: Genre) {
    this.name = name;
    this.author = author;
    this.genre = genre;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Genre, LocalizedString],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

describe('basic CRUD example', () => {
  beforeAll(async () => {
    const string1 = orm.em.create(LocalizedString, {
      id: uuidv4(),
      de_DE: 'Krimi',
      en_US: 'Crime',
    });
    const string2 = orm.em.create(LocalizedString, {
      id: uuidv4(),
      de_DE: 'Fantasy',
      en_US: 'Fantasy',
    });
    const genreCrime = orm.em.create(Genre, {
      id: uuidv4(),
      type: BookGenre.crime,
      title: string1,
    });
    const genreFantasy = orm.em.create(Genre, {
      id: uuidv4(),
      type: BookGenre.fantasy,
      title: string2,
    });
    const author = orm.em.create(Author, {
      id: uuidv4(),
      firstName: 'Jon',
      lastName: 'Snow',
    });
    await orm.em.flush();
    orm.em.create(Book, {
      id: uuidv4(),
      name: 'The Girl with the Dragon Tattoo',
      author,
      genre: genreCrime,
    });
    orm.em.create(Book, {
      id: uuidv4(),
      name: 'Game of Thrones',
      author,
      genre: genreFantasy,
    });
    await orm.em.flush();
    orm.em.clear();
  });

  test('populate books with genre', async () => {
    const authors = await orm.em.find(
      Author,
      { firstName: 'Jon' },
      { populate: ['books', 'books.genre'] },
    );
    expect(authors).toHaveLength(1);
    const books = authors[0].books;
    expect(books).toHaveLength(2);
    expect(books.map(book => book.genre.type).sort()).toEqual(
      [BookGenre.crime, BookGenre.fantasy].sort(),
    );
    // Should load title when populating books.genre according to eager: true
    expect(books.map(book => book.genre.title.en_US).sort()).toEqual(
      ['Crime', 'Fantasy'].sort(),
    );
  });
});
