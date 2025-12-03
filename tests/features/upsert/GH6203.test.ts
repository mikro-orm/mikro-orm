import { MikroORM, Opt } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity({
  discriminatorColumn: 'skuType',
  abstract: true,
})
abstract class Sku {

  @PrimaryKey()
  id = v4();

  @Property()
  created: Date & Opt = new Date();

  @Property()
  name!: string;

  @Enum()
  skuType!: string & Opt;

}

@Entity({ discriminatorValue: 'item' })
class Item extends Sku {

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6203',
    entities: [Sku, Item],
    schema: 'foo',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('6203', async () => {
  const item1 = orm.em.create(Item, { name: 'name 1' });
  await orm.em.upsert(item1);

  const item2 = orm.em.create(Item, { name: 'name 2' });
  await orm.em.upsertMany([item2]);
});
