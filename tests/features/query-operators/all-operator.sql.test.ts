import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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

  @Property()
  keywords!: string[];

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

describe('$all operator [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Tag, Book],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('$all is not supported by SQL drivers', async () => {
    await expect(orm.em.find(Book, { keywords: { $all: ['foo'] } })).rejects.toThrow(
      'The `$all` operator is not supported by SQL drivers, use `$contains` for array columns instead.',
    );
    await expect(orm.em.find(Book, { tags: { $all: [1, 2] } })).rejects.toThrow(
      'The `$all` operator is not supported by SQL drivers, use `$contains` for array columns instead.',
    );
  });
});
