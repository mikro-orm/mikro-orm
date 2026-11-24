import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schema = `
create table \`author\` (\`id\` int unsigned not null auto_increment primary key) engine = InnoDB;

create table \`book\` (
  \`id\` int unsigned not null auto_increment primary key,
  \`title\` varchar(255) not null,
  \`author_id\` int unsigned not null,
  index \`book_author_id_index\` (\`author_id\`),
  index \`book_author_id_title_index\` (\`author_id\`, \`title\`),
  constraint \`book_author_id_foreign\` foreign key (\`author_id\`) references \`author\` (\`id\`)
) engine = InnoDB;

create table \`review\` (
  \`id\` int unsigned not null auto_increment primary key,
  \`title\` varchar(255) not null,
  \`author_id\` int unsigned not null,
  index \`review_author_id_title_index\` (\`author_id\`, \`title\`),
  constraint \`review_author_id_foreign\` foreign key (\`author_id\`) references \`author\` (\`id\`)
) engine = InnoDB;
`;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gen_skip_covered_fk_indexes',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
    ensureDatabase: false,
  });
  await orm.schema.dropDatabase();
  await orm.schema.ensureDatabase({ create: true });
  await orm.schema.execute(schema);
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

describe.each(['decorators', 'entitySchema', 'defineEntity'] as const)('entityDefinition=%s', entityDefinition => {
  const generate = async (skipCoveredForeignKeyIndexes: boolean) => {
    orm.config.get('schemaGenerator').skipCoveredForeignKeyIndexes = skipCoveredForeignKeyIndexes;
    const [author, book, review] = await orm.entityGenerator.generate({ entityDefinition });

    return { author, book, review };
  };

  test('keeps the covered foreign key index explicitly when the option is enabled', async () => {
    const { book, review } = await generate(true);
    expect(book).toMatch(/index(: true|\(true\))/);
    expect(review).not.toMatch(/index(: true|\(true\))/);
  });

  test('relies on the implicit foreign key index by default', async () => {
    const { book } = await generate(false);
    expect(book).not.toMatch(/index(: true|\(true\))/);
  });
});
