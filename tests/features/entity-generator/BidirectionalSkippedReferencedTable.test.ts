import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, SqliteDriver } from '@mikro-orm/sqlite';
import { BASE_DIR } from '../../helpers';

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

async function initORM(noskip = false) {
  const orm = MikroORM.initSync<any>({
    dbName: ':memory:',
    entities: [Author, Book],
    baseDir: BASE_DIR,
    driver: SqliteDriver,
    debug: ['query'],
    entityGenerator: {
      bidirectionalRelations: true,
      skipTables: noskip ? undefined : ['author'],
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
