import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  age!: number;

  @Property()
  email!: string;

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  price!: number;

  @ManyToOne({ entity: () => Author })
  author!: Author;

}

async function initORM() {
  const orm = new MikroORM<any>({
    dbName: ':memory:',
    entities: [Author, Book],
    entityGenerator: {
      bidirectionalRelations: true,
      skipTables: ['author'],
    },
    extensions: [EntityGenerator],
  });
  await orm.schema.refreshDatabase();

  return orm;
}

describe('BidirectionalSkippedReferencedTable', () => {
  test('generate entities with bidirectional relations and skipped referenced table', async () => {
    const orm = await initORM();
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('entity-bidirectional-skipped-tables-dump');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
