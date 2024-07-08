import { DeferMode, Entity, ManyToOne, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/postgresql';

@Entity()
@Unique({
  properties: ['parent_category_id', 'rank'],
  deferMode: 'deferred',
})
class ProductCategory {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'numeric', nullable: false, default: 0 })
  rank: number;

  @ManyToOne(() => ProductCategory, {
    columnType: 'integer',
    fieldName: 'parent_category_id',
    nullable: true,
    mapToPk: true,
  })
  parent_category_id?: number | null;

  constructor(rank: number) {
    this.rank = rank;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'test-db',
    entities: [ProductCategory],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('schema diffing', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
  delete orm.getMetadata(ProductCategory).uniques[0].deferMode;
  const diff2 = await orm.schema.getUpdateSchemaSQL();
  expect(diff2).toMatchSnapshot();
  orm.getMetadata(ProductCategory).uniques[0].deferMode = DeferMode.INITIALLY_IMMEDIATE;
  const diff3 = await orm.schema.getUpdateSchemaSQL();
  expect(diff3).toMatchSnapshot();
});

test('basic CRUD example', async () => {
  const parent = orm.em.create(ProductCategory, {
    rank: 1,
    parent_category_id: null,
  });

  await orm.em.flush();

  orm.em.create(ProductCategory, {
    rank: 1,
    parent_category_id: parent.id,
  });
  orm.em.create(ProductCategory, {
    rank: 2,
    parent_category_id: parent.id,
  });

  await orm.em.flush();

  await orm.em.fork().transactional(async em => {
    const [, cat1, cat2] = await orm.em.findAll(ProductCategory, {});

    cat1.rank = 2;
    em.persist(cat1);

    cat2.rank = 1;
    em.persist(cat2);
  });

  const [, cat1, cat2] = await orm.em.fork().findAll(ProductCategory, {});

  expect(cat1.rank).toEqual(2);
  expect(cat2.rank).toEqual(1);
});
