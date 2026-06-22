import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @OneToMany(() => Label, label => label.book)
  labels = new Collection<Label>(this);
}

@Entity()
class Label {
  @PrimaryKey()
  id!: number;

  @Property()
  position!: number;

  @ManyToOne(() => Book)
  book!: Book;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book, Tag, Label],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('populateOrderBy for a sibling relation does not leak into the M:N pivot load (GH #7910)', async () => {
  const book = orm.em.create(Book, { title: 'b1' });
  book.tags.add(orm.em.create(Tag, { name: 't1' }), orm.em.create(Tag, { name: 't2' }));
  orm.em.create(Label, { position: 2, book });
  orm.em.create(Label, { position: 1, book });
  await orm.em.flush();
  orm.em.clear();

  const [loaded] = await orm.em.find(
    Book,
    {},
    {
      populate: ['tags', 'labels'],
      populateOrderBy: { labels: { position: 'asc' } },
    },
  );

  expect(loaded.tags.getItems()).toHaveLength(2);
  expect(loaded.labels.getItems().map(l => l.position)).toEqual([1, 2]);
});
