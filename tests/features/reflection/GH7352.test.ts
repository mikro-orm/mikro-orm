import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Entity, Enum, PrimaryKey } from '@mikro-orm/decorators/legacy';

const porosity = ['meso' as const, 'macro' as const, 'micro' as const];
type Porosity = (typeof porosity)[number];

@Entity()
class Sample {
  @PrimaryKey()
  id!: number;

  @Enum({ items: porosity })
  porosity: Porosity[] | null = null;
}

test('GH #7352 - enum array generates proper check constraint for postgres', async () => {
  const orm = await MikroORM.init({
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
    entities: [Sample],
    dbName: `mikro_orm_test_enum_array_7352`,
  });

  const meta = orm.getMetadata().get(Sample);
  expect(meta.checks).toEqual([
    {
      name: 'sample_porosity_check',
      property: 'porosity',
      expression: `"porosity" <@ array['meso'::text, 'macro'::text, 'micro'::text]`,
    },
  ]);

  await orm.schema.refresh();
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
