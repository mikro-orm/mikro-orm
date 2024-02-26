import { Entity, PrimaryKey } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
class Product {

  @PrimaryKey()
  id!: string;

}

test('should create an entity using a single connection', async () => {
  const orm = await MikroORM.init({
    dbName: 'mikro_orm_5279',
    entities: [Product],
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
