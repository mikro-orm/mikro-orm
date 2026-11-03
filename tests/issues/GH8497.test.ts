import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

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

  @Property({ columnType: 'char(5)[]', nullable: true })
  letters?: string[];

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
      extensions: [EntityGenerator],
    });
  });

  beforeEach(() => orm.schema.refresh());

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

  test('entity generator keeps array columns with element type modifiers as arrays', async () => {
    const [entity] = await orm.entityGenerator.generate({ entityDefinition: 'decorators' });
    expect(entity).toContain(
      `@Property({ type: 'string[]', columnType: 'timestamptz(3)[]', nullable: true })\n  timestamps?: string[];`,
    );
    expect(entity).toContain(
      `@Property({ type: 'string[]', columnType: 'numeric(12,2)[]', nullable: true })\n  amounts?: string[];`,
    );
    expect(entity).toContain(`@Property({ columnType: 'char(5)[]', nullable: true })\n  letters?: string[];`);
  });
});
