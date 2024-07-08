import { Collection, Entity, ManyToMany, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Genre {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Movie {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne('Genre')
  genre!: Genre;

  @ManyToOne('Author')
  author!: Author;

}

@Entity()
class Person {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: false })
  name!: string;

  @ManyToMany('Person')
  friends = new Collection<Person>(this);

  @ManyToOne('Movie')
  favoriteMovie!: Movie;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Person, Movie, Author, Genre],
  });
  await orm.schema.refreshDatabase();

  const authors = ['Author 1'].map(name => {
    return orm.em.create(Author, { name });
  });

  const genres = ['Genre 1'].map(name => {
    return orm.em.create(Genre, { name });
  });

  const movies = ['Movie 1'].map((name, i) => {
    return orm.em.create(Movie, { name, genre: genres[i], author: authors[i] });
  });

  const people = ['Person 1', 'Person 2', 'Person 3'].map(name => {
    return orm.em.create(Person, { name, favoriteMovie: movies[0] });
  });

  const friends = [[1, 2], [2], [0]];

  for (let i = 0; i < friends.length; i++) {
    friends[i].map(j => people[i].friends.add(people[j]));
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('Populate referencing the same entity more than once', async () => {
  const em = orm.em.fork();

  const person = await em.findOneOrFail(Person, { id: 1 });
  expect(person.favoriteMovie.name).toBeUndefined();

  await em.populate(person, [
    'friends.favoriteMovie.author',
    'favoriteMovie.genre',
  ]);

  expect(person.favoriteMovie.genre.name).not.toBeUndefined();
});
