import { MikroORM, Entity, PrimaryKey, Property, sql } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { BASE_DIR } from './bootstrap.js';

@Entity({ tableName: 'book5' })
class Book5 {

  @PrimaryKey()
  id!: number;

  @Property({ default: sql.now() })
  createdAt!: Date;

  @Property()
  title!: string;

  constructor(title: string) {
    this.title = title;
  }

}

describe('EntityManagerSqlite fts5 table', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book5],
      dbName: ':memory:',
      baseDir: BASE_DIR,
      metadataCache: { enabled: true, pretty: true },
      extensions: [Migrator, SeedManager, EntityGenerator],
    });
    await orm.schema.execute('create virtual table book5 using fts5(id, title, created_at)');
  });
  beforeEach(async () => orm.schema.clearDatabase());

  test('should load entities', async () => {
    const book1 = new Book5('My Life on The Wall, part 1');
    const book2 = new Book5('My Life on The Wall, part 2');
    const book3 = new Book5('My Life on The Wall, part 3');
    const book4 = new Book5('My Life on an island, part 4');
    const book5 = new Book5('My Death in a grass field, part 5');

    const repo = orm.em.getRepository(Book5);
    orm.em.persist(book1);
    orm.em.persist(book2);
    orm.em.persist(book3);
    orm.em.persist(book4);
    orm.em.persist(book5);
    await orm.em.flush();
    orm.em.clear();

    expect((await repo.count())!).toBe(5);

    // full text search test
    const fullTextBooks = (await repo.find({ title: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);
  });


  afterAll(async () => {
    await orm.close(true);
  });

});
