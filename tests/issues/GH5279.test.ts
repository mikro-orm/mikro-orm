import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Product {

  @PrimaryKey()
  id!: string;

}

test('should create an entity using a single connection', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_5279',
    entities: [Product],
    port: 3308,
    pool: {
      min: 1,
      max: 1,
    },
  });
  await orm.schema.dropSchema();
  await orm.schema.createSchema();
  await orm.schema.ensureDatabase();

  const em = orm.em.fork();

  const product = new Product();
  product.id = '1';
  await em.persistAndFlush(product);

  expect(product.id).toBe('1');

  await orm.close(true);
});
