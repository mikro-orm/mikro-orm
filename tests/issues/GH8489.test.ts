import { MikroORM } from '@mikro-orm/pglite';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
@Index({
  name: 'book_author_created_idx',
  columns: [{ name: 'authorId' }, { name: 'createdAt', sort: 'DESC' }, { name: 'id', sort: 'DESC' }],
})
@Index({
  name: 'book_id_author_idx',
  columns: [
    { name: 'id', sort: 'DESC' },
    { name: 'authorId', sort: 'DESC', nulls: 'LAST' },
  ],
})
class Book {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  authorId!: number;

  @Property({ type: 'Date' })
  createdAt!: Date;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'memory://',
    entities: [Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8489: index column whose name is the end of an earlier column keeps its sort order', async () => {
  // `id` is the end of `author_id`, and `author_id` comes after `id` in the second index
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
