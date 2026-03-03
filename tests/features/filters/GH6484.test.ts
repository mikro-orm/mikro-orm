import { Collection, MikroORM, Rel } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
@Filter({ name: 'active', cond: { active: true }, default: true })
class Pen {
  @PrimaryKey()
  id!: number;

  @Property()
  brand!: string;

  @ManyToOne(() => Author)
  author!: Rel<Author>;

  @Property({ nullable: true })
  deletedAt?: Date;

  @Property({ default: true })
  active!: boolean;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Pen, pen => pen.author)
  pen = new Collection<Pen>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Pen, Author, Book],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic example', async () => {
  const author = orm.em.create(Author, { name: 'John Doe', pen: { brand: 'Bic', active: true } });
  orm.em.create(Book, { title: 'Book 1', author });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findAll(Book, { where: { author: { pen: { brand: 'Bic' } } } });
});
