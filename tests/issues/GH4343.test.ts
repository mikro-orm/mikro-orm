import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { ref, Ref } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
class LocalizedString {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property()
  de_DE: string;

  @Property({ nullable: true })
  en_US?: string;

  constructor(de: string) {
    this.de_DE = de;
  }

}

@Entity()
class Book {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @ManyToOne(() => LocalizedString, { ref: true })
  title: Ref<LocalizedString>;

  @ManyToOne(() => LocalizedString, { ref: true, nullable: true })
  description?: Ref<LocalizedString>;

  constructor(title: string, description: string) {
    this.title = ref(new LocalizedString(title));
    this.description = ref(new LocalizedString(description));
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    dbName: ':memory:',
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

it('GH #4343', async () => {
  async function request(id: number) {
    const books = await orm.em.find(Book, {}, {
      populate: ['description', 'title'],
    });
    expect(books[0].title.isInitialized()).toBe(true);
    expect(books[0].description?.isInitialized()).toBe(true);
  }

  const book = new Book('mikro-orm', 'Book about mikro-orm');
  await orm.em.fork().persist(book).flush();

  await Promise.all([request(1), request(2)]);
});
