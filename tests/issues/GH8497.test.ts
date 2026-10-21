import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class ArrayExample {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamptz(3)[]', nullable: true })
  timestamps?: Date[];

  @Property({ columnType: 'numeric(12,2)[]', nullable: true })
  amounts?: string[];

  @Property({ columnType: 'varchar(50)[]', nullable: true })
  codes?: string[];

  @Property({ columnType: 'text[]', nullable: true })
  tags?: string[];
}

describe('GH issue 8497', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [ArrayExample],
      dbName: 'mikro_orm_test_gh_8497',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('array columns with element type modifiers do not produce a diff', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('a changed element type modifier is still detected', async () => {
    await orm.em.getConnection().execute('alter table "array_example" alter column "timestamps" type timestamptz(6)[]');
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('alter column "timestamps" type timestamptz(3)[]');
    expect(diff).not.toContain('"amounts"');
  });
});
