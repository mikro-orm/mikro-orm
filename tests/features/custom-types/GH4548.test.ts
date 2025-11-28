import { MikroORM } from '@mikro-orm/postgresql';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
type GeoItem = {
  kind: 'borough' | 'city' | 'county' | 'etc';
  name: string;
};

@Entity()
class ServicePerson {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'jsonb', default: '[]' })
  serviceArea: GeoItem[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [ServicePerson],
    dbName: `4548`,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('sets keys from references', async () => {
  const servicePerson = orm.em.create(ServicePerson, {
    serviceArea: [
      { kind: 'city', name: 'Mordor' },
      { kind: 'city', name: 'Gotham' },
    ],
  });
  await orm.em.persistAndFlush(servicePerson);
});
