import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'tenant' })
class Tenant {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'author' })
class Author {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Tenant)
  tenant!: Tenant;
}

@Entity({ tableName: 'author' })
@Unique({ properties: ['id', 'tenant'] })
class Author1 {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Tenant)
  tenant!: Tenant;
}

@Entity({ tableName: 'book' })
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author1, {
    fieldNames: ['author_id', 'author_tenant_id'],
    referencedColumnNames: ['id', 'tenant_id'],
  })
  author!: Author1;
}

describe('constraints of new tables are created after altering existing tables (GH 8141)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Tenant, Author],
      dbName: 'mikro_orm_test_new_table_fk_ordering',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('new table FK can reference a unique constraint added to an existing table in the same diff', async () => {
    orm.discoverEntity([Author1, Book], [Author]);

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff).toMatchSnapshot();

    await orm.schema.execute(diff.up);
    await orm.schema.execute(diff.down);
  });
});
