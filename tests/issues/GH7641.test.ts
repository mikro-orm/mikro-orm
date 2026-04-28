import { JsonType, MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class A {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  features!: string[];
}

@Entity()
class B {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'jsonb' })
  features!: string[];
}

test('GH issue 7641: json/jsonb properties with array TS type stay mapped to JsonType under TsMorph', async () => {
  const orm = await MikroORM.init({
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
    entities: [A, B],
    dbName: ':memory:',
  });

  expect(orm.getMetadata().get(A).properties.features.customType).toBeInstanceOf(JsonType);
  expect(orm.getMetadata().get(B).properties.features.customType).toBeInstanceOf(JsonType);

  await orm.close(true);
});
