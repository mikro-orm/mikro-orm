import { BaseEntity, Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'tags', schema: '*' })
class Tag extends BaseEntity {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ length: 128 })
  label!: string;

  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}

@Entity({ tableName: 'books', schema: '*' })
class Book extends BaseEntity {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ length: 128 })
  title!: string;

  @ManyToMany({ entity: () => Tag, cascade: [], owner: true })
  tags = new Collection<Tag>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book, Tag],
    dbName: '6575',
    schema: 'public',
  });
  await orm.schema.refreshDatabase({ schema: 'my_schema' });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6575', async () => {
  const em = orm.em.fork();
  const tag = em.create(Tag, { label: 'Tag' }, { schema: 'my_schema' });
  await em.flush();

  const book = em.create(Book, { title: 'Book', tags: [tag] }, { schema: 'my_schema' });
  await em.flush();
});
